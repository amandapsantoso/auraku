import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, ShoppingCart, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { generateOutfitRecommendation } from '../../lib/gemini';

export function ShopCheck() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [closetItems, setClosetItems] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'closet_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClosetItems(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);

    try {
      // We use a specialized prompt for Shop Check
      // Gemini will compare the new item with the closet
      const prompt = `
        You are a shopping assistant. The user is considering buying a new item (described in the image/metadata).
        Compare this item with their existing closet: ${JSON.stringify(closetItems.slice(0, 20))}.
        
        Analyze:
        1. VERSATILITY: How many outfits can they make with this item using their current closet?
        2. RELEVANCY: Does it match their Style Vibe?
        3. VERDICT: Should they buy it? (Worth it, Maybe, or Skip).
        
        Return ONLY a JSON object:
        {
          "verdict": "Worth It" | "Maybe" | "Skip",
          "reasoning": "A short 2-sentence explanation.",
          "score": 0-100,
          "matchingItemIds": ["id1", "id2"]
        }
      `;

      // Simulating analysis for demo speed
      await new Promise(r => setTimeout(r, 2500));
      
      setResult({
        verdict: "Worth It",
        score: 85,
        reasoning: "This item pairs perfectly with your Navy Blazer and Blue Jeans. It fills a gap in your business-casual collection.",
        matchingItemIds: closetItems.slice(0, 2).map(i => i.id) // Simulate matching first 2 items
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="size-full overflow-y-auto bg-gray-50 pb-24">
      <div className="p-4 space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Shop Check
          </h2>
          <p className="text-sm text-blue-100 opacity-90">
            Is it worth buying? Let AI check if it matches your closet.
          </p>
        </div>

        {/* Upload Section */}
        {!result && !isAnalyzing && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <div className="size-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="size-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Upload or Take Photo</h3>
            <p className="text-xs text-gray-500 mt-1">Snap a photo of the item you want to buy</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*"
            />
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <Loader2 className="size-10 text-blue-600 animate-spin mb-4" />
            <h3 className="font-bold text-gray-900">AI is Assessing...</h3>
            <p className="text-xs text-gray-500 mt-1 italic">Consulting your digital closet wardrobe</p>
          </div>
        )}

        {/* Result State */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
              {previewUrl && (
                <div className="h-48 w-full bg-gray-100 relative">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Item to buy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        result.verdict === 'Worth It' ? 'bg-green-500 text-white' : 
                        result.verdict === 'Maybe' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {result.verdict}
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white">
                        Match Score: {result.score}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">AI Verdict</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pairs With Your Closet</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {result.matchingItemIds?.map((id: string, i: number) => {
                      const item = closetItems.find(item => item.id === id);
                      if (!item) return null;
                      return (
                        <div key={i} className="bg-blue-50/50 rounded-xl p-2 flex flex-col items-center gap-2 border border-blue-100">
                          <div className="size-16 rounded-lg overflow-hidden border border-white bg-white">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">{item.emoji}</div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-blue-800 truncate w-full text-center">{item.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setResult(null);
                    setPreviewUrl(null);
                  }}
                  className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Check Another Item
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
