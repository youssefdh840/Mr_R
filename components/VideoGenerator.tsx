import React, { useState, useRef } from 'react';
import { generateVideoVeo } from '../services/geminiService';

const VideoGenerator: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setError(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!sourceImage) return;
    setLoading(true);
    setError(null);
    setProgressMsg("Starting cinematic process...");
    try {
      const url = await generateVideoVeo(prompt, sourceImage, aspect, setProgressMsg);
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message);
      setProgressMsg("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="hidden md:block">
        <h2 className="text-4xl font-bold mb-2">Animate Reality</h2>
        <div className="flex items-center gap-3">
           <p className="text-zinc-400">Transform static photos into cinematic videos with Veo 3.1</p>
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
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Upload Source</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Movement Description</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'Slow cinematic zoom into the subject'..."
                  className="w-full h-20 bg-black/40 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setAspect('16:9')}
                  className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${aspect === '16:9' ? 'border-zinc-500 bg-zinc-800 text-white' : 'border-zinc-900 bg-black text-zinc-600'}`}
                >
                  Landscape
                </button>
                <button 
                  onClick={() => setAspect('9:16')}
                  className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${aspect === '9:16' ? 'border-zinc-500 bg-zinc-800 text-white' : 'border-zinc-900 bg-black text-zinc-600'}`}
                >
                  Portrait
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGenerateVideo}
                  disabled={loading || !sourceImage}
                  className="w-full py-4 bg-zinc-100 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white active:scale-95 transition-all disabled:opacity-20"
                >
                  {loading ? 'Processing...' : 'Generate Video'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl space-y-3">
                  <p className="text-red-400 text-[11px] font-medium leading-relaxed">
                    {error}
                  </p>
                  {error.includes("QUOTA") && (
                    <button 
                      onClick={handleSwitchKey}
                      className="w-full py-2 bg-red-500/20 text-red-200 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Switch API Key
                    </button>
                  )}
                </div>
              )}
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
            {videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8 opacity-20">
                <span className="text-5xl block mb-4 grayscale">🎬</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Output Preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;