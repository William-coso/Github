import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PatternCanvas } from './components/PatternCanvas';
import { quantizeColors } from './utils/imageProcessing';
import { Settings, Download, Palette, Grid3X3, Image as ImageIcon, List, Loader2, Wand2 } from 'lucide-react';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const [maxBeads, setMaxBeads] = useState<number>(40);
  const [colorCount, setColorCount] = useState<number>(15);

  const [isProcessing, setIsProcessing] = useState(false);
  const [patternData, setPatternData] = useState<ImageData | null>(null);
  const [palette, setPalette] = useState<{r: number, g: number, b: number, count: number}[]>([]);

  const [activeTab, setActiveTab] = useState<'pattern' | 'original' | 'list'>('pattern');

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
      };
      img.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const generatePattern = async () => {
    if (!imageElement) return;
    setIsProcessing(true);

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const ratio = imageElement.naturalWidth / imageElement.naturalHeight;
      let width, height;
      if (ratio > 1) {
        width = maxBeads;
        height = Math.round(maxBeads / ratio);
      } else {
        height = maxBeads;
        width = Math.round(maxBeads * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get 2d context");

      // Draw image to small canvas to pixelate
      ctx.drawImage(imageElement, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Quantize colors
      const { quantizedData, palette: newPalette } = quantizeColors(imageData, colorCount);

      setPatternData(quantizedData);
      setPalette(newPalette);
      setActiveTab('pattern');
    } catch (error) {
      console.error("Error generating pattern:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Grid3X3 className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Perler Studio</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-500" />
                1. Source Image
              </h2>
              <ImageUploader onImageUpload={setImageFile} imageUrl={imageUrl} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Settings size={16} className="text-indigo-500" />
                2. Pattern Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Grid Size (Max Beads)</label>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{maxBeads}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={maxBeads} 
                    onChange={(e) => setMaxBeads(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-slate-500 mt-2">Larger grids capture more detail but require more beads.</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Number of Colors</label>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{colorCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="40" 
                    value={colorCount} 
                    onChange={(e) => setColorCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-slate-500 mt-2">Fewer colors make the pattern easier to build.</p>
                </div>

                <button
                  onClick={generatePattern}
                  disabled={!imageElement || isProcessing}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Wand2 size={18} /> Generate Pattern</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Area - Preview */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
              
              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button
                  onClick={() => setActiveTab('pattern')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'pattern' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <Grid3X3 size={18} /> Pattern
                </button>
                <button
                  onClick={() => setActiveTab('original')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'original' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <ImageIcon size={18} /> Original
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <List size={18} /> Bead List
                </button>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                {!imageUrl ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon size={48} className="mb-4 opacity-20" />
                    <p>Upload an image to get started</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'original' && (
                      <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-4">
                        <img src={imageUrl} alt="Original" className="max-w-full max-h-[500px] object-contain rounded shadow-sm" />
                      </div>
                    )}
                    
                    {activeTab === 'pattern' && (
                      <div className="flex-1 flex flex-col">
                        {!patternData ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Wand2 size={48} className="mb-4 opacity-20" />
                            <p>Click "Generate Pattern" to see the result</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-sm text-slate-500 font-medium">
                                Dimensions: {patternData.width} × {patternData.height} beads
                              </p>
                              <p className="text-sm text-slate-500 font-medium">
                                Total: {patternData.width * patternData.height} beads
                              </p>
                            </div>
                            <PatternCanvas patternData={patternData} />
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'list' && (
                      <div className="flex-1">
                        {!patternData ? (
                          <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-400">
                            <Palette size={48} className="mb-4 opacity-20" />
                            <p>Generate a pattern to see the required beads</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {palette.map((color, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                <div 
                                  className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0"
                                  style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                />
                                <div>
                                  <p className="text-xs font-mono text-slate-500">
                                    #{color.r.toString(16).padStart(2,'0')}{color.g.toString(16).padStart(2,'0')}{color.b.toString(16).padStart(2,'0')}
                                  </p>
                                  <p className="text-sm font-bold text-slate-800">{color.count} <span className="text-xs font-normal text-slate-500">beads</span></p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
