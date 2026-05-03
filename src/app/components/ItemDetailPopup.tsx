import { useState } from 'react';
import { X, Check, Loader2, Sparkles, ShoppingBag } from 'lucide-react';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { analyzeClothingImage } from '../../lib/gemini';

interface ItemDetailPopupProps {
  item: any;
  onClose: () => void;
}

export function ItemDetailPopup({ item, onClose }: ItemDetailPopupProps) {
  const [title, setTitle] = useState(item.name || '');
  const [brand, setBrand] = useState(item.brand || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReanalyze = async () => {
    if (!item.imageUrl) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "reanalyze.jpg", { type: blob.type || "image/jpeg" });
      const newMetadata = await analyzeClothingImage(file);
      
      const itemRef = doc(db, 'closet_items', item.id);
      await updateDoc(itemRef, newMetadata as any);
      
      setTitle(newMetadata.name);
      setBrand(newMetadata.brand || '');
      alert("AI Analysis complete!");
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (title === item.name && brand === item.brand) {
      onClose();
      return;
    }
    
    setIsSaving(true);
    try {
      const itemRef = doc(db, 'closet_items', item.id);
      await updateDoc(itemRef, {
        name: title,
        brand: brand
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThriftList = async () => {
    const price = prompt("Enter listing price ($):", "15");
    if (!price) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'thrift_market', item.id), {
        ...item,
        price,
        sellerName: "Amanda P.",
        createdAt: Date.now(),
        status: 'available'
      });

      await deleteDoc(doc(db, 'closet_items', item.id));
      alert("Item listed in Thrift Market! 🌿");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to list item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[400px] h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/40 text-white p-2 rounded-full backdrop-blur-md">
          <X className="size-4" />
        </button>

        <div className="w-full shrink-0 aspect-square bg-gray-100 flex items-center justify-center relative">
          {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <span className="text-8xl">{item.emoji}</span>}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold">{item.category}</span>
            <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold">{item.color}</span>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Item Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-4 py-3 font-semibold" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Brand</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-4 py-3 font-semibold" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border">
              <span className="text-gray-500 text-[10px] block">Wears</span>
              <span className="font-bold text-sm">{item.wears || 0} times</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border">
              <span className="text-gray-500 text-[10px] block">Added</span>
              <span className="font-bold text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleReanalyze} disabled={isAnalyzing || isSaving} className="bg-white border-2 border-purple-100 text-purple-700 rounded-xl py-3 font-medium flex items-center justify-center gap-2 text-xs">
                {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                Re-Analyze
              </button>
              <button onClick={handleThriftList} disabled={isSaving || isAnalyzing} className="bg-green-50 border-2 border-green-100 text-green-700 rounded-xl py-3 font-medium flex items-center justify-center gap-2 text-xs">
                <ShoppingBag className="size-3" />
                List for Thrift
              </button>
            </div>
            
            <button onClick={handleSave} disabled={isSaving || isAnalyzing} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 shadow-md">
              {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
