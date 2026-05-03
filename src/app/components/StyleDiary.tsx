import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, Clock, Trash2, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function StyleDiary() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const q = query(collection(db, 'diary'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiaryEntries(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching diary: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Remove this outfit from your diary?")) return;
    try {
      await deleteDoc(doc(db, 'diary', id));
    } catch (e) {
      console.error(e);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty cells for padding
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = diaryEntries.find(e => e.date === dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <button
          key={d}
          onClick={() => setSelectedDate(dateStr)}
          className={`h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-all ${
            isSelected ? 'bg-purple-600 text-white shadow-md scale-110 z-10' : 
            isToday ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="text-xs">{d}</span>
          {entry && !isSelected && (
            <div className="absolute bottom-1 size-1 bg-pink-500 rounded-full animate-pulse"></div>
          )}
        </button>
      );
    }

    return days;
  };

  const selectedEntry = diaryEntries.find(e => e.date === selectedDate);

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
        
        {/* Calendar Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="size-4 text-purple-600" />
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <span key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Selected Date Detail */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
            {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Style" : `Plan for ${selectedDate}`}
          </h3>

          {selectedEntry ? (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 text-white shadow-lg animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-lg">{selectedEntry.outfitName}</h4>
                  <p className="text-[10px] text-indigo-100 uppercase tracking-wider">{selectedEntry.styleVibe}</p>
                </div>
                <button 
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  className="p-2 bg-white/10 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {selectedEntry.items?.map((item: any, i: number) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 border border-white/10">
                    <span className="text-xl">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate">{item.name}</p>
                      <p className="text-[8px] opacity-70 uppercase">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] leading-relaxed italic opacity-90">
                  "{selectedEntry.reasoning}"
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-200 text-center flex flex-col items-center justify-center text-gray-400">
              <Clock className="size-8 mb-3 opacity-20" />
              <p className="text-sm font-medium mb-1 text-gray-600">No outfit planned yet</p>
              <p className="text-[10px] max-w-[200px]">
                Go to your Lookbook and tap "Schedule" to add an outfit to this day!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
