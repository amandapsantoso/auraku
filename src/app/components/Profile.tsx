import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { User, Check, Loader2, Sparkles, Camera, Upload, Trash2, LogOut } from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { LiveCamera } from './LiveCamera';
import { analyzeUserProfileImage } from '../../lib/gemini';
import { useAuth } from '../../lib/AuthContext';

export interface UserProfileData {
  gender: string;
  bodyType: string;
  skinTone: string;
  hairColor: string;
  styleVibe: string;
  likedOutfits: string[];
  colorSeason: string;
  height: string;
  weight: string;
  customStyle: string;
  outfitColors: { name: string; hex: string }[];
  jewelry: string;
  makeup: string;
  fashionPersona: string[];
  profileImageUrl?: string;
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData>({
    gender: 'Female',
    bodyType: 'Average',
    skinTone: 'Light',
    hairColor: 'Brunette',
    styleVibe: '',
    likedOutfits: [],
    colorSeason: '',
    height: '',
    weight: '',
    customStyle: '',
    outfitColors: [],
    jewelry: '',
    makeup: '',
    fashionPersona: []
  });
  
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  useEffect(() => {
    if (profile.styleVibe) {
      setSelectedVibes(profile.styleVibe.split(', ').filter(v => v));
    }
  }, [profile.styleVibe]);

  const toggleVibe = (vibe: string) => {
    const newVibes = selectedVibes.includes(vibe) 
      ? selectedVibes.filter(v => v !== vibe)
      : [...selectedVibes, vibe];
    setSelectedVibes(newVibes);
    handleChange('styleVibe', newVibes.join(', '));
  };

  const predefinedStyles = [
    { id: 'Minimalist', emoji: '⚪' },
    { id: 'Academic', emoji: '📚' },
    { id: 'Streetwear', emoji: '🧢' },
    { id: 'Bohemian', emoji: '🌸' },
    { id: 'Classic', emoji: '👔' },
    { id: 'Romantic', emoji: '💕' },
    { id: 'Edgy', emoji: '🖤' },
    { id: 'Preppy', emoji: '🎀' },
    { id: 'Athletic', emoji: '⚡' },
  ];
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const openCamera = () => setShowCamera(true);
  const openUploader = () => uploadInputRef.current?.click();

