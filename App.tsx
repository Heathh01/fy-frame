import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Maximize2, 
  Aperture, 
  Film, 
  Layers,
  Sun,
  Scissors,
  Clock,
  PenTool,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Plus,
  Lock,
  Unlock,
  Settings2,
  LucideIcon
} from 'lucide-react';

/**
 * Lumina Frame - Ultimate Edition
 * Style: Modern Darkroom
 */

// --- Types ---
interface Color {
  r: number;
  g: number;
  b: number;
}

interface QueueItem {
  id: number;
  file: File;
  src: HTMLImageElement;
  metrics: { width: number; height: number };
  colors: Color[];
}

interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface Metadata {
  camera: string;
  lens: string;
  settings: string;
  date: string;
  quartzDate: string;
  signature: string;
  showMetadata: boolean;
}

interface Preset {
  id: string;
  name: string;
  bg: string;
  text: string;
  icon: React.ReactNode;
}

interface Filter {
  id: string;
  name: string;
}

export default function App() {
  // -- State --
  
  // Queue & Selection
  const [queue, setQueue] = useState<QueueItem[]>([]); 
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const currentImage = currentIndex >= 0 ? queue[currentIndex] : null;

  // 1. Border Logic
  const [borderMode, setBorderMode] = useState<'simple' | 'advanced'>('simple');
  const [scale, setScale] = useState<number>(10); // 10% padding by default
  const [margins, setMargins] = useState<Margins>({ top: 10, bottom: 10, left: 10, right: 10 }); 
  const [borderType, setBorderType] = useState<string>('simple-white'); 

  // 2. Optics & Physics
  const [shadowEnabled, setShadowEnabled] = useState<boolean>(true); 
  const [paletteEnabled, setPaletteEnabled] = useState<boolean>(false);
  const [textureEnabled, setTextureEnabled] = useState<boolean>(false);
  const [leakEnabled, setLeakEnabled] = useState<boolean>(false);
  
  const [filterType, setFilterType] = useState<string>('none'); 
  const [filterStrength, setFilterStrength] = useState<number>(0.5);
  const [filterRadius, setFilterRadius] = useState<number>(20);

  // 3. Imprint & Metadata
  const [quartzEnabled, setQuartzEnabled] = useState<boolean>(false); 
  const [signatureEnabled, setSignatureEnabled] = useState<boolean>(false); 
  const [metadata, setMetadata] = useState<Metadata>({
    camera: 'LEICA M6',
    lens: 'SUMMILUX 35mm',
    settings: 'PORTRA 400',
    date: '1998.05.24', 
    quartzDate: `'98 05 24`, 
    signature: 'Lumina User',
    showMetadata: true
  });

  // UI State
  const [opticsExpanded, setOpticsExpanded] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [geometryExpanded, setGeometryExpanded] = useState<boolean>(true);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // -- Constants --
  const PRESETS: Preset[] = [
    { id: 'simple-white', name: 'Gallery White', bg: '#ffffff', text: '#333333', icon: <Maximize2 size={16} /> },
    { id: 'simple-black', name: 'Darkroom Black', bg: '#121212', text: '#aaaaaa', icon: <Film size={16} /> },
    { id: 'polaroid', name: 'Instant Film', bg: '#f4f4f4', text: '#222222', icon: <ImageIcon size={16} /> },
    { id: 'film-negative', name: 'Film Negative', bg: '#000000', text: '#aaaaaa', icon: <Scissors size={16} /> },
    { id: 'cinema', name: 'Cinema Scope', bg: '#000000', text: '#ffffff', icon: <Aperture size={16} /> },
  ];

  const FILTERS: Filter[] = [
    { id: 'none', name: 'No Filter' },
    { id: 'soft', name: 'Classic Soft' },
    { id: 'black-mist', name: 'Black Mist' },
    { id: 'dreamy', name: 'Nose Grease' },
  ];

  // -- Helpers --
  const extractColors = useCallback((imgElement: HTMLImageElement): Color[] => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) return [];
    
    c.width = 50; c.height = 50;
    ctx.drawImage(imgElement, 0, 0, 50, 50);
    const data = ctx.getImageData(0, 0, 50, 50).data;
    let colors: Color[] = [];
    for (let i = 0; i < data.length; i += 4 * 40) {
        const r = data[i], g = data[i+1], b = data[i+2];
        if ((r+g+b) > 40 && (r+g+b) < 700) colors.push({r,g,b});
    }
    const result: Color[] = [];
    const step = Math.floor(colors.length / 5);
    for(let i=0; i<5; i++) {
        if (colors[i*step]) result.push(colors[i*step]);
    }
    return result;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) processFiles(files);
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const colors = extractColors(img);
          setQueue(prev => {
            const newQueue = [...prev, {
                id: Date.now() + Math.random(),
                file,
                src: img,
                metrics: { width: img.width, height: img.height },
                colors
            }];
            if (prev.length === 0) setCurrentIndex(0);
            return newQueue;
          });
        };
        img.src = event.target.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (currentIndex >= newQueue.length) setCurrentIndex(Math.max(0, newQueue.length - 1));
    else if (newQueue.length === 0) setCurrentIndex(-1);
  };

  // -- Logic: Calculate Margins --
  const getCalculatedMargins = (width: number, height: number): Margins => {
      const maxDim = Math.max(width, height);
      if (borderMode === 'simple') {
          const px = (scale / 100) * maxDim;
          return { top: px, bottom: px, left: px, right: px };
      } else {
          return {
              top: (margins.top / 100) * maxDim,
              bottom: (margins.bottom / 100) * maxDim,
              left: (margins.left / 100) * maxDim,
              right: (margins.right / 100) * maxDim
          };
      }
  };

  // -- Render Core --
  const renderToCanvas = useCallback((canvas: HTMLCanvasElement, item: QueueItem | null) => {
    return new Promise<void>((resolve) => {
        if (!item || !item.src) return resolve();
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve();

        const { src: img, metrics, colors } = item;
        
        const originalW = metrics.width;
        const originalH = metrics.height;
        const maxDim = Math.max(originalW, originalH);
        
        // 1. Margin Calculation
        const m = getCalculatedMargins(originalW, originalH);
        
        let canvasW, canvasH, drawX, drawY;
        
        // 2. Layout Strategies
        if (borderType === 'polaroid') {
            const pSide = maxDim * 0.08; 
            const pBottom = maxDim * 0.25;
            canvasW = originalW + (pSide * 2);
            canvasH = originalH + pSide + pBottom;
            drawX = pSide;
            drawY = pSide;
        } 
        else if (borderType === 'film-negative') {
             const pSide = originalH * 0.05;
             const pTopBot = originalH * 0.35;
             canvasW = originalW + (pSide * 2);
             canvasH = originalH + pTopBot;
             drawX = pSide;
             drawY = (canvasH - originalH) / 2;
        }
        else if (borderType === 'cinema') {
             canvasW = originalW;
             canvasH = originalH + (originalH * 0.25);
             drawX = 0;
             drawY = (canvasH - originalH) / 2;
        }
        else {
             // STANDARD / GALLERY 
             canvasW = originalW + m.left + m.right;
             canvasH = originalH + m.top + m.bottom;
             
             // Auto-expand bottom for text ONLY if in Simple mode
             if (borderMode === 'simple' && (metadata.showMetadata || paletteEnabled || signatureEnabled)) {
                 canvasH += (maxDim * 0.06); 
             }
             
             drawX = m.left;
             drawY = m.top;
        }

        canvas.width = canvasW;
        canvas.height = canvasH;

        const preset = PRESETS.find(p => p.id === borderType);
        
        // 3. Background
        ctx.fillStyle = preset ? preset.bg : '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 4. Texture (Noise)
        if (textureEnabled && borderType !== 'cinema') {
            ctx.save();
            const noiseSize = 128; 
            const noiseCanvas = document.createElement('canvas');
            noiseCanvas.width = noiseSize; noiseCanvas.height = noiseSize;
            const nCtx = noiseCanvas.getContext('2d');
            if (nCtx) {
                for(let i=0; i<noiseSize; i+=2) {
                    for(let j=0; j<noiseSize; j+=2) {
                        if (Math.random() > 0.5) {
                            nCtx.fillStyle = (borderType === 'simple-black' || borderType === 'film-negative') 
                                ? 'rgba(255,255,255,0.03)' 
                                : 'rgba(0,0,0,0.02)';
                            nCtx.fillRect(i, j, 1, 1);
                        }
                    }
                }
                const pattern = ctx.createPattern(noiseCanvas, 'repeat');
                if (pattern) {
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0,0,canvasW, canvasH);
                }
            }
            ctx.restore();
        }

        // 5. Sprockets
        if (borderType === 'film-negative') {
            ctx.fillStyle = '#e5e5e5'; 
            const holeW = canvasH * 0.04;
            const holeH = holeW * 0.7;
            const holeGap = holeW * 1.5;
            const topY = (drawY - holeH) / 2;
            const bottomY = drawY + originalH + topY;
            for(let x = 0; x < canvasW; x += holeGap) {
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, topY, holeW, holeH, 4);
                    ctx.roundRect(x, bottomY, holeW, holeH, 4);
                } else {
                    ctx.rect(x, topY, holeW, holeH);
                    ctx.rect(x, bottomY, holeW, holeH);
                }
                ctx.fill();
            }
        }

        // 6. Shadow
        if (shadowEnabled && borderType !== 'cinema' && borderType !== 'film-negative' && preset) {
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
            ctx.shadowBlur = canvasW * 0.02;
            ctx.shadowOffsetX = canvasW * 0.005;
            ctx.shadowOffsetY = canvasW * 0.005;
            ctx.fillStyle = preset.bg; 
            ctx.fillRect(drawX, drawY, originalW, originalH);
            ctx.restore();
        }

        // 7. Draw Image
        ctx.drawImage(img, drawX, drawY, originalW, originalH);

        // 8. Optical Filters
        if (filterType !== 'none') {
            ctx.save();
            const relativeBlur = (filterRadius / 1000) * Math.max(canvasW, canvasH);
            
            if (filterType === 'soft') {
                ctx.globalCompositeOperation = 'screen'; 
                ctx.globalAlpha = filterStrength;
                ctx.filter = `blur(${Math.max(1, relativeBlur)}px)`;
                ctx.drawImage(img, drawX, drawY, originalW, originalH);
            } 
            else if (filterType === 'black-mist') {
                ctx.globalCompositeOperation = 'lighten'; 
                ctx.globalAlpha = filterStrength * 0.8; 
                ctx.filter = `blur(${Math.max(1, relativeBlur * 0.5)}px)`;
                ctx.drawImage(img, drawX, drawY, originalW, originalH);
            }
            else if (filterType === 'dreamy') {
                ctx.globalCompositeOperation = 'screen'; 
                ctx.globalAlpha = filterStrength; 
                ctx.filter = `blur(${Math.max(2, relativeBlur * 2)}px)`;
                ctx.drawImage(img, drawX, drawY, originalW, originalH);
            }
            ctx.restore();
        }

        // 9. Quartz Date
        if (quartzEnabled) {
            ctx.save();
            const qFontSize = Math.max(originalW, originalH) * 0.04;
            ctx.font = `bold ${qFontSize}px "Courier New", monospace`;
            const dateText = metadata.quartzDate;
            const qX = drawX + originalW - (qFontSize * 0.8);
            const qY = drawY + originalH - (qFontSize * 0.8);
            
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = '#ff5500'; 
            ctx.shadowBlur = qFontSize * 0.4;
            ctx.fillStyle = '#ffaa33'; 
            ctx.fillText(dateText, qX, qY);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
            ctx.fillText(dateText, qX, qY);
            ctx.restore();
        }

        // 10. Light Leaks
        if (leakEnabled) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; 
            const grad1 = ctx.createLinearGradient(0, 0, canvasW * 0.4, canvasH);
            grad1.addColorStop(0, 'rgba(255, 140, 0, 0.3)'); 
            grad1.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad1;
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.restore();
        }

        // 11. Typography & Palette
        const baseFontSize = Math.max(canvasW, canvasH) * 0.016; 
        const serifFont = "Times New Roman, serif";
        const sansFont = "Helvetica Neue, sans-serif";
        const cursiveFont = "Brush Script MT, cursive"; 

        let textCursorY;
        if (borderType === 'polaroid') {
            textCursorY = drawY + originalH + ((canvasH - (drawY + originalH)) / 2);
        } else if (borderType === 'cinema') {
            textCursorY = canvasH - (baseFontSize * 1.5);
        } else {
            // Gallery: Center in the bottom margin
            const availableBottom = canvasH - (drawY + originalH);
            textCursorY = drawY + originalH + (availableBottom / 2);
        }

        if (paletteEnabled && colors && colors.length > 0 && borderType !== 'cinema') {
            const paletteY = textCursorY - (baseFontSize * 2.5);
            const circleSize = baseFontSize * 1.2;
            const gap = circleSize * 1.5;
            let startX;
            if (borderType === 'polaroid') {
                startX = drawX + (circleSize/2); 
            } else {
                startX = (canvasW / 2) - ((colors.length * gap) / 2) + (gap/2); 
            }
            colors.forEach((color, i) => {
                ctx.beginPath();
                ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                ctx.arc(startX + (i * gap), paletteY, circleSize/2, 0, Math.PI * 2);
                ctx.fill();
            });
            // Shift text down if palette is present
            textCursorY += (baseFontSize * 1);
        }

        if (metadata.showMetadata) {
            ctx.fillStyle = preset ? preset.text : '#000000';
            
            if (borderType === 'polaroid') {
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.font = `italic ${baseFontSize * 1.8}px ${serifFont}`;
                ctx.fillText(metadata.camera, drawX, textCursorY);
                
                if (signatureEnabled) {
                    ctx.textAlign = 'right';
                    ctx.font = `${baseFontSize * 2.5}px ${cursiveFont}`;
                    ctx.fillText(metadata.signature, drawX + originalW, textCursorY);
                } else {
                    ctx.textAlign = 'right';
                    ctx.font = `${baseFontSize * 0.9}px ${sansFont}`;
                    ctx.globalAlpha = 0.6;
                    ctx.fillText(metadata.date, drawX + originalW, textCursorY);
                }
            } else if (borderType === 'cinema') {
                ctx.textAlign = 'center';
                ctx.font = `${baseFontSize * 0.7}px ${sansFont}`;
                ctx.letterSpacing = "4px"; 
                ctx.fillText(`${metadata.camera}  //  ${metadata.settings}`.toUpperCase(), canvasW / 2, textCursorY);
            } else {
                // Gallery
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                
                ctx.font = `bold ${baseFontSize * 1.2}px ${serifFont}`;
                ctx.fillText(metadata.camera.toUpperCase(), canvasW / 2, textCursorY - (baseFontSize * 0.9));
                
                ctx.font = `${baseFontSize * 0.8}px ${sansFont}`;
                ctx.globalAlpha = 0.7; 
                ctx.fillText(`${metadata.lens}  |  ${metadata.settings}  |  ${metadata.date}`, canvasW / 2, textCursorY + (baseFontSize * 0.9));
                ctx.globalAlpha = 1.0;

                if (signatureEnabled) {
                    ctx.save();
                    ctx.textAlign = 'right';
                    ctx.font = `${baseFontSize * 2.0}px ${cursiveFont}`;
                    ctx.fillStyle = '#000000';
                    // Position signature in bottom right of the margin
                    const sigX = canvasW - (Math.min(m.right, m.bottom) * 0.5) - (maxDim * 0.02);
                    const sigY = canvasH - (m.bottom * 0.3) - (maxDim * 0.02);
                    ctx.fillText(metadata.signature, sigX, sigY);
                    ctx.restore();
                }
            }
        }
        resolve();
    });
  }, [borderType, borderMode, scale, margins, metadata, paletteEnabled, signatureEnabled, shadowEnabled, textureEnabled, leakEnabled, filterType, filterStrength, filterRadius, quartzEnabled]);

  // -- Side Effects --
  useEffect(() => {
    if (!currentImage || !canvasRef.current) return;
    renderToCanvas(canvasRef.current, currentImage).then(() => {
        if(canvasRef.current) {
            setPreviewUrl(canvasRef.current.toDataURL('image/jpeg', 0.8));
        }
    });
  }, [currentImage, renderToCanvas]);

  // -- Batch --
  const handleBatchExport = async () => {
    if (queue.length === 0 || isBatchProcessing) return;
    setIsBatchProcessing(true);
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
    for (let i = 0; i < queue.length; i++) {
       const exportCanvas = document.createElement('canvas');
       await renderToCanvas(exportCanvas, queue[i]);
       const link = document.createElement('a');
       link.download = `LUMINA_BATCH_${i+1}.jpg`;
       link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
       link.click();
       await wait(800);
    }
    setIsBatchProcessing(false);
  };

  const handleSingleExport = () => {
     if (!canvasRef.current) return;
     const link = document.createElement('a');
     link.download = `LUMINA_EXPORT_${Date.now()}.jpg`;
     link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
     link.click();
  };

  // -- UI Helpers --
  interface ToggleProps {
    label: string;
    active: boolean;
    onClick: () => void;
    icon: LucideIcon;
  }
  const Toggle: React.FC<ToggleProps> = ({ label, active, onClick, icon: Icon }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 gap-2 relative overflow-hidden
        ${active 
          ? 'bg-neutral-100 text-black border-white' 
          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}
    >
      <Icon size={18} className="relative z-10" />
      <span className="text-[10px] font-medium uppercase tracking-wider relative z-10">{label}</span>
      {active && <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-96 flex-shrink-0 bg-black border-r border-neutral-800 flex flex-col h-screen overflow-hidden z-20 shadow-2xl">
        
        {/* App Header */}
        <div className="p-5 border-b border-neutral-800 bg-black shrink-0">
          <h1 className="text-2xl font-serif tracking-wider text-white mb-1">LUMINA.</h1>
          <div className="flex items-center gap-2 text-neutral-500">
             <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
             <p className="text-[10px] uppercase tracking-widest">Ultimate Edition</p>
          </div>
        </div>

        {/* Controls Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-6 pb-24">
          
            {/* 1. Queue (Fixed Alignment) */}
            <section>
                <div 
                    className={`relative border border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group flex
                    ${isDragging ? 'border-white bg-neutral-900' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'}
                    ${queue.length > 0 ? 'h-16 flex-row justify-center items-center px-4' : 'h-28 flex-col justify-center items-center'}`}
                    onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault(); 
                        setIsDragging(false);
                        const files = Array.from(e.dataTransfer.files || []) as File[];
                        if(files.length) processFiles(files);
                    }}
                >
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" multiple />
                    {queue.length === 0 ? (
                        <>
                            <Upload className="mb-2 text-neutral-500" size={20} />
                            <span className="text-xs font-medium text-neutral-500">DROP IMAGES HERE</span>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 text-neutral-400">
                            <Plus size={20} />
                            <span className="text-xs font-medium">ADD MORE FILES</span>
                        </div>
                    )}
                </div>

                {queue.length > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                             <h2 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Film Roll ({queue.length})</h2>
                             <button onClick={() => setQueue([])} className="text-[10px] text-red-900 hover:text-red-500">CLEAR ALL</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {queue.map((item, idx) => (
                                <div key={item.id} onClick={() => setCurrentIndex(idx)}
                                    className={`relative shrink-0 w-14 h-14 rounded overflow-hidden border-2 cursor-pointer transition-all
                                        ${idx === currentIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                                >
                                    <img src={item.src.src} className="w-full h-full object-cover" alt="thumb" />
                                    <button onClick={(e) => removeImage(e, idx)} className="absolute top-0 right-0 bg-black/50 text-white p-0.5"><Trash2 size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* 2. Presets */}
            <section>
                <h2 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={12} /> Presets
                </h2>
                <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((preset) => (
                    <button key={preset.id} onClick={() => setBorderType(preset.id)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-md border transition-all duration-200 text-xs group
                        ${borderType === preset.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-700'}`}
                    >
                    <div className="flex items-center gap-3">
                        {preset.icon}
                        <span>{preset.name}</span>
                    </div>
                    {borderType === preset.id && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                    </button>
                ))}
                </div>
            </section>

            {/* 3. Geometry */}
            <section className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/20">
                <div className="flex items-center justify-between p-3 bg-neutral-900/50">
                     <div className="flex items-center gap-2">
                        <Maximize2 size={14} className="text-neutral-500" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Geometry</span>
                     </div>
                     <div className="flex gap-1 bg-neutral-800 rounded p-0.5">
                        <button 
                            onClick={() => setBorderMode('simple')}
                            className={`p-1 rounded ${borderMode === 'simple' ? 'bg-neutral-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            title="Simple Uniform Scale"
                        >
                            <Lock size={12} />
                        </button>
                        <button 
                            onClick={() => setBorderMode('advanced')}
                            className={`p-1 rounded ${borderMode === 'advanced' ? 'bg-neutral-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            title="Advanced 4-Way Margins"
                        >
                            <Unlock size={12} />
                        </button>
                     </div>
                </div>
                
                <div className="p-3 border-t border-neutral-800">
                    {borderMode === 'simple' ? (
                        <div className="space-y-2">
                             <div className="flex justify-between text-[10px] text-neutral-400">
                                <span>Global Scale</span>
                                <span>{scale}%</span>
                             </div>
                             <input type="range" min="0" max="30" step="0.5" value={scale} onChange={(e) => setScale(Number(e.target.value))} 
                                    className="w-full h-1 bg-neutral-700 rounded-lg accent-white" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                            {(['top', 'bottom', 'left', 'right'] as Array<keyof Margins>).map(side => (
                                <div key={side} className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-neutral-400 capitalize">
                                        <span>{side}</span>
                                        <span>{margins[side]}%</span>
                                    </div>
                                    <input type="range" min="0" max="30" step="0.5" 
                                           value={margins[side]} 
                                           onChange={(e) => setMargins({...margins, [side]: Number(e.target.value)})} 
                                           className="w-full h-1 bg-neutral-700 rounded-lg accent-white" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Optics */}
            <section className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/20">
                <button onClick={() => setOpticsExpanded(!opticsExpanded)}
                    className="w-full flex items-center justify-between p-3 bg-neutral-900/50 hover:bg-neutral-900 transition-colors">
                     <div className="flex items-center gap-2">
                        <Sun size={14} className="text-neutral-500" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Optics Lab</span>
                     </div>
                     {opticsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {opticsExpanded && (
                    <div className="p-3 space-y-4 border-t border-neutral-800">
                        <div className="space-y-2">
                            <label className="text-[10px] text-neutral-500 uppercase tracking-wider">Diffusion</label>
                            <div className="grid grid-cols-2 gap-2">
                                {FILTERS.map(f => (
                                    <button key={f.id} onClick={() => setFilterType(f.id)}
                                        className={`text-[10px] py-1.5 rounded border transition-colors
                                            ${filterType === f.id ? 'bg-white text-black border-white' : 'text-neutral-400 border-neutral-700 hover:border-neutral-500'}`}
                                    >
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {filterType !== 'none' && (
                            <div className="space-y-3 pt-2 border-t border-neutral-800/50">
                                <div>
                                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1"><span>Intensity</span><span>{Math.round(filterStrength*100)}%</span></div>
                                    <input type="range" min="0" max="1" step="0.05" value={filterStrength} onChange={(e) => setFilterStrength(Number(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg accent-white" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1"><span>Radius</span><span>{filterRadius}px</span></div>
                                    <input type="range" min="0" max="100" step="1" value={filterRadius} onChange={(e) => setFilterRadius(Number(e.target.value))} className="w-full h-1 bg-neutral-700 rounded-lg accent-white" />
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <Toggle label="Leak" active={leakEnabled} onClick={() => setLeakEnabled(!leakEnabled)} icon={Sun} />
                            <Toggle label="Shadow" active={shadowEnabled} onClick={() => setShadowEnabled(!shadowEnabled)} icon={Layers} />
                            <Toggle label="Grain" active={textureEnabled} onClick={() => setTextureEnabled(!textureEnabled)} icon={ImageIcon} />
                        </div>
                    </div>
                )}
            </section>

            {/* 5. Imprint */}
            <section>
                <h2 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock size={12} /> Markings
                </h2>
                <div className="grid grid-cols-3 gap-2">
                    <Toggle label="Quartz" active={quartzEnabled} onClick={() => setQuartzEnabled(!quartzEnabled)} icon={Clock} />
                    <Toggle label="Sign" active={signatureEnabled} onClick={() => setSignatureEnabled(!signatureEnabled)} icon={PenTool} />
                    <Toggle label="Palette" active={paletteEnabled} onClick={() => setPaletteEnabled(!paletteEnabled)} icon={Settings2} />
                </div>
            </section>
            
            {/* 6. Data Input (Fixed: Added Lens Input) */}
            <section className="border-t border-neutral-800 pt-4">
                <div className="space-y-2">
                    <input type="text" value={metadata.camera} onChange={(e) => setMetadata({...metadata, camera: e.target.value})}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded py-1.5 px-3 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600" placeholder="Camera Model" />
                    
                    <input type="text" value={metadata.lens} onChange={(e) => setMetadata({...metadata, lens: e.target.value})}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded py-1.5 px-3 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600" placeholder="Lens Info" />

                    <div className="flex gap-2">
                         <input type="text" value={metadata.settings} onChange={(e) => setMetadata({...metadata, settings: e.target.value})}
                            className="w-1/2 bg-neutral-900 border border-neutral-800 rounded py-1.5 px-3 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600" placeholder="ISO / Shutter" />
                         <input type="text" value={metadata.date} onChange={(e) => setMetadata({...metadata, date: e.target.value})}
                            className="w-1/2 bg-neutral-900 border border-neutral-800 rounded py-1.5 px-3 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600" placeholder="Date" />
                    </div>
                    {quartzEnabled && (
                        <input type="text" value={metadata.quartzDate} onChange={(e) => setMetadata({...metadata, quartzDate: e.target.value})}
                            className="w-full bg-neutral-900 border border-orange-900/30 rounded py-1.5 px-3 text-xs text-orange-400 font-mono focus:outline-none focus:border-orange-700" placeholder="Quartz Date" />
                    )}
                </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-800 bg-black shrink-0 flex gap-3">
            <button onClick={handleSingleExport} disabled={!currentImage || isBatchProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 text-neutral-200 font-bold text-xs py-3 rounded hover:bg-neutral-700 disabled:opacity-50 transition-all">
                <Download size={14} /> <span>SAVE</span>
            </button>
            <button onClick={handleBatchExport} disabled={queue.length === 0 || isBatchProcessing}
                className="flex-[2] flex items-center justify-center gap-2 bg-white text-black font-bold text-xs py-3 rounded hover:bg-neutral-200 disabled:opacity-50 transition-all">
                {isBatchProcessing ? <span className="animate-pulse">PROCESSING...</span> : <> <MoreHorizontal size={14} /> <span>BATCH EXPORT ({queue.length})</span> </>}
            </button>
        </div>
      </aside>

      {/* Main Stage */}
      <main className="flex-1 bg-[#0a0a0a] relative flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 max-w-full max-h-full flex flex-col items-center transition-all duration-300">
          {!currentImage && (
            <div className="text-center max-w-md opacity-50">
              <div className="w-16 h-16 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 bg-neutral-900/50"><Upload size={24} /></div>
              <p className="text-neutral-500 text-sm">Load photos to start</p>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          {previewUrl && currentImage && (
            <div className="relative group shadow-2xl shadow-black transition-transform duration-500">
                 <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" style={{ boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6)' }} />
                 <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur px-2 py-1 text-[10px] font-mono text-white rounded">
                    {currentImage.metrics.width} &times; {currentImage.metrics.height}
                 </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}