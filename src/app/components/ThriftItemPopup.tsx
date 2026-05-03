import { useState } from 'react';
import { X, Tag, MessageCircle, MapPin, User, Sparkles, ShoppingBag } from 'lucide-react';

interface ThriftItemPopupProps {
  item: any;
  onClose: () => void;
}

export function ThriftItemPopup({ item, onClose }: ThriftItemPopupProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-0">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-[400px] h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-95"
        >
          <X className="size-5" />
        </button>

        {/* Image Section */}
        <div className="w-full shrink-0 aspect-[4/5] bg-gray-100 relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-purple-50">
              {item.emoji}
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                {item.category}
              </span>
              <span className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                ${item.price}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <ShoppingBag className="size-3 text-purple-500" />
              <span>{item.brand || 'Unknown Brand'}</span>
              <span>•</span>
              <span className="capitalize">{item.type}</span>
              <span>•</span>
              <span className="capitalize">{item.color}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative overflow-hidden">
            <Sparkles className="absolute -top-1 -right-1 size-12 text-purple-100 opacity-50" />
            <p className="text-sm text-gray-700 leading-relaxed italic relative z-10">
              "{item.description || 'This beautiful piece is looking for a new home. In excellent condition and fits true to size.'}"
            </p>
          </div>

          <div className="flex items-center justify-between py-4 border-y border-gray-100">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                {item.sellerName?.[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.sellerName || 'Anonymous'}</p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <MapPin className="size-2.5" />
                  <span>{item.location || 'Nearby'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Available</p>
              <p className="text-[10px] text-gray-400">Listed 2d ago</p>
            </div>
          </div>

          {item.sellerName !== "Amanda P." && (
            <div className="flex gap-3 pt-2 pb-6">
              <button className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                <MessageCircle className="size-5" />
                Contact Seller
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
