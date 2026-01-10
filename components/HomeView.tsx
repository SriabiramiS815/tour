import React, { useMemo, useState } from 'react';
import { ALL_DESTINATIONS } from '../constants';
import { Destination } from '../types';

interface HomeViewProps {
  onPlanTrip: (dest: Destination) => void;
  onGeneralInquiry: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onPlanTrip, onGeneralInquiry }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_DESTINATIONS.map(d => d.category)));
    return ['All', ...cats];
  }, []);

  const filteredDestinations = useMemo(() => {
    if (selectedCategory === 'All') return ALL_DESTINATIONS;
    return ALL_DESTINATIONS.filter(d => d.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-20 scrollbar-hide transition-colors">
      
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 w-full bg-slate-900 overflow-hidden shrink-0">
        <img 
          src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1000&auto=format&fit=crop" 
          alt="India Travel" 
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <span className="bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">Explore India</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Incredible India</h1>
          <p className="text-slate-200 text-sm md:text-base max-w-lg mb-4">
            From the Himalayas to the Indian Ocean, discover every corner of India with Sri Tours. 
          </p>
          <button 
            onClick={onGeneralInquiry}
            className="bg-white text-slate-900 font-semibold px-6 py-2 rounded-full hover:bg-teal-50 transition-colors shadow-lg flex items-center gap-2"
          >
            <span>Ask Sri Assistant</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Popular Destinations</h2>
          
          {/* Category Filter */}
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredDestinations.map((dest) => (
            <div 
              key={dest.id} 
              onClick={() => onPlanTrip(dest)}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800 flex flex-col h-full cursor-pointer group"
            >
              <div className="relative h-32 md:h-40 overflow-hidden rounded-t-xl">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-2 left-2 text-white">
                   <h3 className="font-bold text-sm md:text-base leading-tight shadow-sm">{dest.name}</h3>
                   <p className="text-[10px] md:text-xs text-slate-200">{dest.category}</p>
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dest.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-sm">{tag}</span>
                  ))}
                </div>
                <div className="mt-auto flex items-end justify-end">
                  <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M8.25 3.75H19.5a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-1.5 0V6.31L5.03 20.03a.75.75 0 0 1-1.06-1.06L17.69 5.25H8.25a.75.75 0 0 1 0-1.5Z" clipRule="evenodd" />
                     </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Markers */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-10 mt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <h2 className="text-center text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest font-bold mb-8">Why Choose Sri Tours?</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
               </svg>
             </div>
             <h4 className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200">Any Language</h4>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
               </svg>
             </div>
             <h4 className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200">Verified Agents</h4>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded-full flex items-center justify-center mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 4.5ZM3 4.5v15m9-9.47v8.61M21 12.75V18.75M21 4.5v.75A.75.75 0 0 1 21 4.5ZM21 4.5v15m-9-9.47v8.61m0-8.61a9.049 9.049 0 0 1-5.653-8.61c0-.46.38-.75.75-.75h.75a.75.75 0 0 1 .75.75 9.76 9.76 0 0 0 2.599 6.359L12 11.623Zm0 0a9.049 9.049 0 0 0 5.653-8.61c0-.46-.38-.75-.75-.75h-.75a.75.75 0 0 0-.75.75 9.75 9.75 0 0 1-2.599 6.359L12 11.623Z" />
               </svg>
             </div>
             <h4 className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200">Best Prices</h4>
          </div>
        </div>
      </div>
    </div>
  );
};