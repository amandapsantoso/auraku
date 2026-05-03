import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Heart, HeartOff, Share2, Loader2, Info, Camera, Image as ImageIcon } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { generateOutfitRecommendation, type OutfitRecommendation } from '../../lib/gemini';
import { generateTryOnImageOpenAI } from '../../lib/openai';

interface StylistProps {
  preSelectedItems?: any[];
  onClearPreSelected?: () => void;
}

export function Stylist({ preSelectedItems = [], onClearPreSelected }: StylistProps) {
  const [occasion, setOccasion] = useState('casual');
  const [customOccasion, setCustomOccasion] = useState('');
  const [clothingItems, setClothingItems] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitRecommendation | null>(null);
  const [lockedItems, setLockedItems] = useState<any[]>(preSelectedItems);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [isTryingOn, setIsTryingOn] = useState(false);
  const [selectedTryOnItems, setSelectedTryOnItems] = useState<any[]>([]);
  const [tempUserPhoto, setTempUserPhoto] = useState<string | null>(null);
  const [tempClothingPhoto, setTempClothingPhoto] = useState<string | null>(null);

  const toggleTryOnItem = (item: any) => {
    setSelectedTryOnItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, item];
    });
    setTryOnImage(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'clothing') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'user') setTempUserPhoto(reader.result as string);
        else setTempClothingPhoto(reader.result as string);
        setTryOnImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Automatically set the first item (top) as default try-on input when outfit changes
  useEffect(() => {
    if (currentOutfit) {
      const outfitItems = getOutfitItems();
      const defaultItem = outfitItems.find(i => ['top', 'outerwear', 'shirt', 'blouse', 'tshirt', 'jacket', 'cardigan'].includes(i.category)) || outfitItems[0];
      if (defaultItem) setSelectedTryOnItems([defaultItem]);
    }
  }, [currentOutfit, clothingItems]);

  useEffect(() => {
    if (preSelectedItems.length > 0) {
      setLockedItems(preSelectedItems);
      // We don't automatically generate because the user might want to pick occasion first
    }
  }, [preSelectedItems]);

  const occasions = [
    { id: 'casual', name: 'Casual', emoji: '👟' },
    { id: 'work', name: 'Work', emoji: '💼' },
    { id: 'formal', name: 'Formal', emoji: '👔' },
    { id: 'date', name: 'Date Night', emoji: '💕' },
    { id: 'party', name: 'Party', emoji: '🎉' },
  ];

  useEffect(() => {
    const q = query(collection(db, 'closet_items'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClothingItems(items);
    }, (error) => {
      console.error("Error fetching closet items for stylist: ", error);
    });

    const profileRef = doc(db, 'user_profiles', 'default_user');
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    });

    return () => {
      unsubscribe();
      unsubProfile();
    };
  }, []);

  const handleGenerate = async () => {
    if (clothingItems.length === 0) {
      alert("Your closet is empty! Go to the Closet tab to upload some clothes first.");
      return;
    }

    setIsGenerating(true);
    setTryOnImage(null); // Clear previous try-on when generating new outfit

    try {
      const occasionName = occasions.find(o => o.id === occasion)?.name || occasion;
      const fullOccasion = customOccasion ? `${occasionName}: ${customOccasion}` : occasionName;
      
      const recommendation = await generateOutfitRecommendation(
        clothingItems, 
        fullOccasion, 
        userProfile, 
        lockedItems.map(item => item.id) // Pass locked IDs
      );
      setCurrentOutfit(recommendation);
    } catch (e: any) {
      console.error("Stylist Error:", e);
      alert(`Failed to generate outfit: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryOn = async () => {
    if (!currentOutfit) return;
    
    setIsTryingOn(true);
    try {
      const outfitItems = getOutfitItems();
      const topItem = outfitItems.find(i => ['top', 'outerwear', 'shirt', 'blouse', 'tshirt', 'jacket', 'cardigan'].includes(i.category));
      const bottomItem = outfitItems.find(i => ['bottom', 'skirt', 'pants', 'jeans'].includes(i.category));
      const shoesItem = outfitItems.find(i => i.category === 'shoes');

      const top = topItem ? `${topItem.color} ${topItem.name} made of ${topItem.material}` : undefined;
      const bottom = bottomItem ? `${bottomItem.color} ${bottomItem.name} made of ${bottomItem.material}` : undefined;
      const shoes = shoesItem ? `${shoesItem.color} ${shoesItem.name}` : undefined;

      const clothingImageUrls = [
        tempClothingPhoto,
        ...selectedTryOnItems.map(item => item.imageUrl)
      ].filter(Boolean) as string[];

      const userPhoto = tempUserPhoto || userProfile?.profileImageUrl;
      if (!userPhoto) {
        alert("Please upload a photo of yourself first!");
        return;
      }
      if (clothingImageUrls.length === 0) {
        alert("Please select or upload at least one clothing item!");
        return;
      }

      const imageUrl = await generateTryOnImageOpenAI(
        { top, bottom, shoes }, 
        userPhoto,
        clothingImageUrls
      );
      setTryOnImage(imageUrl);
    } catch (e: any) {
      console.error("Try On Error:", e);
      alert(`Failed to generate try-on picture: ${e.message || "Please check your API quota"}`);
    } finally {
      setIsTryingOn(false);
    }
  };

  const handleSaveTryOnToLookbook = async () => {
    if (!tryOnImage || !currentOutfit) return;
    
    try {
      // 1. Compress the image further to fit Firestore 1MB limit
      const img = new Image();
      img.src = tryOnImage;
      await new Promise((resolve) => img.onload = resolve);
      
      const canvas = document.createElement("canvas");
      const MAX_SAVE_SIZE = 1024;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > MAX_SAVE_SIZE) {
          h = Math.round((h * MAX_SAVE_SIZE) / w);
          w = MAX_SAVE_SIZE;
        }
      } else {
        if (h > MAX_SAVE_SIZE) {
          w = Math.round((w * MAX_SAVE_SIZE) / h);
          h = MAX_SAVE_SIZE;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, w, h);
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

      const lookbookRef = collection(db, 'lookbook');
      const newEntry = {
        ...currentOutfit,
        imageUrl: compressedBase64, // Use compressed version
        isAiGenerated: true,
        userId: 'default_user',
        createdAt: new Date().toISOString(),
        items: getOutfitItems().map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category
        }))
      };
      
      await setDoc(doc(lookbookRef), newEntry);
      alert("Look saved to your Lookbook! ❤️✨");
    } catch (e) {
      console.error("Error saving try-on to lookbook:", e);
      alert("Failed to save to lookbook.");
    }
  };

  const handleSaveOutfit = async () => {
    if (!currentOutfit) return;
    
    try {
      const lookbookRef = collection(db, 'lookbook');
      const newOutfit = {
        ...currentOutfit,
        userId: 'default_user', // Using default_user as we don't have Auth yet
        createdAt: new Date().toISOString(),
        items: getOutfitItems().map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          emoji: item.emoji,
          category: item.category
        }))
      };
      
      await setDoc(doc(lookbookRef), newOutfit);

      // Also update the profile count for persistence
      const profileRef = doc(db, 'user_profiles', 'default_user');
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const liked = data.likedOutfits || [];
        const newOutfitId = currentOutfit.name;
        if (!liked.includes(newOutfitId)) {
          await updateDoc(profileRef, { likedOutfits: [...liked, newOutfitId] });
        }
      }

      alert("Outfit saved to your Lookbook! ❤️");
    } catch (e) {
      console.error("Error saving outfit to lookbook:", e);
      alert("Failed to save outfit.");
    }
  };

  const handleDislike = async () => {
    if (!currentOutfit) return;
    
    try {
      const profileRef = doc(db, 'user_profiles', 'default_user');
      const docSnap = await getDoc(profileRef);
      
      const outfitId = currentOutfit.name;
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const disliked = data.dislikedOutfits || [];
        if (!disliked.includes(outfitId)) {
          await updateDoc(profileRef, { dislikedOutfits: [...disliked, outfitId] });
        }
      }
      
      alert("AI will avoid this style in the future. Regenerating for you...");
      handleGenerate(); 
    } catch (e) {
      console.error(e);
      alert("Failed to save dislike.");
    }
  };

  // Helper to find the actual item object from the DB based on the Gemini recommended ID
  const getOutfitItems = () => {
    if (!currentOutfit) return [];
    return currentOutfit.itemIds
      .map(id => clothingItems.find(item => item.id === id))
      .filter(Boolean); // Remove any nulls if Gemini hallucinated an ID
  };

  return (
    <div className="size-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4 pb-24">
        {/* Occasion Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Pick a vibe or describe your event:</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {occasions.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setOccasion(occ.id)}
                className={`p-2 rounded-xl text-center transition-all ${
                  occasion === occ.id
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500 scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <span className="text-xl mb-0.5 block">{occ.emoji}</span>
                <span className="text-[8px] font-bold uppercase">{occ.name}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              placeholder="Tell me more... e.g. 'Beach wedding in Bali', '90s Grunge for a concert', 'Job interview for a tech company'"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all h-20 resize-none"
            />
            {customOccasion && (
              <button 
                onClick={() => setCustomOccasion('')}
                className="absolute top-2 right-2 text-[10px] text-gray-400 hover:text-purple-600 font-bold"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Locked Items Selection */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Want to wear something specific?</h3>
            {lockedItems.length > 0 && (
              <button 
                onClick={() => {
                  setLockedItems([]);
                  if (onClearPreSelected) onClearPreSelected();
                }}
                className="text-[10px] text-red-500 font-bold"
              >
                CLEAR ALL
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {lockedItems.map(item => (
              <div key={item.id} className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-200 animate-in zoom-in-50">
                <span className="text-[10px] font-bold truncate max-w-[80px]">{item.name}</span>
                <button onClick={() => {
                  setLockedItems(prev => prev.filter(i => i.id !== item.id));
                  // Note: we don't clear pre-selected here, just local lock
                }}>
                  <RefreshCw className="size-3 opacity-60 hover:opacity-100 rotate-45" />
                </button>
              </div>
            ))}
            {lockedItems.length < 5 && (
              <button 
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="flex items-center gap-1.5 bg-gray-50 text-gray-400 px-2.5 py-1.5 rounded-lg border border-gray-200 border-dashed hover:bg-gray-100 transition-colors"
              >
                <Sparkles className="size-3" />
                <span className="text-[10px] font-bold uppercase">Add Fixed Item</span>
              </button>
            )}
          </div>

          {isPickerOpen && (
            <div className="bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto grid grid-cols-4 gap-2 animate-in slide-in-from-top-2">
              {clothingItems
                .filter(item => !lockedItems.find(li => li.id === item.id))
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setLockedItems(prev => [...prev, item]);
                      setIsPickerOpen(false);
                    }}
                    className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col items-center justify-center hover:border-purple-300 transition-all"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[8px] text-gray-500 truncate w-full text-center mt-1">{item.name}</span>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || clothingItems.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md text-sm disabled:opacity-50 active:scale-95"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Gemini is styling you...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate AI Outfit
            </>
          )}
        </button>

        {/* Current Outfit Recommendation */}
        {currentOutfit ? (
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 text-white shadow-lg animate-in slide-in-from-bottom-4 fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold mb-0.5">{currentOutfit.name}</h2>
                <p className="text-purple-100 text-xs">{currentOutfit.styleVibe}</p>
              </div>
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                <div className="text-2xl font-bold">{currentOutfit.matchScore}%</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold">Match</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {getOutfitItems().map((item: any, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center shadow-inner relative overflow-hidden group">
                  {/* Background Image if available */}
                  {item.imageUrl && (
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <p className="font-semibold text-xs mb-1 truncate" title={item.name}>{item.name}</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[10px] text-white/80 bg-black/20 rounded-full px-2 py-0.5 inline-block backdrop-blur-sm">
                        {item.category}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTryOnItem(item);
                        }}
                        className={`p-1 rounded-full backdrop-blur-sm transition-all ${
                          selectedTryOnItems.find(i => i.id === item.id) 
                            ? 'bg-green-500 text-white scale-110 shadow-lg' 
                            : 'bg-white/20 hover:bg-white/40 text-white'
                        }`}
                        title="Add to Try On"
                      >
                        <Camera className="size-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveOutfit}
                className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <Heart className="size-3.5" />
                Like
              </button>
              <button 
                onClick={handleDislike}
                className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-red-500/20 transition-colors rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <HeartOff className="size-3.5" />
                Dislike
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Next
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-center">
              <span className="text-[8px] uppercase tracking-widest font-bold opacity-60 flex items-center gap-1">
                <Sparkles className="size-2" /> Styling by Gemini 3 Flash Preview
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-8 text-center flex flex-col items-center justify-center text-purple-800">
            <Sparkles className="size-8 mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">Your AI Stylist is ready</p>
            <p className="text-xs opacity-70">
              {clothingItems.length === 0 
                ? "Upload some clothes to your closet first!" 
                : `I found ${clothingItems.length} items in your closet.`}
            </p>
          </div>
        )}

        {/* Style Insights & Image Prompt */}
        {currentOutfit && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-in fade-in delay-150">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Info className="size-4 text-purple-600" /> 
                Stylist Reasoning
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed text-xs">
                  "{currentOutfit.reasoning}"
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-gray-900 w-16">Weather:</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{currentOutfit.seasonalFit}</span>
                </div>
              </div>
            </div>

            {/* Try On Section */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-in fade-in delay-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <ImageIcon className="size-4 text-pink-600" /> 
                  AI Visualization
                </h3>
                <div className="flex flex-col items-end gap-2">
                  <label className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1.5 w-full justify-center">
                    <Camera className="size-3" />
                    {tempUserPhoto ? 'Change My Photo' : 'Upload My Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'user')} />
                  </label>
                  <label className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5 w-full justify-center">
                    <Sparkles className="size-3" />
                    {tempClothingPhoto ? 'Change Clothes Photo' : 'Upload Clothes Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'clothing')} />
                  </label>
                </div>
              </div>

              {/* Input Preview for Manual Mode */}
              {((selectedTryOnItems.length > 0 || tempClothingPhoto) && !tryOnImage && !isTryingOn) && (
                <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between gap-4">
                    {/* Person Image */}
                    <div className="flex-1 text-center">
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-200 mb-1.5 relative">
                        <img src={tempUserPhoto || userProfile?.profileImageUrl} alt="Base" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/40 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase">Person</div>
                      </div>
                      {!tempUserPhoto && !userProfile?.profileImageUrl && <p className="text-[8px] text-red-500 font-bold">REQUIRED</p>}
                    </div>

                    <div className="text-gray-300 font-bold">+</div>

                    {/* Clothing Image(s) */}
                    <div className="flex-1 text-center">
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-200 mb-1.5 relative">
                        {tempClothingPhoto ? (
                          <img src={tempClothingPhoto} alt="Garment" className="w-full h-full object-cover" />
                        ) : selectedTryOnItems.length > 0 ? (
                          <div className="relative w-full h-full">
                            {selectedTryOnItems.slice(0, 3).map((item, i) => (
                              <div 
                                key={item.id} 
                                className="absolute inset-0 bg-white"
                                style={{ transform: `rotate(${(i - 1) * 5}deg) translate(${i * 2}px, ${i * 2}px)`, zIndex: 10 - i }}
                              >
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" />
                              </div>
                            ))}
                            {selectedTryOnItems.length > 1 && (
                              <div className="absolute bottom-1 right-1 z-20 bg-purple-600 text-white text-[8px] font-bold px-1 rounded-full">
                                +{selectedTryOnItems.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="size-4 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-black/40 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase">Clothes</div>
                      </div>
                      {!tempClothingPhoto && selectedTryOnItems.length === 0 && <p className="text-[8px] text-red-500 font-bold">REQUIRED</p>}
                    </div>
                  </div>

                  <button 
                    onClick={handleTryOn}
                    disabled={(!tempUserPhoto && !userProfile?.profileImageUrl) || (selectedTryOnItems.length === 0 && !tempClothingPhoto)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl text-xs font-bold uppercase hover:shadow-lg transition-all shadow-md disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="size-4" />
                    Combine & Try On
                  </button>

                  <div className="flex items-center justify-between text-[8px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1"><Info className="size-2" /> {selectedTryOnItems.length} items selected</span>
                    <button onClick={() => { setTempUserPhoto(null); setTempClothingPhoto(null); setSelectedTryOnItems([]); }} className="hover:text-red-500 transition-colors uppercase font-bold tracking-widest">Reset All</button>
                  </div>
                </div>
              )}

              {isTryingOn ? (
                <div className="aspect-[3/4] bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-pink-100 p-8 text-center">
                  <Loader2 className="size-8 animate-spin text-pink-500 mb-4" />
                  <p className="text-xs font-medium text-gray-600">gpt-image-1 is creating your look...</p>
                  <p className="text-[10px] text-gray-400 mt-2">This usually takes about 5-10 seconds</p>
                </div>
              ) : tryOnImage ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative group">
                    <img src={tryOnImage} alt="AI Try On" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">Photorealistic</span>
                        <span className="bg-white/20 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">Look Ready</span>
                      </div>
                      <p className="text-white text-[10px] font-medium leading-tight opacity-90">This look has been generated based on your selections.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleSaveTryOnToLookbook}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95"
                    >
                      <Heart className="size-4 fill-white" />
                      Save to Lookbook
                    </button>
                    <button 
                      onClick={() => setTryOnImage(null)}
                      className="bg-gray-100 text-gray-600 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                    >
                      <RefreshCw className="size-3.5" />
                      Try Another
                    </button>
                  </div>
                  <div className="mt-2 flex justify-center">
                    <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-1">
                      <ImageIcon className="size-2" /> Powered by gpt-image-1
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-gray-100">
                  <Camera className="size-10 text-gray-200 mb-4" />
                  <p className="text-xs font-medium text-gray-500 mb-2">See how this looks on you!</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-6">
                    Our AI will generate a realistic picture of a model matching your profile wearing this exact outfit.
                  </p>
                  <button 
                    onClick={handleTryOn}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-pink-100 active:scale-95 transition-all"
                  >
                    Generate Try On Picture
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
