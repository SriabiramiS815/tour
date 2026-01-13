import React, { useState } from 'react';
import { AppView, AgentMode, Destination } from './types';
import { ChatAgent } from './components/ChatAgent';
import { VoiceAgent } from './components/VoiceAgent';
import { HomeView } from './components/HomeView';
import { CategoryPage } from './components/CategoryPage';

const API_KEY = process.env.API_KEY || '';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [agentMode, setAgentMode] = useState<AgentMode>(AgentMode.VOICE);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Handle "Plan this" click from Home Page
  const handlePlanTrip = (dest: Destination) => {
    setInitialPrompt(`I am interested in planning a trip to ${dest.name} (${dest.category}). Can you help me plan an itinerary?`);
    setCurrentView(AppView.ASSISTANT);
    setAgentMode(AgentMode.CHAT);
  };

  const handleGeneralInquiry = () => {
    setInitialPrompt(undefined);
    setCurrentView(AppView.ASSISTANT);
    setAgentMode(AgentMode.CHAT);
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView(AppView.CATEGORY);
  };

  if (!API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-slate-600">The API Key is missing. Please ensure <code>process.env.API_KEY</code> is correctly configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>

      {/* Top Header / Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm relative transition-colors">
        <div className="flex items-center space-x-2">
          <div className="bg-teal-600 p-1.5 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Sri Tours</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full transition-colors">
            <button
              onClick={() => setCurrentView(AppView.HOME)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.HOME ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Discover
            </button>
            <button
              onClick={() => setCurrentView(AppView.ASSISTANT)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center space-x-1 ${currentView === AppView.ASSISTANT ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <span>Assistant</span>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">

        {/* Home View */}
        {currentView === AppView.HOME && (
          <HomeView
            onPlanTrip={handlePlanTrip}
            onGeneralInquiry={handleGeneralInquiry}
            onCategorySelect={handleCategorySelect}
            onVoiceInquiry={() => {
              setInitialPrompt(undefined);
              setCurrentView(AppView.ASSISTANT);
              setAgentMode(AgentMode.VOICE);
            }}
          />
        )}

        {/* Category Page View */}
        {currentView === AppView.CATEGORY && selectedCategory && (
          <CategoryPage
            category={selectedCategory}
            onBack={() => setCurrentView(AppView.HOME)}
            onSearch={(details) => {
              setInitialPrompt(details);
              setCurrentView(AppView.ASSISTANT);
              setAgentMode(AgentMode.CHAT);
            }}
          />
        )}

        {/* Agent View */}
        {currentView === AppView.ASSISTANT && (
          <div className="h-full flex flex-col">

            {/* Mode Toggle (Chat / Voice) */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-2 flex justify-center shrink-0 transition-colors">
              <div className="relative bg-slate-100 dark:bg-slate-800 rounded-full p-1 flex w-48 h-10 shadow-inner transition-colors">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-600 rounded-full shadow-sm transition-all duration-300 ease-out ${agentMode === AgentMode.CHAT ? 'left-1' : 'left-[calc(50%+2px)]'
                    }`}
                ></div>
                <button
                  onClick={() => setAgentMode(AgentMode.CHAT)}
                  className={`flex-1 relative z-10 flex items-center justify-center text-sm font-semibold transition-colors ${agentMode === AgentMode.CHAT ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setAgentMode(AgentMode.VOICE)}
                  className={`flex-1 relative z-10 flex items-center justify-center text-sm font-semibold transition-colors ${agentMode === AgentMode.VOICE ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Voice
                </button>
              </div>
            </div>

            {/* Container for Agents */}
            <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors">
              {agentMode === AgentMode.CHAT ? (
                <ChatAgent apiKey={API_KEY} initialMessage={initialPrompt} key="chat-agent" />
              ) : (
                <div className="h-full p-4 flex items-center justify-center">
                  <div className="w-full h-full max-w-lg rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5 dark:ring-slate-100/10">
                    <VoiceAgent apiKey={API_KEY} key="voice-agent" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;