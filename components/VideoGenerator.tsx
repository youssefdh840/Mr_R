
import React, { useState, useRef } from 'react';
import { generateVideoVeo } from '../services/geminiService';

const VideoGenerator: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isRealVideo, setIsRealVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string);
        setResultUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateMotion = async () => {
    if (!prompt && !sourceImage) return;

    // Check for API key selection before initiating video generation with Veo models
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
      // Proceed assuming success to handle the race condition as per guidelines
    }

    setLoading(true);
    setProgressMsg("Analyzing cinematic potential...");
    try {
      const url = await generateVideoVeo(prompt, sourceImage || '', aspect, setProgressMsg);
      setResultUrl(url);
      
      // Determine if it's a blob (video) or data url (image)
      if (url?.startsWith('blob:')) {
        setIsRealVideo(true);
      } else {
        setIsRealVideo(false);
      }
    } catch (err: any) {
      console.error(err);
      setProgressMsg("Error during cinematic generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="hidden md:block">
        <h2 className="text-4xl font-bold mb-2">Cinematic Motion</h2>
        <div className="flex items-center gap-3">
           <p className="text-zinc-400">Generates professional videos or cinematic motion posters (Free Tier fallback)</p>
           <span className="bg-green-500/10 text-green-500 text-[8px] px-2 py-0.5 rounded border border-green-500/20 font-black uppercase tracking-widest">Free Mode Enabled</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="space-y-4 md:space-y-6 order-2 lg:order-1">
          <div className="p-4 md:p-8 bg-zinc-900/30 border border-zinc-800/60 rounded-3xl space-y-4 md:space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video bg-black border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all flex items-center justify-center overflow-hidden active:scale-[0.99]"
            >
              {sourceImage ? (
                <img src={sourceImage} alt="Reference" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <span className="text-3xl block mb-2 opacity-50">🖼️</span>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Reference Image (Optional)</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Cinematic Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'A futuristic rainy city at night, neon reflections'..."
                  className="w-full h-20 bg-black/40 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="flex gap-2">
                {(['16:9', '9:16'] as const).map((r) => (
                  <button 
                    key={r}
                    onClick={() => setAspect(r)}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${aspect === r ? 'border-zinc-500 bg-zinc-800 text-white' : 'border-zinc-900 bg-black text-zinc-600'}`}
                  >
                    {r === '16:9' ? 'Landscape' : 'Portrait'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGenerateMotion}
                  disabled={loading || (!prompt && !sourceImage)}
                  className="w-full py-4 bg-zinc-100 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white active:scale-95 transition-all disabled:opacity-20"
                >
                  {loading ? 'Processing...' : 'Generate Motion'}
                </button>
                <p className="text-[9px] text-zinc-600 text-center uppercase tracking-tighter">
                  Attempts high-fidelity video; falls back to Cinematic Motion Frame on free keys.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">{progressMsg}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 order-1 lg:order-2">
          <div className={`w-full rounded-3xl bg-zinc-900/20 border border-zinc-800/50 flex items-center justify-center overflow-hidden relative shadow-2xl ${aspect === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[500px] md:max-h-[700px]'}`}>
            {resultUrl ? (
              isRealVideo ? (
                <video 
                  src={resultUrl} 
                  controls 
                  autoPlay 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full overflow-hidden">
                  <img 
                    src={resultUrl} 
                    alt="Cinematic result" 
                    className="w-full h-full object-cover animate-[cinematic-zoom_20s_ease-in-out_infinite_alternate]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Motion Frame</span>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center p-8 opacity-20">
                <span className="text-5xl block mb-4 grayscale">🎬</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Output Preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes cinematic-zoom {
          0% { transform: scale(1.0) translateX(0); }
          100% { transform: scale(1.15) translateX(-2%); }
        }
      `}</style>
    </div>
  );
};

export default VideoGenerator;
