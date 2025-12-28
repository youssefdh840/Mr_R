import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageEditor: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100
  });

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string);
        setResult(null);
        resetFilters();
        setCropBox(null);
        setIsCropping(false);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilterChange = (key: keyof ImageFilters, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ brightness: 100, contrast: 100, saturation: 100 });
  };

  const handleSwitchKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setError(null);
    }
  };

  // --- Camera Logic ---

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setSourceImage(null);
      setIsCropping(false);
      setError(null);
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access to take photos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setSourceImage(dataUrl);
        stopCamera();
        setResult(null);
        resetFilters();
      }
    }
  };

  // --- Cropping Logic ---
  
  const startCrop = () => {
    setIsCropping(true);
    setCropBox(null);
    setIsCameraActive(false);
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCropBox(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCropping || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setIsDragging(true);
    setCropBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    setCropBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (cropBox && (cropBox.width < 1 || cropBox.height < 1)) {
      setCropBox(null);
    }
  };

  const applyCrop = () => {
    if (!cropBox || !sourceImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropX = (cropBox.x / 100) * img.width;
      const cropY = (cropBox.y / 100) * img.height;
      const cropW = (cropBox.width / 100) * img.width;
      const cropH = (cropBox.height / 100) * img.height;

      canvas.width = cropW;
      canvas.height = cropH;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const croppedDataUrl = canvas.toDataURL('image/png');
      setSourceImage(croppedDataUrl);
      setIsCropping(false);
      setCropBox(null);
    };
    img.src = sourceImage;
  };

  // --- AI Edit Logic ---

  const handleEdit = async () => {
    if (!sourceImage || (!prompt && filters.brightness === 100 && filters.contrast === 100 && filters.saturation === 100)) return;
    setLoading(true);
    setError(null);
    
    const adjustmentParts = [];
    if (filters.brightness !== 100) adjustmentParts.push(`set brightness to ${filters.brightness}%`);
    if (filters.contrast !== 100) adjustmentParts.push(`set contrast to ${filters.contrast}%`);
    if (filters.saturation !== 100) adjustmentParts.push(`set saturation to ${filters.saturation}%`);
    
    const finalPrompt = adjustmentParts.length > 0 
      ? `Apply these visual adjustments: ${adjustmentParts.join(', ')}. ${prompt ? `Also, ${prompt}` : ''}`
      : prompt;

    try {
      const edited = await editImage(sourceImage, finalPrompt);
      setResult(edited);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterStyle = {
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="hidden md:block">
        <h2 className="text-4xl font-bold mb-2">Creative Redesign</h2>
        <p className="text-zinc-400">Edit images with natural language, tuning, cropping, and camera capture</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <div 
            ref={imageContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`aspect-video rounded-3xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden relative select-none ${
              isCropping ? 'cursor-crosshair border-white/20' : sourceImage || isCameraActive ? 'border-zinc-700 bg-zinc-900/30' : 'border-zinc-800 border-dashed hover:border-zinc-600 bg-zinc-900 cursor-pointer'
            }`}
          >
            {isCameraActive ? (
              <div className="w-full h-full relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border border-white/20 rounded-full" />
                </div>
              </div>
            ) : sourceImage ? (
              <>
                <img 
                  src={sourceImage} 
                  alt="Source" 
                  className="w-full h-full object-contain pointer-events-none"
                  style={filterStyle}
                />
                
                {isCropping && (
                  <div className="absolute inset-0 bg-black/60">
                    {cropBox && (
                      <div 
                        className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none"
                        style={{
                          left: `${cropBox.x}%`,
                          top: `${cropBox.y}%`,
                          width: `${cropBox.width}%`,
                          height: `${cropBox.height}%`
                        }}
                      >
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-white" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white" />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4" onClick={() => fileInputRef.current?.click()}>
                <div className="text-4xl">📤</div>
                <p className="text-zinc-400 font-medium">Click to upload or use Camera</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">JPG, PNG, or WEBP</p>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />

            {sourceImage && !isCropping && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Source Preview
              </div>
            )}
            
            {isCameraActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button 
                  onClick={stopCamera}
                  className="px-6 py-2 bg-zinc-800/80 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-700 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={capturePhoto}
                  className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl active:scale-90 transition-transform"
                >
                  Capture
                </button>
              </div>
            )}

            {isCropping && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                {cropBox ? 'Release to select area' : 'Click and drag to crop'}
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 space-y-6">
            {isCropping ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Crop Selection</h3>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={cancelCrop}
                    className="flex-1 py-3 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={applyCrop}
                    disabled={!cropBox}
                    className="flex-1 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-100 disabled:opacity-20 transition-all shadow-lg"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Image Tools</h3>
                  <div className="flex gap-4">
                    {!isCameraActive && !sourceImage && (
                      <button 
                        onClick={startCamera}
                        className="text-[9px] font-bold text-zinc-400 hover:text-white transition-colors uppercase"
                      >
                        📷 Camera
                      </button>
                    )}
                    {sourceImage && (
                      <button 
                        onClick={startCrop}
                        className="text-[9px] font-bold text-zinc-400 hover:text-white transition-colors uppercase"
                      >
                        ✂️ Crop
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        resetFilters();
                        setSourceImage(null);
                        setResult(null);
                        setIsCameraActive(false);
                        setError(null);
                      }}
                      className="text-[9px] font-bold text-zinc-600 hover:text-white transition-colors uppercase"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {[
                    { label: 'Brightness', key: 'brightness', icon: '☀️' },
                    { label: 'Contrast', key: 'contrast', icon: '🌗' },
                    { label: 'Saturation', key: 'saturation', icon: '🌈' }
                  ].map(adj => (
                    <div key={adj.key} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-400 px-1">
                        <span className="flex items-center gap-2">
                          <span className="grayscale opacity-50">{adj.icon}</span>
                          {adj.label.toUpperCase()}
                        </span>
                        <span>{filters[adj.key as keyof ImageFilters]}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="200"
                        value={filters[adj.key as keyof ImageFilters]}
                        onChange={(e) => handleFilterChange(adj.key as keyof ImageFilters, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {!isCropping && !isCameraActive && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe additional changes..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-32 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm placeholder:text-zinc-700"
                />
                <button
                  onClick={handleEdit}
                  disabled={loading || !sourceImage}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black text-xs font-black uppercase tracking-tighter rounded-xl hover:bg-zinc-100 disabled:opacity-30 transition-all active:scale-95"
                >
                  {loading ? '...' : 'Apply AI'}
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
          )}
        </div>

        <div className="space-y-4">
          <div className="aspect-video bg-zinc-900/20 rounded-3xl border border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
            {result ? (
              <>
                <img src={result} alt="Edited result" className="w-full h-full object-contain animate-in fade-in duration-1000" />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-bold text-white uppercase tracking-widest">
                  AI Result
                </div>
                <a 
                  href={result} 
                  download="edited-art.png"
                  className="absolute bottom-4 right-4 p-3 bg-white text-black rounded-full shadow-xl hover:scale-110 transition-transform active:scale-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </a>
              </>
            ) : (
              <div className="text-center opacity-20 p-8">
                <div className="text-5xl mb-3 grayscale">✨</div>
                <p className="text-[10px] font-black uppercase tracking-widest">Reimagined View</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Processing Vision...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;