import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface CropRect {
  x: number; // 0..1 relative to video rect
  y: number; // 0..1 relative to video rect
  width: number; // 0..1 relative to video rect
  height: number; // 0..1 relative to video rect
}

export interface NativeCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InteractiveCanvasOverlayProps {
  containerRect: { width: number; height: number };
  videoNativeDimensions: { width: number; height: number };
  crop: CropRect;
  onChange: (crop: CropRect, nativeCrop: NativeCropRect) => void;
  aspectRatioLock?: number | null; // e.g. 9/16, 1/1, 16/9 or null for free
  showRuleOfThirds?: boolean;
  showCrosshair?: boolean;
  disabled?: boolean;
}

type HandleType =
  | 'move'
  | 'tl' // top-left
  | 'tr' // top-right
  | 'bl' // bottom-left
  | 'br' // bottom-right
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

export const InteractiveCanvasOverlay: React.FC<InteractiveCanvasOverlayProps> = ({
  containerRect,
  videoNativeDimensions,
  crop,
  onChange,
  aspectRatioLock = null,
  showRuleOfThirds = true,
  showCrosshair = true,
  disabled = false,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: CropRect } | null>(null);
  const [isSnappingCenter, setIsSnappingCenter] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  // Calculate actual displayed video rectangle within the container (letterbox fit)
  const getRenderedVideoRect = useCallback(() => {
    const { width: cW, height: cH } = containerRect;
    const { width: vW, height: vH } = videoNativeDimensions;

    if (!cW || !cH || !vW || !vH) {
      return { x: 0, y: 0, width: cW || 1, height: cH || 1 };
    }

    const containerRatio = cW / cH;
    const videoRatio = vW / vH;

    let rW = cW;
    let rH = cH;
    let rX = 0;
    let rY = 0;

    if (videoRatio > containerRatio) {
      // Letterbox top and bottom
      rW = cW;
      rH = cW / videoRatio;
      rY = (cH - rH) / 2;
    } else {
      // Pillarbox left and right
      rH = cH;
      rW = cH * videoRatio;
      rX = (cW - rW) / 2;
    }

    return { x: rX, y: rY, width: rW, height: rH };
  }, [containerRect, videoNativeDimensions]);

  // Convert normalized 0..1 crop to pixel coords in rendered video
  const rendered = getRenderedVideoRect();
  const boxPixelX = rendered.x + crop.x * rendered.width;
  const boxPixelY = rendered.y + crop.y * rendered.height;
  const boxPixelW = crop.width * rendered.width;
  const boxPixelH = crop.height * rendered.height;

  // Convert normalized crop to native video pixels with even-parity clamping
  const computeNativeCrop = useCallback(
    (c: CropRect): NativeCropRect => {
      const vW = videoNativeDimensions.width || 1920;
      const vH = videoNativeDimensions.height || 1080;

      let nX = Math.round(c.x * vW);
      let nY = Math.round(c.y * vH);
      let nW = Math.round(c.width * vW);
      let nH = Math.round(c.height * vH);

      // Parity clamping: Ensure dimensions are even numbers (required by H.264 / libx264)
      if (nW % 2 !== 0) nW -= 1;
      if (nH % 2 !== 0) nH -= 1;
      if (nX % 2 !== 0) nX += 1;
      if (nY % 2 !== 0) nY += 1;

      // Bound clamping
      nW = Math.max(2, Math.min(nW, vW));
      nH = Math.max(2, Math.min(nH, vH));
      nX = Math.max(0, Math.min(nX, vW - nW));
      nY = Math.max(0, Math.min(nY, vH - nH));

      return { x: nX, y: nY, width: nW, height: nH };
    },
    [videoNativeDimensions]
  );

  // Handle pointer down (mouse or touch)
  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop },
    });
  };

  // Pointer move handler
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeHandle || !dragStart || disabled) return;

      const deltaX = (e.clientX - dragStart.x) / rendered.width;
      const deltaY = (e.clientY - dragStart.y) / rendered.height;

      let newX = dragStart.crop.x;
      let newY = dragStart.crop.y;
      let newW = dragStart.crop.width;
      let newH = dragStart.crop.height;

      const minSize = 0.05; // 5% minimum crop box size

      if (activeHandle === 'move') {
        newX = Math.max(0, Math.min(1 - newW, dragStart.crop.x + deltaX));
        newY = Math.max(0, Math.min(1 - newH, dragStart.crop.y + deltaY));

        // Magnetic center snap
        const centerX = newX + newW / 2;
        const centerY = newY + newH / 2;
        const snapThreshold = 0.02;

        let snapX = false;
        let snapY = false;

        if (Math.abs(centerX - 0.5) < snapThreshold) {
          newX = 0.5 - newW / 2;
          snapX = true;
        }
        if (Math.abs(centerY - 0.5) < snapThreshold) {
          newY = 0.5 - newH / 2;
          snapY = true;
        }

        setIsSnappingCenter({ x: snapX, y: snapY });
      } else {
        setIsSnappingCenter({ x: false, y: false });

        // Resize handling
        if (activeHandle.includes('r')) {
          newW = Math.max(minSize, Math.min(1 - dragStart.crop.x, dragStart.crop.width + deltaX));
        }
        if (activeHandle.includes('l')) {
          const maxLeft = dragStart.crop.x + dragStart.crop.width - minSize;
          newX = Math.max(0, Math.min(maxLeft, dragStart.crop.x + deltaX));
          newW = dragStart.crop.width - (newX - dragStart.crop.x);
        }
        if (activeHandle.includes('b')) {
          newH = Math.max(minSize, Math.min(1 - dragStart.crop.y, dragStart.crop.height + deltaY));
        }
        if (activeHandle.includes('t')) {
          const maxTop = dragStart.crop.y + dragStart.crop.height - minSize;
          newY = Math.max(0, Math.min(maxTop, dragStart.crop.y + deltaY));
          newH = dragStart.crop.height - (newY - dragStart.crop.y);
        }

        // Apply aspect ratio lock if active
        if (aspectRatioLock && aspectRatioLock > 0) {
          const videoAspect = videoNativeDimensions.width / videoNativeDimensions.height || 16 / 9;
          // Target pixel aspect ratio normalized to container
          const targetNormalizedRatio = aspectRatioLock / videoAspect;

          if (activeHandle === 'left' || activeHandle === 'right' || activeHandle === 'tl' || activeHandle === 'br') {
            newH = newW / targetNormalizedRatio;
            if (newY + newH > 1) {
              newH = 1 - newY;
              newW = newH * targetNormalizedRatio;
            }
          } else {
            newW = newH * targetNormalizedRatio;
            if (newX + newW > 1) {
              newW = 1 - newX;
              newH = newW / targetNormalizedRatio;
            }
          }
        }
      }

      // Bound clamping
      newX = Math.max(0, Math.min(1 - minSize, newX));
      newY = Math.max(0, Math.min(1 - minSize, newY));
      newW = Math.max(minSize, Math.min(1 - newX, newW));
      newH = Math.max(minSize, Math.min(1 - newY, newH));

      const updatedCrop: CropRect = {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      };

      const nativeCrop = computeNativeCrop(updatedCrop);
      onChange(updatedCrop, nativeCrop);
    },
    [activeHandle, dragStart, disabled, rendered, aspectRatioLock, videoNativeDimensions, computeNativeCrop, onChange]
  );

  // Pointer up handler
  const handlePointerUp = useCallback(() => {
    setActiveHandle(null);
    setDragStart(null);
    setIsSnappingCenter({ x: false, y: false });
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [activeHandle, handlePointerMove, handlePointerUp]);

  const native = computeNativeCrop(crop);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 select-none overflow-hidden touch-none"
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {/* 1. Dark Vignette Mask Outside Crop Box */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="crop-mask">
            {/* White reveal area */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black hole cutout */}
            <rect
              x={boxPixelX}
              y={boxPixelY}
              width={boxPixelW}
              height={boxPixelH}
              fill="black"
            />
          </mask>
        </defs>
        {/* Semi-transparent backdrop with cutout */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#crop-mask)"
        />
      </svg>

      {/* 2. Magnetic Center Guidelines */}
      {isSnappingCenter.x && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none shadow-sm shadow-amber-400"
          style={{ left: rendered.x + rendered.width / 2 }}
        />
      )}
      {isSnappingCenter.y && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-amber-400 pointer-events-none shadow-sm shadow-amber-400"
          style={{ top: rendered.y + rendered.height / 2 }}
        />
      )}

      {/* 3. The Interactive Bounding Crop Box */}
      <div
        style={{
          transform: `translate3d(${boxPixelX}px, ${boxPixelY}px, 0)`,
          width: `${boxPixelW}px`,
          height: `${boxPixelH}px`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        className={`absolute top-0 left-0 border-2 border-brand-400/90 shadow-2xl cursor-move transition-shadow ${
          activeHandle ? 'border-brand-300 ring-2 ring-brand-400/30' : 'hover:border-brand-400'
        }`}
      >
        {/* Rule of Thirds Grid Guidelines */}
        {showRuleOfThirds && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-white/60" />
            <div className="border-r border-white/60" />
            <div />
          </div>
        )}

        {/* Center Crosshair */}
        {showCrosshair && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
            <div className="w-3 h-0.5 bg-white" />
            <div className="h-3 w-0.5 bg-white absolute" />
          </div>
        )}

        {/* Live Coordinate & Aspect Badge */}
        <div className="absolute -top-7 left-0 bg-surface-950/90 backdrop-blur-md border border-brand-500/40 px-2 py-0.5 rounded-md text-[10px] font-mono text-brand-300 font-bold shadow-lg pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
          <span>{native.width}×{native.height}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{(native.width / native.height).toFixed(2)}:1</span>
        </div>

        {/* --- 8 Tactile Touch Handles --- */}
        {/* Top-Left */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'tl')}
          className="absolute -top-2.5 -left-2.5 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-20 group"
        >
          <div className="w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-sm shadow-md group-hover:scale-125 transition-transform" />
        </div>

        {/* Top-Right */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'tr')}
          className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-20 group"
        >
          <div className="w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-sm shadow-md group-hover:scale-125 transition-transform" />
        </div>

        {/* Bottom-Left */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'bl')}
          className="absolute -bottom-2.5 -left-2.5 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-20 group"
        >
          <div className="w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-sm shadow-md group-hover:scale-125 transition-transform" />
        </div>

        {/* Bottom-Right */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'br')}
          className="absolute -bottom-2.5 -right-2.5 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-20 group"
        >
          <div className="w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-sm shadow-md group-hover:scale-125 transition-transform" />
        </div>

        {/* Top Edge Handle */}
        {!aspectRatioLock && (
          <div
            onPointerDown={(e) => handlePointerDown(e, 'top')}
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center cursor-ns-resize z-10"
          >
            <div className="w-5 h-1.5 bg-white border border-brand-500 rounded-full shadow" />
          </div>
        )}

        {/* Bottom Edge Handle */}
        {!aspectRatioLock && (
          <div
            onPointerDown={(e) => handlePointerDown(e, 'bottom')}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center cursor-ns-resize z-10"
          >
            <div className="w-5 h-1.5 bg-white border border-brand-500 rounded-full shadow" />
          </div>
        )}

        {/* Left Edge Handle */}
        {!aspectRatioLock && (
          <div
            onPointerDown={(e) => handlePointerDown(e, 'left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center cursor-ew-resize z-10"
          >
            <div className="w-1.5 h-5 bg-white border border-brand-500 rounded-full shadow" />
          </div>
        )}

        {/* Right Edge Handle */}
        {!aspectRatioLock && (
          <div
            onPointerDown={(e) => handlePointerDown(e, 'right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center cursor-ew-resize z-10"
          >
            <div className="w-1.5 h-5 bg-white border border-brand-500 rounded-full shadow" />
          </div>
        )}
      </div>
    </div>
  );
};
