import React, { useState, useEffect } from 'react';
import { 
  X, Download, ExternalLink, Share2, ZoomIn, ZoomOut, RotateCw, 
  Volume2, Play, Pause, FileText, Image as ImageIcon, Film, Music, 
  Copy, Check, Sparkles, FileCode, Maximize2
} from 'lucide-react';
import { universalEngine } from '../../services/universalEngine';
import { formatBytes } from '../../utils/format';

export interface MediaViewerTarget {
  id?: string | number;
  filename: string;
  blob?: Blob;
  mimeType?: string;
  sizeBytes?: number;
  isJobOutput?: boolean;
}

interface MediaViewerModalProps {
  target: MediaViewerTarget | null;
  onClose: () => void;
  onSave?: (target: MediaViewerTarget) => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  target,
  onClose,
  onSave,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  useEffect(() => {
    if (!target) {
      setObjectUrl(null);
      setTextContent(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;
    setIsLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);
    setTextContent(null);

    const loadTargetBlob = async () => {
      try {
        let blob = target.blob;
        if (!blob && target.id !== undefined) {
          if (target.isJobOutput) {
            blob = (await universalEngine.getJobOutputBlob(String(target.id))) || undefined;
          } else {
            blob = (await universalEngine.getFileBlob(Number(target.id))) || undefined;
          }
        }

        if (!blob) {
          throw new Error('Unable to retrieve file binary content for preview.');
        }

        if (!isMounted) return;

        const url = URL.createObjectURL(blob);
        createdUrl = url;
        setObjectUrl(url);

        const lowerName = target.filename.toLowerCase();
        const mime = (target.mimeType || blob.type || '').toLowerCase();
        const isTextLike = 
          mime.startsWith('text/') || 
          mime.includes('json') || 
          mime.includes('xml') || 
          mime.includes('javascript') || 
          mime.includes('typescript') ||
          lowerName.endsWith('.txt') || 
          lowerName.endsWith('.md') || 
          lowerName.endsWith('.csv') || 
          lowerName.endsWith('.json') || 
          lowerName.endsWith('.xml') || 
          lowerName.endsWith('.log') || 
          lowerName.endsWith('.js') || 
          lowerName.endsWith('.ts') || 
          lowerName.endsWith('.py');

        if (isTextLike && blob.size < 2 * 1024 * 1024) {
          const text = await blob.text();
          if (isMounted) {
            setTextContent(text);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to render preview.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTargetBlob();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [target]);

  if (!target) return null;

  const lowerName = target.filename.toLowerCase();
  const mime = (target.mimeType || target.blob?.type || '').toLowerCase();

  const isImage = 
    mime.startsWith('image/') || 
    /\.(png|jpe?g|webp|gif|svg|bmp|ico|tiff?)$/i.test(lowerName);

  const isAudio = 
    mime.startsWith('audio/') || 
    /\.(mp3|wav|m4a|aac|ogg|opus|flac|wma)$/i.test(lowerName);

  const isVideo = 
    mime.startsWith('video/') || 
    /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(lowerName);

  const isPdf = 
    mime === 'application/pdf' || 
    lowerName.endsWith('.pdf');

  const isText = Boolean(textContent !== null);

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleOpenSystem = async () => {
    try {
      if (target.id !== undefined) {
        await universalEngine.openFile(String(target.id), target.blob, target.filename);
      } else if (target.blob) {
        await universalEngine.openFile(target.filename, target.blob, target.filename);
      }
    } catch (err) {
      console.warn('System open failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      if (target.id !== undefined) {
        await universalEngine.shareFile(String(target.id), `Share ${target.filename}`, target.blob);
      } else if (target.blob) {
        await universalEngine.shareFile(target.filename, `Share ${target.filename}`, target.blob);
      }
    } catch (err) {
      console.warn('System share failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in safe-top safe-bottom">
      <div className="bg-surface-900 border border-surface-750/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-surface-800/80 bg-surface-950/60 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden pr-2">
            <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              {isImage && <ImageIcon className="h-4 w-4" />}
              {isAudio && <Music className="h-4 w-4" />}
              {isVideo && <Film className="h-4 w-4" />}
              {isPdf && <FileText className="h-4 w-4 text-rose-400" />}
              {isText && <FileCode className="h-4 w-4 text-emerald-400" />}
              {!isImage && !isAudio && !isVideo && !isPdf && !isText && <FileText className="h-4 w-4" />}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm sm:text-base font-bold text-white truncate" title={target.filename}>
                {target.filename}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {target.sizeBytes !== undefined && <span>{formatBytes(target.sizeBytes)}</span>}
                {target.mimeType && (
                  <>
                    <span>•</span>
                    <span className="font-mono truncate max-w-[150px]">{target.mimeType}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(target)}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/30 btn-press"
                title="Save to Public Downloads"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenSystem}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-surface-800 hover:bg-surface-750 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors border border-surface-700 btn-press"
              title="Open with system application"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">System App</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-surface-800 hover:bg-surface-750 text-slate-200 hover:text-white transition-colors border border-surface-700 btn-press"
              title="Share via Sheet"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors border border-surface-700 btn-press"
              title="Close Preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-surface-950/80 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-3 py-12">
              <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading media preview...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 max-w-md">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Preview Unavailable</h4>
              <p className="text-xs text-slate-400 mb-4">{error}</p>
              <button
                type="button"
                onClick={handleOpenSystem}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Default Device App</span>
              </button>
            </div>
          ) : isImage && objectUrl ? (
            <div className="flex flex-col items-center justify-center w-full h-full space-y-3">
              <div className="relative overflow-hidden rounded-xl max-w-full max-h-[60vh] flex items-center justify-center">
                <img
                  src={objectUrl}
                  alt={target.filename}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Image Controls */}
              <div className="flex items-center gap-2 bg-surface-900/90 border border-surface-750 px-3 py-1.5 rounded-xl shadow-lg">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-800 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 min-w-[45px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-800 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-surface-750 mx-1" />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-800 transition-colors"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setZoom(1); setRotation(0); }}
                  className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 px-1.5 py-1"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : isVideo && objectUrl ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <video
                controls
                playsInline
                className="max-h-[60vh] max-w-full rounded-xl shadow-2xl border border-surface-800 bg-black"
                src={objectUrl}
                ref={(el) => {
                  if (el) el.playbackRate = playbackRate;
                }}
              >
                Your browser does not support HTML5 video preview.
              </video>
              <div className="flex items-center gap-2 bg-surface-900 border border-surface-800 px-3 py-1 rounded-xl text-xs text-slate-300">
                <span className="text-[11px] text-slate-400">Speed:</span>
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded-lg font-mono text-[11px] transition-colors ${
                      playbackRate === rate ? 'bg-brand-600 text-white font-bold' : 'hover:bg-surface-800 text-slate-400'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          ) : isAudio && objectUrl ? (
            <div className="w-full max-w-lg bg-surface-900 border border-surface-750 p-6 rounded-2xl shadow-xl flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center animate-pulse">
                <Music className="h-8 w-8" />
              </div>
              <div className="text-center w-full">
                <h4 className="text-base font-bold text-white truncate">{target.filename}</h4>
                <p className="text-xs text-slate-400 mt-0.5">High-Fidelity Offline Audio Playback</p>
              </div>
              <audio controls className="w-full mt-2" src={objectUrl}>
                Your browser does not support audio preview.
              </audio>
            </div>
          ) : isPdf && objectUrl ? (
            <div className="w-full h-[65vh] flex flex-col rounded-xl overflow-hidden border border-surface-750 bg-surface-900">
              <iframe
                src={objectUrl}
                title={target.filename}
                className="w-full h-full border-none rounded-xl"
              />
            </div>
          ) : isText && textContent !== null ? (
            <div className="w-full h-[62vh] flex flex-col rounded-xl overflow-hidden border border-surface-750 bg-surface-900/90 shadow-inner">
              <div className="flex items-center justify-between px-3 py-2 bg-surface-950/80 border-b border-surface-800 text-xs text-slate-400">
                <span className="font-mono text-[11px]">{textContent.split('\n').length} lines • {textContent.length.toLocaleString()} characters</span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-750 text-slate-300 hover:text-white transition-colors text-[11px] btn-press"
                >
                  {copiedText ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="flex-1 p-4 font-mono text-xs text-slate-200 overflow-auto whitespace-pre-wrap select-text leading-relaxed">
                {textContent}
              </pre>
            </div>
          ) : (
            <div className="text-center p-8 max-w-md bg-surface-900/60 border border-surface-800 rounded-2xl">
              <div className="h-16 w-16 rounded-2xl bg-surface-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">{target.filename}</h4>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                This format ({target.mimeType || 'binary'}) does not have an inline browser preview. You can open it directly with your device's installed application or save it to your downloads.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenSystem}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 btn-press shadow-md shadow-brand-600/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open with Device App</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Info */}
        <div className="px-4 sm:px-6 py-2.5 bg-surface-950/90 border-t border-surface-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-brand-400" />
            <span>Universal Offline Media Studio</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Esc to close
          </button>
        </div>
      </div>
    </div>
  );
};
