import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  Trash2, 
  Link as LinkIcon, 
  Sparkles, 
  AlertCircle,
  Building2,
  Crop,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { FarmBrandLogo } from '../common/FarmBrandLogo';

interface CompanyLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl?: string;
  farmName: string;
  onSaveLogo: (logoUrl: string) => void;
}

// 4 High-fidelity, self-contained SVG presets that load instantly with ZERO external network/CORS dependency
const PRESET_LOGOS = [
  {
    id: 'cobb-ross',
    name: 'PS Breeder Crest',
    description: 'Parent Stock Breeder Operations',
    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg_cr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="gold_cr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="92" fill="url(#bg_cr)" stroke="url(#gold_cr)" stroke-width="5"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="url(#gold_cr)" stroke-width="1.5" stroke-dasharray="3 2"/>
  <path d="M72 120 C72 95, 92 75, 115 75 C125 75, 135 80, 140 90 C135 90, 125 95, 120 105 C115 115, 105 125, 90 125 Z" fill="url(#gold_cr)"/>
  <circle cx="118" cy="85" r="3.5" fill="#022c22"/>
  <path d="M125 82 L138 84 L127 90 Z" fill="#f59e0b"/>
  <path d="M105 70 C108 65, 115 62, 118 68 C122 62, 130 65, 128 72 Z" fill="#ef4444"/>
  <text x="100" y="152" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="url(#gold_cr)" text-anchor="middle" letter-spacing="1">PARENT STOCK</text>
  <text x="100" y="166" font-family="Arial, sans-serif" font-size="7.5" font-weight="700" fill="#a7f3d0" text-anchor="middle" letter-spacing="1.5">BREEDER CREST</text>
</svg>`)
  },
  {
    id: 'poultry-shield',
    name: 'Biosecure Shield',
    description: 'Biosecure Poultry Facility',
    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="shield_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#134e4a"/>
    </linearGradient>
    <linearGradient id="gold_sh" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3"/>
      <stop offset="60%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <path d="M100 16 L175 48 C175 125, 138 168, 100 188 C62 168, 25 125, 25 48 Z" fill="url(#shield_bg)" stroke="url(#gold_sh)" stroke-width="5"/>
  <path d="M100 28 L162 55 C162 120, 130 156, 100 173 C70 156, 38 120, 38 55 Z" fill="none" stroke="url(#gold_sh)" stroke-width="1.5" stroke-dasharray="4 2"/>
  <path d="M85 98 L96 109 L122 83" fill="none" stroke="url(#gold_sh)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="100" y="142" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">BIOSECURITY</text>
  <text x="100" y="156" font-family="Arial, sans-serif" font-size="7.5" font-weight="700" fill="#6ee7b7" text-anchor="middle" letter-spacing="1.5">VERIFIED ISO</text>
</svg>`)
  },
  {
    id: 'gold-egg',
    name: 'Hatchery Seal',
    description: 'Hatching Egg Production',
    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="egg_grad" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="ring_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="92" fill="url(#ring_grad)" stroke="#f59e0b" stroke-width="5"/>
  <ellipse cx="100" cy="95" rx="36" ry="46" fill="url(#egg_grad)" stroke="#ffffff" stroke-width="2"/>
  <path d="M60 100 C55 125, 75 145, 100 148 C125 145, 145 125, 140 100" fill="none" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
  <text x="100" y="166" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#fef08a" text-anchor="middle" letter-spacing="1.5">HATCHING EGGS</text>
</svg>`)
  },
  {
    id: 'pasture-green',
    name: 'Agro Complex',
    description: 'Poultry Agro Industrial Complex',
    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="green_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#052e16"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="92" fill="url(#green_bg)" stroke="#34d399" stroke-width="5"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="#6ee7b7" stroke-width="1.5"/>
  <rect x="70" y="70" width="60" height="60" rx="14" fill="#052e16" stroke="#34d399" stroke-width="3"/>
  <text x="100" y="108" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#34d399" text-anchor="middle">LP</text>
  <text x="100" y="155" font-family="Arial, sans-serif" font-size="9" font-weight="800" fill="#a7f3d0" text-anchor="middle" letter-spacing="1">AGRO-COMPLEX</text>
</svg>`)
  }
];

