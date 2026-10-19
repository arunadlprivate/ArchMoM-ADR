import React, { useState, useRef, useEffect } from 'react';
import { Sliders, RefreshCw, Image as ImageIcon, Eye } from 'lucide-react';

interface ImagePreprocessorProps {
  onImageProcessed: (processedBase64: string, filename: string) => void;
  disabled?: boolean;
}

export const ImagePreprocessor: React.FC<ImagePreprocessorProps> = ({ onImageProcessed, disabled }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('whiteboard.jpg');
  const [contrast, setContrast] = useState(150); // percentage
  const [brightness, setBrightness] = useState(110); // percentage
  const [isGrayscale, setIsGrayscale] = useState(true);
  const [threshold, setThreshold] = useState(0); // 0 = off, 1-255 = binarize

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalImage(result);
    };
    reader.readAsDataURL(file);
  };

  const applyFilters = () => {
    if (!originalImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Max dimensions for processing
      const maxDim = 1200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;

      ctx.filter = `contrast(${contrast}%) brightness(${brightness}%) ${isGrayscale ? 'grayscale(100%)' : ''}`;
      ctx.drawImage(img, 0, 0, w, h);

      // Optional manual thresholding
      if (threshold > 0) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const finalVal = v >= threshold ? 255 : 0;
          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const processedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      onImageProcessed(processedBase64, filename);
    };
    img.src = originalImage;
  };

  useEffect(() => {
    if (originalImage) {
      applyFilters();
    }
  }, [originalImage, contrast, brightness, isGrayscale, threshold]);

  const loadSampleWhiteboard = () => {
    // Generate a clean mock handwritten whiteboard canvas
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 800;
    sampleCanvas.height = 500;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return;

    // Whiteboard surface
    sCtx.fillStyle = '#f8fafc';
    sCtx.fillRect(0, 0, 800, 500);

    // Subtle grid lines
    sCtx.strokeStyle = '#e2e8f0';
    sCtx.lineWidth = 1;
    for (let x = 40; x < 800; x += 40) {
      sCtx.beginPath();
      sCtx.moveTo(x, 0);
      sCtx.lineTo(x, 500);
      sCtx.stroke();
    }
    for (let y = 40; y < 500; y += 40) {
      sCtx.beginPath();
      sCtx.moveTo(0, y);
      sCtx.lineTo(800, y);
      sCtx.stroke();
    }

    // Handwritten-style architectural diagram text
    sCtx.fillStyle = '#0f172a';
    sCtx.font = 'bold 22px sans-serif';
    sCtx.fillText('RFC Architecture Sync: Redis vs Memcached', 50, 55);

    // Decision block
    sCtx.strokeStyle = '#2563eb';
    sCtx.lineWidth = 3;
    sCtx.strokeRect(50, 80, 700, 110);
    sCtx.fillStyle = '#1e3a8a';
    sCtx.font = '16px sans-serif';
    sCtx.fillText('Decision: Adopt Redis Cluster for multi-region session persistence', 70, 115);
    sCtx.fillStyle = '#475569';
    sCtx.font = '14px sans-serif';
    sCtx.fillText('- Rejected Memcached: lacked built-in pub/sub and replication without twemproxy', 70, 145);
    sCtx.fillText('- Rejected ALB sticky sessions: breaks Kubernetes horizontal auto-scaling', 70, 170);

    // Action items
    sCtx.strokeStyle = '#dc2626';
    sCtx.lineWidth = 2;
    sCtx.strokeRect(50, 210, 700, 140);
    sCtx.fillStyle = '#991b1b';
    sCtx.font = 'bold 16px sans-serif';
    sCtx.fillText('Action Items (Strict Hygiene):', 70, 240);
    sCtx.fillStyle = '#0f172a';
    sCtx.font = '15px sans-serif';
    sCtx.fillText('1. Provision Redis replication cluster in AWS us-east-1 VPC (Owner: Dave, P0, Due: Tuesday)', 70, 275);
    sCtx.fillText('2. Benchmark redis cluster token lookup under 50,000 req/sec (Owner: Elena, P1, Due: Sprint 43)', 70, 310);

    // Risks
    sCtx.fillStyle = '#b45309';
    sCtx.font = '14px sans-serif';
    sCtx.fillText('Risk / Blocker: Cross-AZ replication failover latency under partition event (Needs chaos test)', 70, 385);

    const dataUrl = sampleCanvas.toDataURL('image/jpeg');
    setOriginalImage(dataUrl);
    setFilename('whiteboard_redis_session_sync.jpg');
  };

  return (
    <div className="space-y-4">
      {/* Upload and Sample Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={disabled}
            className="hidden"
          />
          <div className="flex items-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            Upload Photo (.jpg, .png)
          </div>
        </label>

        <button
          type="button"
          onClick={loadSampleWhiteboard}
          disabled={disabled}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 rounded-md text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load Sample Whiteboard
        </button>
      </div>

      {/* Filter sliders */}
      {originalImage && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Vision Preprocessing (Contrast / Ink Threshold)
            </span>
            <span className="text-xs text-slate-500 font-mono">Qwen2.5-VL Optimized</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Contrast:</span>
                <span className="font-mono">{contrast}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="250"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Binarization Threshold:</span>
                <span className="font-mono">{threshold === 0 ? 'Off' : threshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="220"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 sm:pt-0">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={isGrayscale}
                  onChange={(e) => setIsGrayscale(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                />
                Grayscale ink mode
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center p-2 min-h-[200px]">
        {originalImage ? (
          <div className="w-full flex flex-col items-center">
            <canvas ref={canvasRef} className="max-h-72 object-contain rounded border border-slate-800" />
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Processed Canvas ready for OCR / Multimodal VLM extraction</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No whiteboard or notebook photo loaded</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload a snapshot or click &quot;Load Sample Whiteboard&quot; to test handwriting recognition.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
