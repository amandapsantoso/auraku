import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Camera, Upload, Search, Filter, Loader2, Image as ImageIcon, Trash2, Receipt, Mail } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../lib/firebase';
import { LiveCamera } from './LiveCamera';
import { analyzeClothingImage } from '../../lib/gemini';
import { ItemDetailPopup } from './ItemDetailPopup';
import { ReceiptImport } from './ReceiptImport';

export function DigitalCloset({ onStyleItems }: { onStyleItems?: (items: any[]) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showReceiptImport, setShowReceiptImport] = useState(false);
  const [showGmailNotice, setShowGmailNotice] = useState(false);

  const [clothingItems, setClothingItems] = useState<any[]>([]);

  useEffect(() => {
    // Listen for real-time updates to the user's closet
    const q = query(collection(db, 'closet_items'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClothingItems(items);
    }, (error) => {
      console.error("Error fetching closet items: ", error);
    });

    return () => unsubscribe();
  }, []);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const openCamera = () => setShowCamera(true);
  const openUploader = () => uploadInputRef.current?.click();

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');
    setUploadedImageUrl(URL.createObjectURL(file));

    try {
      // 1. Analyze with Gemini first
      const aiMetadata = await analyzeClothingImage(file);
      
      const filename = `closet/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadedImageUrl(downloadURL);
      
      // Save item to Firestore database permanently
      await addDoc(collection(db, 'closet_items'), {
        ...aiMetadata,
        wears: 0,
        imageUrl: downloadURL,
        createdAt: Date.now()
      });
      
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
      
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
    event.target.value = '';
  };

  const handleLiveCameraCapture = (file: File) => {
    setShowCamera(false);
    uploadImage(file);
  };

  const handleDeleteItem = async (id: string, imageUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      // 1. Delete the record from the Firestore database
      await deleteDoc(doc(db, 'closet_items', id));
      
      // 2. Delete the physical image file from Storage to save space
      if (imageUrl && imageUrl.includes('firebasestorage')) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef).catch(e => console.log('Error deleting image from storage', e));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item.');
    }
  };

  // Dynamic Categories
  const categoryCounts = clothingItems.reduce((acc, item) => {
    const cat = (item.category || 'unknown').toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { id: 'all', name: 'All Categories', count: clothingItems.length },
    ...Object.entries(categoryCounts).map(([id, count]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      count: count as number
    })).sort((a, b) => b.count - a.count)
  ];

  // Dynamic Colors
  const colorCounts = clothingItems.reduce((acc, item) => {
    const col = (item.color || 'unknown').toLowerCase();
    acc[col] = (acc[col] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colors = [
    { id: 'all', name: 'All Colors', count: clothingItems.length },
    ...Object.entries(colorCounts).map(([id, count]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      count: count as number
    })).sort((a, b) => b.count - a.count)
  ];

  const filteredItems = clothingItems.filter(item => {
    const matchCategory = selectedCategory === 'all' || (item.category || 'unknown').toLowerCase() === selectedCategory;
    const matchColor = selectedColor === 'all' || (item.color || 'unknown').toLowerCase() === selectedColor;
    return matchCategory && matchColor;
  });

  const toggleItemSelection = (item: any) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      if (selectedItems.length < 2) {
        setSelectedItems(prev => [...prev, item]);
      } else {
        alert("Select maximum 2 items to style.");
      }
    }
  };

  const handleStyleSelected = () => {
    if (onStyleItems && selectedItems.length > 0) {
      onStyleItems(selectedItems);
    }
  };

  return (
    <div className="size-full overflow-y-auto bg-gray-50 relative">
      {showCamera && (
        <LiveCamera 
          onCapture={handleLiveCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      <div className="p-4 space-y-4">
        {/* Header Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCamera}
            disabled={isUploading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-3 flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="size-4" />
            <span className="font-medium text-sm">Take Photo</span>
          </button>
          <button
            type="button"
            onClick={openUploader}
            disabled={isUploading}
            className="flex-1 bg-white text-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="size-4" />
            <span className="font-medium text-sm">Upload</span>
          </button>
        </div>

        {/* Purchase history import */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowReceiptImport(true)}
            className="flex-1 bg-white text-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Receipt className="size-4" />
            <span className="font-medium text-sm">Import receipt</span>
          </button>
          {/* Demo-only placeholder: real Gmail sync is not implemented yet */}
          <button
            type="button"
            onClick={() => {
              setShowGmailNotice(true);
              setTimeout(() => setShowGmailNotice(false), 3000);
            }}
            className="flex-1 bg-white text-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Mail className="size-4" />
            <span className="font-medium text-sm">Sync Gmail</span>
          </button>
        </div>
        {showGmailNotice && (
          <div className="p-3 rounded-xl border bg-purple-50 border-purple-200 text-purple-700 text-xs font-medium">
            Gmail sync is coming soon. For now, use Import receipt to add a purchase.
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={uploadInputRef}
          className="hidden"
          onChange={handleImageSelected}
        />

        {/* Upload Status Indicator */}
        {(isUploading || uploadStatus !== 'idle') && (
          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            uploadStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            uploadStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {uploadedImageUrl ? (
              <img src={uploadedImageUrl} alt="Preview" className="size-10 object-cover rounded-lg border border-white/50 shadow-sm" />
            ) : (
              <div className="size-10 bg-white/50 rounded-lg flex items-center justify-center">
                <ImageIcon className="size-5 opacity-50" />
              </div>
            )}
            
            <div className="flex-1">
              {isUploading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm font-medium">AI is analyzing your clothing...</span>
                </div>
              )}
              {uploadStatus === 'success' && !isUploading && (
                <span className="text-sm font-medium">Upload complete! Image saved to cloud.</span>
              )}
              {uploadStatus === 'error' && !isUploading && (
                <span className="text-sm font-medium">Failed to upload image. Please try again.</span>
              )}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your closet..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button 
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedItems([]);
            }}
            className={`px-3 rounded-xl border transition-colors flex items-center gap-2 ${
              multiSelectMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <Filter className="size-4" />
            <span className="text-[10px] font-bold uppercase">{multiSelectMode ? 'Cancel' : 'Select'}</span>
          </button>
        </div>

        {multiSelectMode && selectedItems.length > 0 && (
          <button 
            onClick={handleStyleSelected}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg animate-in slide-in-from-top-2"
          >
            Style These {selectedItems.length} Items ✨
          </button>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Color Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs ${
                selectedColor === color.id
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {color.name} ({color.count})
            </button>
          ))}
        </div>

        {/* Clothing Grid */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl overflow-hidden shadow-sm border transition-all relative group cursor-pointer ${
                selectedItems.find(i => i.id === item.id) ? 'ring-4 ring-purple-500 border-transparent scale-95' : 'border-gray-100'
              }`}
              onClick={() => multiSelectMode ? toggleItemSelection(item) : setSelectedItem(item)}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id, item.imageUrl);
                }}
                className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-md transition-all active:scale-95"
                title="Delete Item"
              >
                <Trash2 className="size-3.5" />
              </button>
              
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{item.emoji}</span>
                )}
              </div>
              <div className="p-2.5">
                <h4 className="font-medium text-gray-900 text-xs mb-1 truncate" title={item.name}>{item.name}</h4>
                {item.source === 'receipt' && (
                  <span className="inline-block mb-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-bold uppercase">
                    From receipt{item.purchaseDate ? ` • ${item.purchaseDate}` : ''}
                  </span>
                )}
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span className="capitalize text-ellipsis overflow-hidden whitespace-nowrap max-w-[70%]">
                    {item.color} • {item.brand || 'Unknown'} {item.material && `• ${item.material}`}
                  </span>
                  <span className="whitespace-nowrap">{item.wears} wears</span>
                </div>
                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(item.wears * 4, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showReceiptImport && (
        <ReceiptImport
          existingItems={clothingItems}
          onClose={() => setShowReceiptImport(false)}
        />
      )}

      {selectedItem && (
        <ItemDetailPopup
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}
