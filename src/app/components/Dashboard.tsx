import { useState, useEffect } from 'react';
import { TrendingUp, Shirt, Calendar, Award, PlusCircle, Book, ShoppingCart, Tag, Bell, Mail, Sparkles } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Inbox } from './Inbox';
import { Notifications } from './Notifications';
import { useAuth } from '../../lib/AuthContext';

export function Dashboard({ onAction }: { onAction?: (action: string) => void }) {
  const { user } = useAuth();
  const [totalItems, setTotalItems] = useState(0);
  const [totalCombos, setTotalCombos] = useState(0);
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [showInbox, setShowInbox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const qCloset = query(collection(db, 'closet_items'), orderBy('wears', 'asc'));
    const unsubCloset = onSnapshot(qCloset, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setTotalItems(items.length);
      setHiddenGems(items.slice(0, 3)); // Pick 3 least worn items
    });

    const qLookbook = query(collection(db, 'lookbook'));
    const unsubLookbook = onSnapshot(qLookbook, (snapshot) => {
      setTotalCombos(snapshot.docs.length);
    });

    return () => {
      unsubCloset();
      unsubLookbook();
    };
  }, []);

  const stats = [
    { icon: Shirt, label: 'Items in Closet', value: totalItems.toString(), color: 'from-purple-500 to-purple-600' },
    { icon: TrendingUp, label: 'Outfit Combos', value: totalCombos.toString(), color: 'from-pink-500 to-pink-600' },
    { icon: Calendar, label: 'Days Tracked', value: '23', color: 'from-blue-500 to-blue-600' },
    { icon: Award, label: 'Sustainability Score', value: '87%', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="size-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">AURAKU</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowInbox(true)}
              className="relative p-2.5 bg-gray-100 rounded-2xl text-gray-600 hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Mail className="size-5" />
              <span className="absolute -top-1 -right-1 size-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">2</span>
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 bg-gray-100 rounded-2xl text-gray-600 hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Bell className="size-5" />
              <span className="absolute -top-1 -right-1 size-5 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">1</span>
            </button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.displayName || "Stylist"}! ✨</h2>
            <p className="text-sm text-purple-100 opacity-90">Ready to redefine your style today?</p>
          </div>
          <Sparkles className="absolute -top-4 -right-4 size-24 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className={`size-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="size-4 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => onAction?.('add')}
              className="p-3 bg-purple-50 rounded-xl text-purple-700 hover:bg-purple-100 transition-all flex flex-col items-center text-center group active:scale-95"
            >
              <PlusCircle className="size-6 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase leading-tight">Add<br/>Item</span>
            </button>
            <button 
              onClick={() => onAction?.('diary')}
              className="p-3 bg-pink-50 rounded-xl text-pink-700 hover:bg-pink-100 transition-all flex flex-col items-center text-center group active:scale-95"
            >
              <Book className="size-6 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase leading-tight">Style<br/>Diary</span>
            </button>
            <button 
              onClick={() => onAction?.('shop')}
              className="p-3 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-all flex flex-col items-center text-center group active:scale-95"
            >
              <ShoppingCart className="size-6 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase leading-tight">Shop<br/>Check</span>
            </button>
            <button 
              onClick={() => onAction?.('thrift')}
              className="p-3 bg-green-50 rounded-xl text-green-700 hover:bg-green-100 transition-all flex flex-col items-center text-center group active:scale-95"
            >
              <Tag className="size-6 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase leading-tight">Thrift<br/>Store</span>
            </button>
          </div>
        </div>

        {/* Hidden Gems */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Hidden Gems 💎</h3>
          <p className="text-xs text-gray-600 mb-3">Items you haven't worn in a while</p>
          <div className="space-y-2">
            {hiddenGems.length > 0 ? hiddenGems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-white rounded-lg overflow-hidden border border-amber-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-amber-100">
                        {item.emoji}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{item.category} • {item.wears} wears</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm uppercase tracking-wider">
                  Style It
                </button>
              </div>
            )) : (
              <p className="text-center py-4 text-gray-400 text-xs italic">Add more clothes to discover hidden gems!</p>
            )}
          </div>
        </div>


      </div>

      {showInbox && <Inbox onClose={() => setShowInbox(false)} />}
      {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