  const handleImageAnalysis = async (file: File) => {
    if (!user) return;
    setIsAnalyzingImage(true);
    setUploadedImageUrl(URL.createObjectURL(file));

    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `user_profiles/${user.uid}/profile_pic_${Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Analyze with Gemini
      const predictions = await analyzeUserProfileImage(file);
      
      setProfile(prev => ({
        ...prev,
        profileImageUrl: downloadUrl,
        gender: predictions.gender,
        bodyType: predictions.bodyType,
        skinTone: predictions.skinTone,
        hairColor: predictions.hairColor,
        colorSeason: predictions.colorSeason || prev.colorSeason,
        outfitColors: predictions.outfitColors || prev.outfitColors,
        jewelry: predictions.jewelry || prev.jewelry,
        makeup: predictions.makeup || prev.makeup,
        fashionPersona: predictions.fashionPersona || prev.fashionPersona
      }));
      
      alert("AI Analysis complete! Your profile has been updated automatically.");
    } catch (error) {
      console.error('Error analyzing profile image:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageAnalysis(file);
    }
    event.target.value = '';
  };

  const handleLiveCameraCapture = (file: File) => {
    setShowCamera(false);
    handleImageAnalysis(file);
  };

  const handleDeletePhoto = () => {
    setProfile(prev => ({ ...prev, profileImageUrl: '' }));
    setUploadedImageUrl(null);
  };

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'user_profiles', user.uid);
    
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        setProfile(data);
        if (data.profileImageUrl) {
          setUploadedImageUrl(data.profileImageUrl);
        }
      }
      setHasLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const profileRef = doc(db, 'user_profiles', user.uid);
      await setDoc(profileRef, profile, { merge: true });
      alert("Profile saved successfully! The AI will now use this to generate your images.");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut(auth);
    }
  };

  const handleChange = (field: keyof UserProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (!hasLoaded) {
    return <div className="size-full flex items-center justify-center bg-gray-50"><Loader2 className="size-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="size-full overflow-y-auto bg-gray-50 pb-24 relative">
      {showCamera && (
        <LiveCamera 
          onCapture={handleLiveCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      <div className="p-4 space-y-6">
        
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-md text-center relative">
          <button 
            onClick={handleLogout}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="size-4 text-white" />
          </button>
          <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md overflow-hidden border-2 border-white/30 relative group">
            {uploadedImageUrl ? (
              <>
                <img src={uploadedImageUrl} alt="Profile" className="w-full h-full object-cover" />
                <button 
                  onClick={handleDeletePhoto}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-5 text-white" />
                </button>
              </>
            ) : (
              <User className="size-8 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold mb-0.5">{user?.displayName || 'Your AI Profile'}</h2>
          <p className="text-[10px] text-purple-100 opacity-80 mb-3">{user?.email}</p>
          <p className="text-xs text-purple-100">
            Tell the AI about your physical traits or upload a photo to let Gemini analyze you!
          </p>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={openCamera}
              disabled={isAnalyzingImage || isSaving}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Camera className="size-4" />
              <span className="font-medium text-xs">Selfie</span>
            </button>
            <button
              type="button"
              onClick={openUploader}
              disabled={isAnalyzingImage || isSaving}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Upload className="size-4" />
              <span className="font-medium text-xs">Upload</span>
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            ref={uploadInputRef}
            className="hidden"
            onChange={handleImageSelected}
          />
        </div>

        {isAnalyzingImage && (
          <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-center gap-3 border border-purple-200 shadow-sm animate-pulse">
            <Loader2 className="size-5 animate-spin text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Gemini is analyzing your features...</span>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="size-4 text-purple-500" /> Physical Traits
          </h3>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Gender Presentation</label>
            <select 
              value={profile.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all appearance-none"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Androgynous">Androgynous</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Body Type</label>
            <select 
              value={profile.bodyType}
              onChange={(e) => handleChange('bodyType', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all appearance-none"
            >
              <option value="Slim">Slim</option>
              <option value="Athletic">Athletic</option>
              <option value="Average">Average</option>
              <option value="Curvy">Curvy</option>
              <option value="Plus Size">Plus Size</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Skin Tone</label>
            <select 
              value={profile.skinTone}
              onChange={(e) => handleChange('skinTone', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all appearance-none"
            >
              <option value="Very Light">Very Light</option>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Olive">Olive</option>
              <option value="Dark">Dark</option>
              <option value="Deep">Deep</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Hair Color</label>
            <input 
              type="text" 
              value={profile.hairColor}
              onChange={(e) => handleChange('hairColor', e.target.value)}
              placeholder="e.g. Blonde, Black, Pink"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Height</label>
              <input 
                type="text" 
                value={profile.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="e.g. 165 cm or 5'5&quot;"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Weight</label>
              <input 
                type="text" 
                value={profile.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="e.g. 55 kg or 120 lbs"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Color Season</label>
            <input 
              type="text" 
              value={profile.colorSeason}
              onChange={(e) => handleChange('colorSeason', e.target.value)}
              placeholder="e.g. Autumn, Spring, True Winter"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Color Analysis Report */}
        {(profile.colorSeason || profile.jewelry || profile.makeup) && (
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl p-5 shadow-sm text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="size-24" />
            </div>
            <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10 text-lg">
              <Sparkles className="size-5 text-pink-300" /> Color Analysis Report
            </h3>
            
            <div className="space-y-4 relative z-10">
              
              {profile.fashionPersona && profile.fashionPersona.length > 0 && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <span className="text-[10px] text-pink-200 font-semibold uppercase tracking-wider block mb-1.5">AI Persona Recap</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.fashionPersona.map((persona, idx) => (
                      <span key={idx} className="bg-pink-500/30 text-pink-100 border border-pink-400/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        #{persona}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <span className="text-[10px] text-pink-200 font-semibold uppercase tracking-wider block mb-1">Recommended Outfit Colors</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.outfitColors?.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white/20 px-2 py-1.5 rounded-lg shadow-sm">
                      <div 
                        className="size-3.5 rounded-full border border-white/50 shadow-sm" 
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs font-medium">{color.name}</span>
                    </div>
                  ))}
                  {(!profile.outfitColors || profile.outfitColors.length === 0) && (
                    <span className="text-xs text-white/70">Analyze your photo to get color recommendations!</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <span className="text-[10px] text-pink-200 font-semibold uppercase tracking-wider block mb-1">Jewelry Metal</span>
                  <p className="text-sm font-medium">{profile.jewelry || "Pending analysis..."}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <span className="text-[10px] text-pink-200 font-semibold uppercase tracking-wider block mb-1">Makeup Palette</span>
                  <p className="text-sm font-medium leading-snug">{profile.makeup || "Pending analysis..."}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="size-4 text-pink-500" /> Style Preferences
          </h3>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">Style Vibes</label>
            <div className="grid grid-cols-3 gap-2">
              {predefinedStyles.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => toggleVibe(vibe.id)}
                  className={`p-2.5 rounded-xl text-center transition-all relative ${
                    selectedVibes.includes(vibe.id)
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {selectedVibes.includes(vibe.id) && (
                    <div className="absolute top-1 right-1 size-3 bg-white rounded-full flex items-center justify-center">
                      <Check className="size-2 text-purple-600" />
                    </div>
                  )}
                  <span className="text-xl mb-1 block">{vibe.emoji}</span>
                  <span className="text-[10px] font-medium">{vibe.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Custom Style Notes</label>
            <textarea 
              value={profile.customStyle}
              onChange={(e) => handleChange('customStyle', e.target.value)}
              placeholder="e.g. 'I love 90s grunge but appropriate for a corporate office', 'Comfort over everything', 'Earth tones only'"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all h-24 resize-none"
            />
          </div>
          
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-700 mb-1">{profile.likedOutfits?.length || 0}</p>
            <p className="text-xs text-purple-600 font-medium">Outfits Liked & Remembered</p>
            <p className="text-[10px] text-purple-500 mt-1">The AI gets smarter with every outfit you like!</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-4 font-medium flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md"
        >
          {isSaving ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Check className="size-5" />
          )}
          Save AI Profile
        </button>

      </div>
    </div>
  );
}