/**
 * Trims excess transparent or white padding from an image and centers the emblem on a high-DPI square canvas
 */
const trimAndCenterLogo = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0);
        const { width, height } = canvas;
        const imgData = ctx.getImageData(0, 0, width, height);
        const { data } = imgData;

        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;
        let found = false;

        // Scan for visible content (alpha > 15 and not purely transparent white)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const alpha = data[i + 3];
            if (alpha > 15) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // Non-transparent and not 100% flat background
              if (alpha < 240 || r < 245 || g < 245 || b < 245) {
                found = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        if (!found || (maxX - minX < 8 && maxY - minY < 8)) {
          return resolve(dataUrl);
        }

        // Add 6% comfortable padding around the actual logo bounding box
        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;
        const padX = Math.max(8, Math.round(contentW * 0.06));
        const padY = Math.max(8, Math.round(contentH * 0.06));

        const cropX = Math.max(0, minX - padX);
        const cropY = Math.max(0, minY - padY);
        const cropW = Math.min(width - cropX, contentW + padX * 2);
        const cropH = Math.min(height - cropY, contentH + padY * 2);

        // Normalize to a square canvas of at least 320x320 for sharp thumbnail downsampling
        const targetDim = Math.min(1024, Math.max(cropW, cropH, 320));
        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetDim;
        outCanvas.height = targetDim;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) return resolve(dataUrl);

        // Calculate aspect-ratio preserving dimensions to fit inside the square canvas
        const scale = (targetDim * 0.92) / Math.max(cropW, cropH);
        const drawW = Math.round(cropW * scale);
        const drawH = Math.round(cropH * scale);
        const drawX = Math.round((targetDim - drawW) / 2);
        const drawY = Math.round((targetDim - drawH) / 2);

        outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, drawX, drawY, drawW, drawH);
        resolve(outCanvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const CompanyLogoUploadModal: React.FC<CompanyLogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl = '',
  farmName,
  onSaveLogo
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [selectedLogo, setSelectedLogo] = useState<string>(currentLogoUrl);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDarkBg, setPreviewDarkBg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; trimmed?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize local selection whenever the modal opens or currentLogoUrl updates
  useEffect(() => {
    if (isOpen) {
      setSelectedLogo(currentLogoUrl || '');
      setErrorMessage(null);
      setFileDetails(null);
      setUrlInput('');
    }
  }, [isOpen, currentLogoUrl]);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP, or SVG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 8MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          // Automatically trim excess transparent whitespace borders
          const trimmed = await trimAndCenterLogo(reader.result);
          setSelectedLogo(trimmed);
          setFileDetails({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            trimmed: true
          });
        } catch {
          setSelectedLogo(reader.result);
          setFileDetails({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`
          });
        } finally {
          setIsProcessing(false);
        }
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMessage('Failed to read the image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleApplyUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const trimmed = await trimAndCenterLogo(url);
      setSelectedLogo(trimmed);
      setFileDetails({ name: 'Web-linked Image', size: 'Remote URL', trimmed: true });
    } catch {
      setSelectedLogo(url);
      setFileDetails(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoTrimCurrent = async () => {
    if (!selectedLogo) return;
    setIsProcessing(true);
    try {
      const trimmed = await trimAndCenterLogo(selectedLogo);
      setSelectedLogo(trimmed);
      setFileDetails(prev => ({
        name: prev?.name || 'Enhanced Logo',
        size: prev?.size || 'Auto-Optimized',
        trimmed: true
      }));
    } catch (err: any) {
      setErrorMessage('Failed to auto-trim image margins.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onSaveLogo(selectedLogo);
    onClose();
  };

  const handleRemove = () => {
    setSelectedLogo('');
    setFileDetails(null);
    onSaveLogo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-forest-950 text-white flex items-center justify-between border-b border-forest-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint-400 text-forest-950 flex items-center justify-center font-black shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Upload Company Logo</h3>
              <p className="text-xs text-mint-400/90 font-medium">Farm Identity & Branding for {farmName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-forest-300 hover:text-white hover:bg-forest-900 rounded-xl transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Method Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-mint-600" />
              <span>Official Emblems</span>
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Upload File with Drag and Drop */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[150px] ${
                  isDragging
                    ? 'border-mint-500 bg-mint-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-mint-500 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white text-forest-900 border border-slate-200 shadow-xs flex items-center justify-center mb-2.5">
                  <Upload className="w-6 h-6 text-forest-900" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {isProcessing ? 'Optimizing & Centering Image...' : 'Click to select or drag & drop company logo'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PNG, JPG, SVG or WEBP &bull; Auto-trims transparent empty margins
                </p>
              </div>

              {fileDetails && (
                <div className="p-3 bg-mint-50/70 border border-mint-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-forest-800 shrink-0" />
                    <span className="font-semibold text-forest-950 truncate">{fileDetails.name}</span>
                    <span className="text-forest-700 text-[11px] font-mono">({fileDetails.size})</span>
                  </div>
                  <span className="text-forest-700 font-bold flex items-center gap-1 shrink-0 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> {fileDetails.trimmed ? 'Auto-Trimmed & Centered' : 'Ready'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Web-Hosted Logo Image Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/farm-logo.png"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 bg-forest-950 hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? 'Loading...' : 'Load & Fit'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Ensure the link is HTTPS and publicly accessible without CORS restrictions.
              </p>
            </form>
          )}

          {/* Tab 3: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Choose a pre-configured, vector-crisp poultry breeding emblem (100% reliable offline):
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedLogo(preset.url);
                      setFileDetails({ name: preset.name, size: 'SVG Vector' });
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      selectedLogo === preset.url
                        ? 'border-mint-500 bg-mint-50/60 ring-2 ring-mint-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200 shrink-0 bg-white p-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{preset.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview Display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Multi-Scale Live Preview
              </span>
              <div className="flex items-center gap-2">
                {selectedLogo && (
                  <button
                    type="button"
                    onClick={handleAutoTrimCurrent}
                    disabled={isProcessing}
                    title="Automatically crop transparent borders and center the emblem"
                    className="text-xs text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-mint-600" />
                    <span>Auto-Trim & Fit</span>
                  </button>
                )}
                {selectedLogo && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLogo('');
                      setFileDetails(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              previewDarkBg ? 'bg-forest-950 border-forest-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Application Viewport Simulation
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDarkBg(!previewDarkBg)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {previewDarkBg ? (
                    <><Sun className="w-3 h-3 text-amber-400" /> Light Background</>
                  ) : (
                    <><Moon className="w-3 h-3 text-indigo-500" /> Dark Sidebar Mode</>
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* 1. Header Scale (64px) */}
                <div className="flex flex-col items-center gap-1.5">
                  <FarmBrandLogo
                    logoUrl={selectedLogo}
                    alt="Header Preview"
                    size="xl"
                    variant="card"
                    fallbackText="LP"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Header (64px)</span>
                </div>

                {/* 2. Sidebar Scale (40px) */}
                <div className="flex flex-col items-center gap-1.5">
                  <FarmBrandLogo
                    logoUrl={selectedLogo}
                    alt="Sidebar Preview"
                    size="md"
                    variant="sidebar"
                    fallbackText="FF"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Sidebar (40px)</span>
                </div>

                {/* 3. Brand Text Identity Preview */}
                <div className="min-w-0 text-center sm:text-left flex-1 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-2 sm:pt-0 sm:pl-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Farm Display</p>
                  <p className="text-sm font-bold truncate">{farmName}</p>
                  <p className="text-[11px] text-mint-600 font-medium">
                    {selectedLogo ? 'Custom Logo Active & Responsive' : 'Using Default Emblem Monogram'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {currentLogoUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Current Logo</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
