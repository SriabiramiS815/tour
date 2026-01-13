import React, { useState } from 'react';

interface CategoryPageProps {
    category: string;
    onBack: () => void;
    onSearch: (details: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ category, onBack, onSearch }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(`I want to book ${category} from ${from} to ${to} on ${date}`);
    };

    const getIcon = () => {
        switch (category) {
            case 'Flights': return '✈️';
            case 'Hotels': return '🏨';
            case 'Holiday Packages': return '🏖️';
            case 'Trains/Bus': return '🚆';
            default: return '🗺️';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
            {/* Header */}
            <div className="bg-teal-600 p-6 text-white shrink-0 shadow-md">
                <button onClick={onBack} className="flex items-center text-teal-100 hover:text-white mb-4 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{getIcon()}</div>
                    <div>
                        <h1 className="text-2xl font-bold">Book {category}</h1>
                        <p className="text-teal-100 text-sm opacity-90">Find the best deals for your next trip.</p>
                    </div>
                </div>
            </div>

            {/* Main Form Content */}
            <div className="flex-1 p-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 max-w-lg mx-auto">
                    <form onSubmit={handleSearch} className="space-y-5">

                        {category !== 'Hotels' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
                                    <input
                                        type="text"
                                        placeholder="Enter City or Airport"
                                        value={from}
                                        onChange={e => setFrom(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {category === 'Hotels' ? 'Destination' : 'To'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🏁</span>
                                <input
                                    type="text"
                                    placeholder="Enter Destination"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Travel Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                        >
                            <span>Search {category}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </button>
                    </form>
                </div>

                {/* Promo Banners */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-4 text-blue-800 dark:text-blue-100">
                        <div className="text-3xl">💳</div>
                        <div>
                            <h3 className="font-bold text-sm">Bank Offer</h3>
                            <p className="text-xs">Flat 10% off on Credit Cards</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl flex items-center gap-4 text-orange-800 dark:text-orange-100">
                        <div className="text-3xl">🎁</div>
                        <div>
                            <h3 className="font-bold text-sm">First Booking</h3>
                            <p className="text-xs">Get ₹500 off on your first trip</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
