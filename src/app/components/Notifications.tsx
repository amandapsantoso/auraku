import { Bell, ChevronRight, ShoppingBag, Heart, UserPlus } from 'lucide-react';

export function Notifications({ onClose }: { onClose: () => void }) {
  const notifications = [
    { id: 1, type: 'order', text: "New order! Someone bought your Linen Shirt.", time: "10m ago", icon: ShoppingBag, color: "text-green-600 bg-green-50" },
    { id: 2, type: 'like', text: "Your 'Minimalist Hijab' lookbook was liked.", time: "2h ago", icon: Heart, color: "text-pink-600 bg-pink-50" },
    { id: 3, type: 'follow', text: "StyleExplorer started following your closet.", time: "5h ago", icon: UserPlus, color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <ChevronRight className="size-6 rotate-180" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
        <div className="size-6" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.map((note) => (
          <div key={note.id} className="p-5 flex gap-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <div className={`size-10 rounded-xl shrink-0 flex items-center justify-center ${note.color}`}>
              <note.icon className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 leading-snug">{note.text}</p>
              <span className="text-[10px] text-gray-400 font-medium mt-1 block">{note.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
