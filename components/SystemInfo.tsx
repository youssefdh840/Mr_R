
import React from 'react';

const SystemInfo: React.FC = () => {
  const apiKey = process.env.API_KEY || '';
  const isSelected = apiKey && apiKey !== 'undefined';
  const maskedKey = isSelected 
    ? `${apiKey.substring(0, 4)}••••••••${apiKey.substring(apiKey.length - 4)}` 
    : 'DISCONNECTED';

  const systemData = [
    { label: 'Runtime Environment', value: 'Production Web Interface' },
    { label: 'Active API Key', value: maskedKey, color: isSelected ? 'text-zinc-200' : 'text-amber-500' },
    { label: 'Primary Text Model', value: 'gemini-3-flash-preview' },
    { label: 'Vision Model', value: 'gemini-2.5-flash-image' },
    { label: 'Motion Engine', value: 'veo-3.1-fast-generate-preview' },
    { label: 'Connection Status', value: isSelected ? 'ACTIVE' : 'OFFLINE', color: isSelected ? 'text-green-500' : 'text-amber-500' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-4xl font-bold mb-2">System Status</h2>
        <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em]">Diagnostic Dashboard & Key Metadata</p>
      </header>

      <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/40 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Core Configuration</h3>
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-500 font-mono">v1.0.5</span>
        </div>
        <div className="divide-y divide-zinc-800/40">
          {systemData.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-zinc-900/20 transition-colors">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 md:mb-0">{item.label}</span>
              <span className={`font-mono text-sm ${item.color || 'text-zinc-200'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => window.aistudio?.openSelectKey()}
          className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-all group text-left"
        >
          <div className="text-2xl mb-3">🔑</div>
          <h4 className="font-bold text-sm mb-1 group-hover:text-white transition-colors">Switch / Update Key</h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-tighter leading-relaxed">Update your AI project access or rotate credentials via the secure picker.</p>
        </button>

        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-all group block"
        >
          <div className="text-2xl mb-3">📊</div>
          <h4 className="font-bold text-sm mb-1 group-hover:text-white transition-colors">Quotas & Limits</h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-tighter leading-relaxed">View documentation on Gemini Free Tier vs Paid Tier resource allocation.</p>
        </a>
      </div>

      <footer className="text-center pt-8 opacity-40">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em]">AI Jozef Kernel Service ®</p>
      </footer>
    </div>
  );
};

export default SystemInfo;
