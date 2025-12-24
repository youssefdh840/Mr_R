
import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import ThinkingChat from './components/ThinkingChat';
import VideoGenerator from './components/VideoGenerator';
import ChatBot from './components/ChatBot';
import SystemInfo from './components/SystemInfo';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.IMAGE_GEN);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Helper to determine if a key is truly present and valid
  const checkKeyValidity = async () => {
    const envKey = process.env.API_KEY;
    const isEnvKeyValid = envKey && envKey !== 'undefined' && envKey !== 'null' && envKey.trim() !== '';
    
    if (isEnvKeyValid) return true;

    if (window.aistudio) {
      try {
        return await window.aistudio.hasSelectedApiKey();
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  // Connection status heartbeat
  useEffect(() => {
    const performCheck = async () => {
      const valid = await checkKeyValidity();
      setIsConnected(valid);
    };
    
    performCheck();
    const timer = setInterval(performCheck, 4000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: AppMode.IMAGE_GEN, label: 'Gen', icon: '✨' },
    { id: AppMode.IMAGE_EDIT, label: 'Edit', icon: '🎨' },
    { id: AppMode.VIDEO_GEN, label: 'Motion', icon: '🎬' },
    { id: AppMode.GENERAL_CHAT, label: 'Chat', icon: '💬' },
    { id: AppMode.THINKING_CHAT, label: 'Think', icon: '🧠' },
    { id: AppMode.SYSTEM_INFO, label: 'System', icon: '⚙️' },
  ];

  const handleNavClick = (mode: AppMode) => {
    setActiveMode(mode);
  };

  const handleConnect = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success to allow app state to refresh
      setIsConnected(true);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex w-64 border-r border-zinc-800 p-4 flex-col gap-2 h-screen sticky top-0 bg-black z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold">J</span>
          </div>
          <h1 className="text-xl font-bold tracking-tighter">AI Jozef ®</h1>
        </div>
        
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeMode === item.id 
                ? 'bg-zinc-100 text-black font-semibold shadow-lg shadow-white/5' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}

        <div className="mt-auto p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              {isConnected ? 'Kernel Online' : 'System Locked'}
            </span>
          </div>
          
          <button 
            onClick={handleConnect}
            className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              isConnected 
                ? 'bg-zinc-800/50 text-zinc-500 hover:text-white' 
                : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
            }`}
          >
            {isConnected ? 'Rotate Key' : 'Activate App'}
          </button>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <span className="text-black text-xs font-bold">J</span>
          </div>
          <h1 className="text-lg font-bold tracking-tighter text-white">AI Jozef</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
           <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {navItems.find(n => n.id === activeMode)?.label}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full flex flex-col pb-24 md:pb-0 relative">
        {/* Activation Gate Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center p-6 text-center animate-in fade-in duration-700">
            <div className="max-w-xs space-y-6">
              <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl relative">
                <span className="text-4xl">🔐</span>
                <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-[2.6rem] -z-10 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Activation Required</h2>
              <p className="text-zinc-500 text-sm leading-relaxed px-4">
                To enable image, video, and chat processing, please link your Google Gemini API Key.
              </p>
              <button 
                onClick={handleConnect}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                Connect API Key
              </button>
              <div className="pt-4 flex flex-col gap-1">
                <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-black">
                  Powered by Gemini 3 Flash
                </p>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  className="text-[8px] text-zinc-500 underline decoration-zinc-800 uppercase tracking-widest"
                >
                  Billing Docs
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 flex-grow w-full h-full">
          {activeMode === AppMode.IMAGE_GEN && <ImageGenerator />}
          {activeMode === AppMode.IMAGE_EDIT && <ImageEditor />}
          {activeMode === AppMode.VIDEO_GEN && <VideoGenerator />}
          {activeMode === AppMode.GENERAL_CHAT && <ChatBot />}
          {activeMode === AppMode.THINKING_CHAT && <ThinkingChat />}
          {activeMode === AppMode.SYSTEM_INFO && <SystemInfo />}
        </div>

        {/* Modern Footer */}
        <footer className="w-full py-8 px-4 border-t border-zinc-900 bg-black flex flex-col items-center gap-4 mb-4 md:mb-0">
          <a 
            href="https://www.instagram.com/dh_youssef_8_4?igsh=cXhybnJudHQ1MGhp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-6 py-3 bg-zinc-900/40 border border-zinc-800/50 rounded-full hover:bg-zinc-800 transition-all duration-300 active:scale-95"
          >
            <svg 
              className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.247 2.242 1.308 3.607.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.247-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.247-2.242-1.308-3.607-.058-1.266-.07-4.85-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.247 3.607-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors tracking-tight">
              Follow dh_youssef_8_4
            </span>
          </a>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-900 flex justify-around p-3 z-50 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[60px] ${
              activeMode === item.id 
                ? 'text-white scale-110' 
                : 'text-zinc-600'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            {activeMode === item.id && (
              <div className="w-1 h-1 bg-white rounded-full mt-0.5" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
