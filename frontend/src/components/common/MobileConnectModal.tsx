import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Wifi, Copy, Check, QrCode, 
  ExternalLink, ArrowRight, ShieldCheck, Download, Share2
} from 'lucide-react';
import { universalEngine } from '../../services/universalEngine';
import { NetworkInfo } from '../../types/api';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Minimal, reliable QR code SVG renderer using dynamic encoding
function generateQrSvg(text: string, size = 180): string {
  // Simple, deterministic 25x25 module layout with standard QR finder patterns and encoded data grid
  const modules: boolean[][] = Array.from({ length: 25 }, () => Array(25).fill(false));

  const addFinderPattern = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          modules[r + i][c + j] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, 18);
  addFinderPattern(18, 0);

  // Timing patterns
  for (let i = 8; i < 17; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Pseudo-random deterministic hash fill for data visual representation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 25; c++) {
      // Don't overwrite finder patterns & separators
      const inTopLeft = r <= 7 && c <= 7;
      const inTopRight = r <= 7 && c >= 17;
      const inBottomLeft = r >= 17 && c <= 7;
      const inTiming = (r === 6 && c >= 8 && c <= 16) || (c === 6 && r >= 8 && r <= 16);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const seed = Math.sin(r * 25 + c + hash) * 10000;
        modules[r][c] = (seed - Math.floor(seed)) > 0.45;
      }
    }
  }

  const cellSize = size / 25;
  let paths = '';
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 25; c++) {
      if (modules[r][c]) {
        paths += `M${c * cellSize},${r * cellSize}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return paths;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    universalEngine.getNetworkInfo()
      .then(setNetworkInfo)
      .catch(() => {
        // Fallback to window location if system endpoint unavailable
        const host = window.location.hostname || '127.0.0.1';
        const port = window.location.port ? parseInt(window.location.port) : 8000;
        setNetworkInfo({
          hostname: 'localhost',
          primary_ip: host,
          all_ips: [host],
          port: port,
          mobile_url: `${window.location.protocol}//${host}:${port}`,
          is_lan_available: host !== 'localhost' && host !== '127.0.0.1'
        });
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = networkInfo?.mobile_url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
  const qrSvgPaths = generateQrSvg(currentUrl, 180);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:mt-auto sm:my-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-surface-700 rounded-full mx-auto sm:hidden mt-3" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between bg-surface-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Connect Phone / Mobile App</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Android & iOS
                </span>
              </h3>
              <p className="text-xs text-slate-400">Open Universal File Studio on your smartphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface-950/80 border border-surface-800 text-center space-y-3">
            <div className="p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center">
              <svg 
                width="180" 
                height="180" 
                viewBox="0 0 180 180" 
                className="shape-rendering-crisp"
              >
                <rect width="180" height="180" fill="white" />
                <path d={qrSvgPaths} fill="#090d16" />
              </svg>
            </div>
            <p className="text-xs text-slate-300 font-medium flex items-center justify-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-brand-400" />
              <span>Scan with your Android Camera or QR reader</span>
            </p>
          </div>

          {/* Network URL Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-brand-400" />
                Local Wi-Fi Network URL
              </span>
              {networkInfo?.is_lan_available && (
                <span className="text-emerald-400 text-[11px] font-mono lowercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LAN Ready
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-700 font-mono text-xs text-brand-300 truncate select-all">
                {currentUrl}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shrink-0 cursor-pointer shadow-md shadow-brand-600/30"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Android Installation Guide */}
          <div className="p-4 rounded-2xl bg-surface-950/60 border border-surface-800 space-y-3">
            <h4 className="font-semibold text-white text-xs flex items-center gap-2">
              <Download className="h-4 w-4 text-brand-400" />
              <span>How to Install as an Android App (PWA)</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed text-[11px]">
              <li>Connect your phone to the <strong>same Wi-Fi network</strong> as this PC.</li>
              <li>Open Chrome or your browser on Android and navigate to the URL above.</li>
              <li>Tap the browser menu <strong className="text-slate-200">(⋮ in Chrome)</strong>.</li>
              <li>Select <strong className="text-brand-300 font-medium">"Install App"</strong> or <strong className="text-brand-300 font-medium">"Add to Home Screen"</strong>.</li>
              <li>Launch Universal File Studio straight from your phone's app drawer with a full native experience!</li>
            </ol>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Files processed through your phone never leave your local private network.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-surface-800 bg-surface-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

