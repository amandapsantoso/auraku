import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Tag, Search, MessageCircle, Heart, Loader2, Sparkles, Plus, Camera, MapPin, Map as MapIcon, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { analyzeClothingImage } from '../../lib/gemini';
import { ThriftItemPopup } from './ThriftItemPopup';

export function ThriftMarket() {
  const [activeSubTab, setActiveSubTab] = useState<'closet' | 'shop'>('closet');
  const [items, setItems] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qMarket = query(collection(db, 'thrift_market'), orderBy('createdAt', 'desc'));
    const unsubMarket = onSnapshot(qMarket, (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setItems(allItems);
      setMyListings(allItems.filter(item => item.sellerName === "Amanda P."));
      setIsLoading(false);
    });

    return () => unsubMarket();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `thrift/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Analyze with AI
      const metadata = await analyzeClothingImage(file);
      
      // 3. Add to thrift_market collection
      await addDoc(collection(db, 'thrift_market'), {
        ...metadata,
        imageUrl,
        price: '20',
        description: 'Hardly worn, looking for a new home! Great quality and style.',
        sellerName: "Amanda P.",
        location: "Brooklyn, NY",
        createdAt: Date.now(),
        status: 'available'
      });

      alert("Item listed with real photo! 🌿");
    } catch (error) {
      console.error(error);
      alert("Failed to list item.");
    } finally {
      setIsUploading(false);
    }
  };

  const seedMarketplace = async () => {
    const dummyItems = [
      { name: "Vintage Oversized Blazer", category: "outerwear", type: "oversized", brand: "Ralph Lauren", color: "Camel", material: "Wool", price: "45", description: "Excellent condition vintage piece. Perfect for a chic academia look.", sellerName: "Mike R.", location: "Brooklyn, NY", emoji: "🧥", createdAt: Date.now() - 3600000, status: 'available' },
      { name: "Silk Floral Blouse", category: "top", type: "slim-fit", brand: "ZARA", color: "Cream/Floral", material: "Silk", price: "18", description: "Worn once for a wedding. Very soft and elegant.", sellerName: "Sarah J.", location: "Manhattan, NY", emoji: "👚", createdAt: Date.now() - 7200000, status: 'available' },
      { name: "Classic Chelsea Boots", category: "shoes", type: "formal", brand: "Dr. Martens", color: "Black", material: "Leather", price: "60", description: "Slightly scuffed but plenty of life left. Recently polished.", sellerName: "Alex K.", location: "Queens, NY", emoji: "👢", createdAt: Date.now() - 10800000, status: 'available' },
      { name: "Boho Maxi Skirt", category: "skirt", type: "flowy", brand: "Anthropologie", color: "Terracotta", material: "Linen", price: "32", description: "Perfect for summer festivals. Breathable and stylish.", sellerName: "Elena W.", location: "Brooklyn, NY", emoji: "👗", createdAt: Date.now() - 14400000, status: 'available' }
    ];

    try {
      for (const item of dummyItems) {
        await addDoc(collection(db, 'thrift_market'), item);
      }
      alert("Marketplace seeded with 4 new treasures! 🌟");
    } catch (e) {
      console.error(e);
      alert("Failed to seed marketplace.");
    }
  };

  const updateListing = async (id: string, field: string, value: string) => {
    try {
      const itemRef = doc(db, 'thrift_market', id);
      await updateDoc(itemRef, { [field]: value });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredShopItems = items.filter(item => {
    if (item.sellerName === "Amanda P.") return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'top', 'bottom', 'outerwear', 'dress', 'skirt', 'shoes', 'jewelry', 'scarf'];

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50">
        <Loader2 className="size-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Sub-Tab Header */}
      <div className="bg-white border-b border-gray-100 p-4 shrink-0">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('closet')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'closet' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Preloved Closet
          </button>
          <button
            onClick={() => setActiveSubTab('shop')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'shop' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Thrift Shop
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {activeSubTab === 'closet' ? (
          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Your Listings</h2>
              <p className="text-xs text-gray-500 italic">Manage your sustainable store</p>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-3xl text-white shadow-lg flex flex-col items-center justify-center gap-3 relative overflow-hidden active:scale-95 transition-transform"
            >
              {isUploading ? <Loader2 className="size-8 animate-spin" /> : <Camera className="size-8" />}
              <div className="text-center">
                <span className="font-bold block text-sm">List Preloved Item</span>
                <span className="text-[10px] opacity-80">Stored securely & analyzed by AI</span>
              </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <div className="space-y-4">
              {myListings.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex gap-4 cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <div className="size-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl bg-purple-50">{item.emoji}</div>}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input className="w-full font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 text-sm" value={item.name} onChange={(e) => updateListing(item.id, 'name', e.target.value)} onClick={(e) => e.stopPropagation()} />
                      <div className="flex items-center gap-2">
                        <Tag className="size-3 text-purple-500" />
                        <input className="flex-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border-none focus:ring-0" value={item.price} onChange={(e) => updateListing(item.id, 'price', e.target.value)} onClick={(e) => e.stopPropagation()} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border-none focus:ring-0" value={item.brand} onChange={(e) => updateListing(item.id, 'brand', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Brand" />
                        <input className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border-none focus:ring-0" value={item.color} onChange={(e) => updateListing(item.id, 'color', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Color" />
                        <input className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border-none focus:ring-0" value={item.type} onChange={(e) => updateListing(item.id, 'type', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Type/Fit" />
                        <input className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border-none focus:ring-0" value={item.material} onChange={(e) => updateListing(item.id, 'material', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Material" />
                      </div>
                      <p className="text-[10px] text-gray-400 italic">Tap image to see detailed AI view →</p>
                    </div>
                  </div>
                  <textarea className="w-full text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border-none focus:ring-1 focus:ring-purple-200 h-20" value={item.description} onChange={(e) => updateListing(item.id, 'description', e.target.value)} placeholder="Tell buyers more about this piece..." />
                  <div className="flex justify-end pt-1">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Permanently delete this listing?")) {
                          await deleteDoc(doc(db, 'thrift_market', item.id));
                        }
                      }}
                      className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-widest px-2 py-1"
                    >
                      Delete Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Nearby Treasures</h2>
                <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold">
                  <MapPin className="size-3" />
                  <span>Brooklyn, NY</span>
                </div>
              </div>
              <button 
                onClick={seedMarketplace}
                className="p-3 bg-white border border-purple-100 rounded-2xl text-purple-600 shadow-sm flex items-center gap-2 active:scale-95 transition-transform"
              >
                <Sparkles className="size-4" />
                <span className="text-[10px] font-bold uppercase">Seed Shop</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search preloved treasures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-100 focus:ring-2 focus:ring-purple-200 text-sm shadow-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                        : 'bg-white text-gray-500 border-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredShopItems.length > 0 ? filteredShopItems.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex h-40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedItem(item)}>
                  <div className="w-1/3 bg-gray-100 relative">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl bg-purple-50">{item.emoji}</div>}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between mb-1">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</h4>
                        <span className="text-green-600 font-bold text-sm">${item.price}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 italic line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1"><MapPin className="size-2.5" /> {item.location}</span>
                      <button className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-[10px] font-bold">View Details</button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 space-y-3">
                  <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto opacity-40">
                    <Search className="size-8" />
                  </div>
                  <p className="text-sm text-gray-400 italic">No treasures found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <ThriftItemPopup 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}
