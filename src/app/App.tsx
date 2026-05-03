import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Camera, Sparkles, ShoppingBag, BookHeart, Home, User, ShoppingCart } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DigitalCloset } from './components/DigitalCloset';
import { Stylist } from './components/Stylist';
import { Lookbook } from './components/Lookbook';
import { Profile } from './components/Profile';
import { StyleDiary } from './components/StyleDiary';
import { ShopCheck } from './components/ShopCheck';
import { ThriftMarket as ThriftStore } from './components/ThriftStore';
import { useAuth } from '../lib/AuthContext';
import { Login } from './components/Login';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [preSelectedItems, setPreSelectedItems] = useState<any[]>([]);

  if (loading) return null;
  if (!user) return <Login />;

  const handleStyleSelectedItems = (items: any[]) => {
    setPreSelectedItems(items);
    setActiveTab('stylist');
  };

  const handleDashboardAction = (action: string) => {
    if (action === 'add') setActiveTab('closet');
    if (action === 'diary') setActiveTab('diary');
    if (action === 'shop') setActiveTab('checker');
    if (action === 'thrift') setActiveTab('thrift');
  };

  return (
    <div className="size-full bg-gray-900 flex items-center justify-center p-4">
      {/* Mobile Phone Frame */}
      <div className="w-full max-w-[400px] h-[844px] bg-black rounded-[3rem] p-3 shadow-2xl relative">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-20"></div>

        {/* Phone Screen */}
        <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-[2.5rem] overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="size-full flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 px-4 py-3 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Auraku.ai</h1>
                <p className="text-[10px] text-gray-500">Your AI Style Partner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="home" className="size-full m-0">
            <Dashboard onAction={handleDashboardAction} />
          </TabsContent>
          <TabsContent value="closet" className="size-full m-0">
            <DigitalCloset onStyleItems={handleStyleSelectedItems} />
          </TabsContent>
          <TabsContent value="stylist" className="size-full m-0">
            <Stylist preSelectedItems={preSelectedItems} onClearPreSelected={() => setPreSelectedItems([])} />
          </TabsContent>
          <TabsContent value="lookbook" className="size-full m-0">
            <Lookbook />
          </TabsContent>
          <TabsContent value="diary" className="size-full m-0">
            <StyleDiary />
          </TabsContent>
          <TabsContent value="checker" className="size-full m-0">
            <ShopCheck />
          </TabsContent>
          <TabsContent value="thrift" className="size-full m-0">
            <ThriftStore />
          </TabsContent>
          <TabsContent value="profile" className="size-full m-0">
            <Profile />
          </TabsContent>
        </div>

        {/* Bottom Navigation */}
        <TabsList className="bg-white/90 backdrop-blur-md border-t border-purple-100 px-2 py-2 pb-4 flex items-center w-full">
          <TabsTrigger
            value="home"
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-gray-500 transition-colors"
          >
            <Home className="size-5" />
            <span className="text-[10px]">Home</span>
          </TabsTrigger>
          <TabsTrigger
            value="closet"
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-gray-500 transition-colors"
          >
            <Camera className="size-5" />
            <span className="text-[10px]">Closet</span>
          </TabsTrigger>
          <TabsTrigger
            value="stylist"
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-gray-500 transition-colors"
          >
            <Sparkles className="size-5" />
            <span className="text-[10px]">Stylist</span>
          </TabsTrigger>
          <TabsTrigger
            value="lookbook"
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-gray-500 transition-colors"
          >
            <BookHeart className="size-5" />
            <span className="text-[10px]">Lookbook</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-gray-500 transition-colors"
          >
            <User className="size-5" />
            <span className="text-[10px]">Profile</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
        </div>
      </div>
    </div>
  );
}