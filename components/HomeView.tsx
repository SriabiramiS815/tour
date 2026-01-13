import React, { useMemo, useState } from 'react';
import { ALL_DESTINATIONS } from '../constants';
import { Destination } from '../types';

interface HomeViewProps {
  onPlanTrip: (dest: Destination) => void;
  onGeneralInquiry: () => void;
  onCategorySelect: (category: string) => void;
  onVoiceInquiry: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onPlanTrip, onGeneralInquiry, onCategorySelect, onVoiceInquiry }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_DESTINATIONS.map(d => d.category)));
    return ['All', ...cats];
  }, []);

  const filteredDestinations = useMemo(() => {
    if (selectedCategory === 'All') return ALL_DESTINATIONS;
    return ALL_DESTINATIONS.filter(d => d.category === selectedCategory);
  }, [selectedCategory]);

  const bookingCategories = [
    { name: 'Flights', icon: '✈️' },
    { name: 'Hotels', icon: '🏨' },
    { name: 'Holiday Packages', icon: '🏖️' },
    { name: 'Trains/Bus', icon: '🚆' },
  ];

  const secondaryCategories = [
    { name: 'Airport Cabs', icon: '🚖' },
    { name: 'Villas & Homestays', icon: '🏡' },
    { name: 'Outstation Cabs', icon: '🚙' },
    { name: 'Forex Card', icon: '💱' },
    { name: 'Tours', icon: '🗺️' },
    { name: 'Hourly Stays', icon: '🛌' },
    { name: 'Visa', icon: '🛂' },
    { name: 'Insurance', icon: '🛡️' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-20 scrollbar-hide transition-colors">

      {/* Booking Grid Section - White Card Style */}
      <div className="m-4 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">

        {/* Primary Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {bookingCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategorySelect(cat.name)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-slate-700 transition-colors">
                {cat.icon}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-4 gap-y-6 gap-x-2">
          {secondaryCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategorySelect(cat.name)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-lg flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                {cat.icon}
              </div>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight max-w-[60px]">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Show More Chevron */}
        <div className="flex justify-center mt-6">
          <div className="text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 animate-bounce">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

      </div>

      {/* Offers / Banner */}
      <div className="px-4 mb-2">
        <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden relative shadow-md">
          <img
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop"
            alt="Offer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-6">
            <div>
              <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block">Sale</span>
              <h3 className="text-white font-bold text-xl mb-1">Summer Escapes</h3>
              <p className="text-white/80 text-xs mb-3">Up to 40% off on hotels</p>
              <button onClick={onGeneralInquiry} className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full">Book Now</button>
            </div>
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="p-4 pt-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Trending Destinations</h2>

          {/* Category Filter */}
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border ${selectedCategory === cat
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => onPlanTrip(dest)}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full cursor-pointer group overflow-hidden"
            >
              <div className="relative h-28 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded px-2">
                  {dest.startingPrice}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight mb-1">{dest.name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{dest.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice FAB */}
      <button
        onClick={onVoiceInquiry}
        className="absolute bottom-6 right-6 w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center animate-bounce-slow transition-transform hover:scale-110 active:scale-95 z-50"
        title="Start Voice Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
          <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
        </svg>
      </button>
    </div >
  );
};