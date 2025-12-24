
import React, { useState } from 'react';
import { AspectRatio } from '../types';
import { generateImagePro } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<AspectRatio>('1:1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      // Switched to Flash model generator in service
      const imageUrl = await generateImagePro(prompt, aspect);
      setResult(imageUrl);
    } catch (err: any) {
      setError(err.message || 'Generation failed. Check your API key limits.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="hidden md:block">
        <h2 className="text-4xl font-bold mb-2">Creative Vision</h2>
        <p className="text-zinc-400">Powered by Gemini 2.5 Flash • Free Tier Optimized</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-4 space-y-4 md:space-y-6 order-2 lg:order-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Creative Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'A futuristic sculpture made of liquid light, ultra detailed'..."
              className="w-full h-32 md:h-40 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none text-sm placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspect(r)}
                  className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                    aspect === r ? 'bg-zinc-100 text-black border-white' : 'bg-black text-zinc-500 border-zinc-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full py-4 bg-zinc-100 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
          >
            {loading ? 'Crafting...' : 'Generate Art'}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-tight">{error}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="aspect-square w-full bg-zinc-900/20 rounded-3xl border border-zinc-800 flex items-center justify-center group relative overflow-hidden shadow-2xl">
            {result ? (
              <>
                <img src={result} alt="Generated" className="w-full h-full object-contain" />
                <a 
                  href={result} 
                  download="ai-jozef-art.png"
                  className="absolute bottom-4 right-4 p-3 bg-black/60 backdrop-blur rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </a>
              </>
            ) : (
              <div className="text-center p-8 opacity-20">
                <div className="text-5xl mb-3 grayscale">✨</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Awaiting your prompt</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Developing Art...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
