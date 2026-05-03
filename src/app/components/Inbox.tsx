import { useState } from 'react';
import { Mail, Search, ChevronRight, User, Circle } from 'lucide-react';

export function Inbox({ onClose }: { onClose: () => void }) {
  const messages = [
    { id: 1, user: "Sarah J.", preview: "Is the vintage blazer still available?", time: "2m ago", unread: true },
    { id: 2, user: "Mike Ross", preview: "Would you take $15 for the denim jeans?", time: "1h ago", unread: true },
    { id: 3, user: "Elena", preview: "Thanks! The dress fits perfectly.", time: "Yesterday", unread: false },
  ];

  return (
    <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <ChevronRight className="size-6 rotate-180" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
        <div className="size-6" />
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-purple-200 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-5 flex items-center gap-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${msg.unread ? 'bg-purple-50/30' : ''}`}>
            <div className="size-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
              {msg.user[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-gray-900 truncate">{msg.user}</h3>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{msg.time}</span>
              </div>
              <p className={`text-xs truncate ${msg.unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{msg.preview}</p>
            </div>
            {msg.unread && <Circle className="size-2 fill-purple-600 text-purple-600" />}
          </div>
        ))}
      </div>
    </div>
  );
}
