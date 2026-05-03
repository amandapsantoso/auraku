import { useState, useEffect } from 'react';
import { Heart, Trash2, Calendar, Sparkles, ShoppingBag, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function Lookbook() {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'moodboard' | 'ai'>('moodboard');

  useEffect(() => {
    const q = query(collection(db, 'lookbook'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOutfits(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching lookbook: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOutfits = outfits.filter(o => 
    activeTab === 'ai' ? o.isAiGenerated === true : !o.isAiGenerated
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this look from your lookbook?")) return;
    try {
      await deleteDoc(doc(db, 'lookbook', id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete.");
    }
  };

  const handleSchedule = async (outfit: any) => {
    const date = prompt("Enter date to wear this outfit (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!date) return;

    try {
      const entryId = `${date}_default`; // Simplified for single user
      await setDoc(doc(db, 'diary', entryId), {
        date,
        outfitName: outfit.name,
        styleVibe: outfit.styleVibe,
        reasoning: outfit.reasoning,
        items: outfit.items,
        createdAt: Date.now()
      });
      alert(`Outfit scheduled for ${date}! 📔`);
    } catch (e) {
      console.error(e);
      alert("Failed to schedule outfit.");
    }
  };

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50">
        <Loader2 className="size-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="size-full overflow-y-auto bg-gray-50 pb-24">
      <div className="p-4 space-y-4">
        
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Heart className="size-5 fill-white" /> My Lookbook
            </h2>
            <p className="text-xs text-pink-100 opacity-90">
              Curate your style and save AI visualizations.
            </p>
          </div>
          <Heart className="absolute -bottom-4 -right-4 size-24 text-white/10 rotate-12" />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('moodboard')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'moodboard' 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Moodboards
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ai' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className={`size-3 ${activeTab === 'ai' ? 'animate-pulse' : ''}`} />
            AI Try-Ons
          </button>
        </div>

        {filteredOutfits.length === 0 ? (
          <div className="text-center py-20 px-6 animate-in fade-in zoom-in-95">
            <div className={`size-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              activeTab === 'ai' ? 'bg-purple-50 border-purple-100' : 'bg-pink-50 border-pink-100'
            }`}>
              {activeTab === 'ai' ? (
                <Sparkles className="size-8 text-purple-300" />
              ) : (
                <Heart className="size-8 text-pink-300" />
              )}
            </div>
            <h3 className="text-gray-900 font-bold mb-2 text-lg">
              {activeTab === 'ai' ? 'No AI Try-Ons Yet' : 'Empty Moodboard'}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[240px] mx-auto">
              {activeTab === 'ai' 
                ? 'Go to the Stylist tab and "Combine & Try On" an outfit, then save it here!'
                : 'When you find an outfit recommendation you love, tap the Like button!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOutfits.map((outfit) => (
              <div key={outfit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-all hover:shadow-md">
                {/* AI Try-On Featured Image */}
                {activeTab === 'ai' && outfit.imageUrl && (
                  <div className="aspect-[3/4] relative">
                    <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-purple-600 text-white text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest shadow-lg">AI Generated</span>
                    </div>
                  </div>
                )}

                {/* Outfit Header */}
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 truncate">{outfit.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        activeTab === 'ai' ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-600'
                      }`}>
                        {outfit.styleVibe}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(outfit.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-4">
                    <button 
                      onClick={() => handleSchedule(outfit)}
                      className="bg-gray-50 text-gray-700 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-all border border-gray-100"
                      title="Schedule"
                    >
                      <Calendar className="size-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(outfit.id)}
                      className="bg-gray-50 text-gray-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Outfit Content */}
                <div className="p-4 bg-gray-50/30">
                  {activeTab === 'moodboard' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {outfit.items?.map((item: any) => (
                        <div key={item.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-gray-100 shadow-sm">
                          <div className="size-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">{item.emoji}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{item.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {outfit.items?.map((item: any) => (
                        <div key={item.id} className="flex-shrink-0 size-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="ml-2 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {outfit.items?.length} items included
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  {outfit.reasoning && (
                    <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white">
                      <p className="text-[10px] leading-relaxed text-gray-600 italic">
                        "{outfit.reasoning}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
