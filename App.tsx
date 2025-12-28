
import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (hasKey || process.env.API_KEY) {
        setIsReady(true);
      }
    }
    setIsChecking(false);
  };

  const handleActivate = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success after dialog trigger per environment guidelines
      setIsReady(true);
    }
  };

  const navItems = [
    { id: AppMode.IMAGE_GEN, label: 'GEN', icon: '✨' },
    { id: AppMode.IMAGE_EDIT, label: 'EDIT', icon: '🎨' },
    { id: AppMode.VIDEO_GEN, label: 'MOTION', icon: '🎬' },
    { id: AppMode.CHAT, label: 'CHAT', icon: '💬' },
    { id: AppMode.THINK, label: 'THINK', icon: '🧠' },
  ];

  if (isChecking) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl mb-10 flex items-center justify-center border border-zinc-800 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
           <span className="text-4xl">🗝️</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Neural Link Offline</h1>
        <p className="text-zinc-500 text-sm mb-12 max-w-sm leading-relaxed">
          To access the multimedia engine, you must select a valid Gemini API key from a paid GCP project.
        </p>
        <button 
          onClick={handleActivate}
          className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95"
        >
          Initialize AI Engine
        </button>
        <p className="mt-10 text-[9px] font-black uppercase tracking-widest text-zinc-700">
          Powered by Gemini 3 & Veo
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col md:flex-row overflow-hidden font-sans animate-in fade-in duration-500">
      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex w-64 border-r border-zinc-900 p-6 flex-col gap-2 h-screen bg-black">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-black font-black text-xl">J</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter">AI Jozef ®</h1>
            <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">Multimedia Engine</p>
          </div>
        </div>
        
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMode(item.id)}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
              activeMode === item.id 
                ? 'bg-zinc-900 text-white shadow-xl scale-105' 
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <span className={`text-xl ${activeMode === item.id ? 'grayscale-0' : 'grayscale opacity-50'}`}>
              {item.icon}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}

        <div className="mt-auto pt-6 border-t border-zinc-900 space-y-4">
          <button 
            onClick={handleActivate}
            className="w-full text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors py-2 border border-zinc-900 rounded-lg"
          >
            Reconfigure Link
          </button>
          <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em]">Kernel Version 1.1.0</p>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-screen">
        <header className="p-6 md:p-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button className="p-3 bg-zinc-900/50 rounded-xl md:hidden">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">AI Assistant</h1>
              <p className="text-[10px] md:text-xs text-zinc-600 font-black uppercase tracking-[0.3em] mt-1">
                SECURE NEURAL GATEWAY ACTIVE
              </p>
            </div>
          </div>

          <a 
            href="https://www.instagram.com/dh_youssef_8_4?igsh=cXhybnJudHQ1MGhp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 md:p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 group"
            title="Follow on Instagram"
          >
            <svg 
              className="w-5 h-5 md:w-6 md:h-6 text-zinc-400 group-hover:text-white transition-colors" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.247 2.242 1.308 3.607.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.247-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.247-2.242-1.308-3.607-.058-1.266-.07-4.85-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.247 3.607-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
              @dh_youssef_8_4
            </span>
          </a>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-32">
          {activeMode === AppMode.IMAGE_GEN && <ImageGenerator />}
          {activeMode === AppMode.IMAGE_EDIT && <ImageEditor />}
          {activeMode === AppMode.VIDEO_GEN && <VideoGenerator />}
          {(activeMode === AppMode.CHAT || activeMode === AppMode.THINK) && (
            <ChatInterface mode={activeMode === AppMode.THINK ? 'THINK' : 'CHAT'} />
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-zinc-900 flex justify-around p-4 pb-8 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMode(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeMode === item.id ? 'text-white' : 'text-zinc-600'
              }`}
            >
              <span className={`text-2xl mb-1 ${activeMode === item.id ? 'scale-110' : 'grayscale opacity-50'}`}>
                {item.icon}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {activeMode === item.id && (
                <div className="w-1 h-1 bg-white rounded-full mt-1" />
              )}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default App;
