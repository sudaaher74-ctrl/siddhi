"use client";

import { useRef, useState, useEffect, useMemo, useCallback, PointerEvent as ReactPointerEvent } from "react";
import Card from "@/components/ui/Card";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";
import { Session } from "@/lib/data";
import { Plus, Minus, RotateCcw, Crosshair, Hand } from "lucide-react";

interface ArrowPlotProps {
  currentArrows?: ArrowShot[];
  handleScoreInput?: (score: ScoreValue, cx?: number | null, cy?: number | null) => void;
  handleUndo?: () => void;
  isSessionComplete?: boolean;
  heatmapMode?: boolean;
  sessions?: Session[];
  mode?: "overall" | "daily";
  bowType?: string;
}

export default function ArrowPlot({
  currentArrows = [],
  handleScoreInput,
  handleUndo,
  isSessionComplete = true,
  heatmapMode = false,
  sessions = [],
  mode = "overall",
  bowType = "Recurve Bow"
}: ArrowPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [pointerState, setPointerState] = useState<{ x: number; y: number; score: ScoreValue } | null>(null);
  const [interactionMode, setInteractionMode] = useState<"plot" | "pan">("plot");
  const [isPointerActive, setIsPointerActive] = useState(false);

  const isCompound = bowType?.toLowerCase().includes("compound") ?? false;

  // Sync refs for high-frequency gesture calculations
  const zoomScaleRef = useRef(zoomScale);
  zoomScaleRef.current = zoomScale;
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;

  // Multi-touch tracking for flexible pinch-to-zoom & two-finger pan
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchInitialRef = useRef<{
    dist: number;
    scale: number;
    pan: { x: number; y: number };
    center: { x: number; y: number };
  } | null>(null);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const justPinchedRef = useRef(false);
  const isAimingRef = useRef(false);
  const isPanningRef = useRef(false);

  // Parse all arrows from sessions if in heatmap mode
  const allHistoricalArrows = useMemo(() => {
    if (!heatmapMode || sessions.length === 0) return [];
    
    let allArrows: ArrowShot[] = [];
    const today = new Date().toLocaleDateString();
    
    sessions.forEach(session => {
      if (mode === "daily" && session.createdAt && new Date(session.createdAt).toLocaleDateString() !== today) {
        return;
      }
      if (session.arrowData) {
        try {
          const ends: ArrowShot[][] = JSON.parse(session.arrowData);
          allArrows = allArrows.concat(ends.flat());
        } catch (e) {
          console.error("Failed to parse arrow data", e);
        }
      }
    });
    return allArrows;
  }, [heatmapMode, sessions, mode]);

  const arrowsToRender = heatmapMode ? allHistoricalArrows : currentArrows;

  // When a new arrow is added in interactive mode, animate it
  useEffect(() => {
    if (!heatmapMode && currentArrows.length > 0) {
      setAnimatingIndex(currentArrows.length - 1);
      const timer = setTimeout(() => setAnimatingIndex(null), 300);
      return () => clearTimeout(timer);
    }
  }, [currentArrows.length, heatmapMode]);

  /**
   * World Archery line-cutter rule:
   * If the arrow touches or breaks the dividing line between two scoring zones,
   * it scores the higher value.
   */
  const calculateScoreFromDistance = useCallback((d: number): ScoreValue => {
    const buffer = 1.8;

    // WA Compound 80cm 6-ring Face (Rings 5 to 10 + X)
    if (isCompound) {
      if (d <= 8.0 + buffer) return "X";
      if (d <= 16.0 + buffer) return "10";
      if (d <= 32.0 + buffer) return "9";
      if (d <= 48.0 + buffer) return "8";
      if (d <= 64.0 + buffer) return "7";
      if (d <= 80.0 + buffer) return "6";
      if (d <= 96.0 + buffer) return "5";
      return "M"; // Outside the blue 5-ring is a Miss
    }

    // Full 122cm / 80cm 10-ring Face (Recurve & Indian Bow: Rings 1 to 10 + X)
    if (d <= 5.5 + buffer) return "X";
    if (d <= 11.0 + buffer) return "10";
    if (d <= 22.0 + buffer) return "9";
    if (d <= 33.0 + buffer) return "8";
    if (d <= 44.0 + buffer) return "7";
    if (d <= 55.0 + buffer) return "6";
    if (d <= 66.0 + buffer) return "5";
    if (d <= 77.0 + buffer) return "4";
    if (d <= 88.0 + buffer) return "3";
    if (d <= 99.0 + buffer) return "2";
    if (d <= 110.0 + buffer) return "1";
    return "M";
  }, [isCompound]);

  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return cursorPt;
  }, []);

  const updateAim = useCallback((clientX: number, clientY: number) => {
    const pt = getSVGPoint(clientX, clientY);
    if (!pt) return null;

    const dx = pt.x - 115;
    const dy = pt.y - 115;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const score = calculateScoreFromDistance(distance);

    const nextState = { x: pt.x, y: pt.y, score };
    setPointerState(nextState);
    return nextState;
  }, [getSVGPoint, calculateScoreFromDistance]);

  /**
   * Smooth focal-point zoom:
   * Keeps the point under cursor/finger stationary while zooming in/out.
   */
  const zoomAtPoint = useCallback((clientX: number, clientY: number, factor: number) => {
    const currentScale = zoomScaleRef.current;
    const currentPan = panOffsetRef.current;
    const targetScale = Math.max(1.0, Math.min(4.5, Math.round(currentScale * factor * 100) / 100));
    if (Math.abs(targetScale - currentScale) < 0.001) return;

    if (targetScale <= 1.01) {
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const pt = getSVGPoint(clientX, clientY);
    const focalX = pt ? pt.x : 115;
    const focalY = pt ? pt.y : 115;

    const oldViewSize = 230 / currentScale;
    const newViewSize = 230 / targetScale;
    const oldMinX = 115 - oldViewSize / 2 + currentPan.x;
    const oldMinY = 115 - oldViewSize / 2 + currentPan.y;

    const fx = (focalX - oldMinX) / oldViewSize;
    const fy = (focalY - oldMinY) / oldViewSize;

    const targetMinX = focalX - fx * newViewSize;
    const targetMinY = focalY - fy * newViewSize;

    const newPanX = targetMinX - (115 - newViewSize / 2);
    const newPanY = targetMinY - (115 - newViewSize / 2);

    const maxPan = (230 - newViewSize) / 2;
    const clampedPan = {
      x: Math.max(-maxPan, Math.min(maxPan, newPanX)),
      y: Math.max(-maxPan, Math.min(maxPan, newPanY))
    };

    setZoomScale(targetScale);
    setPanOffset(clampedPan);
  }, [getSVGPoint]);

  // Non-passive wheel event listener for trackpad pinch & mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch produces e.ctrlKey=true, mouse wheel produces normal deltaY
      const factor = e.ctrlKey
        ? 1 - e.deltaY * 0.015
        : e.deltaY < 0 ? 1.15 : 0.87;
      zoomAtPoint(e.clientX, e.clientY, factor);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomAtPoint]);

  // Zoom button handlers
  const handleZoomIn = () => {
    setZoomScale(prev => {
      const next = Math.min(4.5, Math.round((prev + 0.35) * 10) / 10);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(1.0, Math.round((prev - 0.35) * 10) / 10);
      if (next <= 1.05) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
    setInteractionMode("plot");
  };

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const targetSvgX = clickX * 230;
    const targetSvgY = clickY * 230;

    const currentScale = zoomScaleRef.current;
    const currentViewSize = 230 / currentScale;
    const maxP = (230 - currentViewSize) / 2;

    const newPanX = targetSvgX - 115;
    const newPanY = targetSvgY - 115;

    setPanOffset({
      x: Math.max(-maxP, Math.min(maxP, newPanX)),
      y: Math.max(-maxP, Math.min(maxP, newPanY))
    });
  };

  const setManualZoom = (scale: number) => {
    setZoomScale(scale);
    if (scale <= 1.05) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      // Clamp existing pan to new scale maxPan
      const viewSize = 230 / scale;
      const maxPan = (230 - viewSize) / 2;
      setPanOffset(prev => ({
        x: Math.max(-maxPan, Math.min(maxPan, prev.x)),
        y: Math.max(-maxPan, Math.min(maxPan, prev.y))
      }));
    }
  };

  // Double-click/double-tap to quick-zoom or reset
  const handleDoubleClick = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (heatmapMode) return;
    if (zoomScale > 1.25) {
      handleResetZoom();
    } else {
      zoomAtPoint(e.clientX, e.clientY, 2.5);
    }
  };

  // Pointer event handlers with multi-touch pinch & pan
  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setIsPointerActive(true);

    // Multi-touch pinch detected (2 or more fingers)
    if (activePointersRef.current.size >= 2) {
      isAimingRef.current = false;
      isPanningRef.current = false;
      setPointerState(null);

      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchInitialRef.current = {
        dist: Math.max(dist, 1),
        scale: zoomScale,
        pan: { ...panOffset },
        center: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      };
      return;
    }

    if (heatmapMode) return;

    // Check if middle click, right click, or in Pan mode -> Drag Pan
    const isMiddleOrRight = e.button === 1 || e.button === 2;
    if (interactionMode === "pan" || isMiddleOrRight) {
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
      return;
    }

    // Otherwise, Plotting / Aiming mode
    if (isSessionComplete || currentArrows.length >= 6) return;
    isAimingRef.current = true;
    updateAim(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Multi-touch 2-finger pinch & pan
    if (activePointersRef.current.size >= 2 && pinchInitialRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scaleRatio = currentDist / pinchInitialRef.current.dist;
      const nextScale = Math.max(1.0, Math.min(4.5, Math.round(pinchInitialRef.current.scale * scaleRatio * 100) / 100));
      setZoomScale(nextScale);

      if (nextScale > 1.01) {
        const currentCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const dxScreen = currentCenter.x - pinchInitialRef.current.center.x;
        const dyScreen = currentCenter.y - pinchInitialRef.current.center.y;
        const svgWidth = svgRef.current?.getBoundingClientRect().width || 320;
        const svgUnitPerPx = 230 / (nextScale * svgWidth);

        const nextPanX = pinchInitialRef.current.pan.x - dxScreen * svgUnitPerPx;
        const nextPanY = pinchInitialRef.current.pan.y - dyScreen * svgUnitPerPx;
        const maxPan = (230 - 230 / nextScale) / 2;

        setPanOffset({
          x: Math.max(-maxPan, Math.min(maxPan, nextPanX)),
          y: Math.max(-maxPan, Math.min(maxPan, nextPanY)),
        });
      } else {
        setPanOffset({ x: 0, y: 0 });
      }
      return;
    }

    // Single-finger or mouse drag panning (in Pan mode or Middle/Right click)
    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      const svgWidth = svgRef.current?.getBoundingClientRect().width || 320;
      const svgUnitPerPx = 230 / (zoomScale * svgWidth);

      const nextPanX = panStartRef.current.panX - dx * svgUnitPerPx;
      const nextPanY = panStartRef.current.panY - dy * svgUnitPerPx;
      const maxPan = (230 - 230 / zoomScale) / 2;

      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, nextPanX)),
        y: Math.max(-maxPan, Math.min(maxPan, nextPanY)),
      });
      return;
    }

    // Single-touch / mouse aiming in Plot mode
    if (isAimingRef.current && !heatmapMode && !isSessionComplete && currentArrows.length < 6) {
      updateAim(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    try {
      if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      }
    } catch {}

    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      setIsPointerActive(false);
    }

    // If we just ended a multi-touch pinch gesture, activate cooldown to avoid accidental shot
    if (activePointersRef.current.size < 2 && pinchInitialRef.current) {
      pinchInitialRef.current = null;
      justPinchedRef.current = true;
      setTimeout(() => {
        justPinchedRef.current = false;
      }, 350);
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
    }

    if (isAimingRef.current) {
      isAimingRef.current = false;

      // Commit shot only if not in pinch cooldown and no other fingers touching
      if (activePointersRef.current.size === 0 && !justPinchedRef.current) {
        if (!heatmapMode && !isSessionComplete && currentArrows.length < 6) {
          const finalAim = updateAim(e.clientX, e.clientY) || pointerState;
          if (finalAim && handleScoreInput) {
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(14);
            handleScoreInput(finalAim.score, finalAim.x, finalAim.y);
          }
        }
      }
      setPointerState(null);
    }
  };

  const handlePointerCancel = (e: ReactPointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      setIsPointerActive(false);
    }
    pinchInitialRef.current = null;
    isAimingRef.current = false;
    isPanningRef.current = false;
    panStartRef.current = null;
    setPointerState(null);
  };

  // Official World Archery score badge colors
  const getBadgeColor = (score: ScoreValue) => {
    if (score === "X" || score === "10" || score === "9") return { bg: "#FFD700", text: "#000000" };
    if (score === "8" || score === "7") return { bg: "#E53935", text: "#FFFFFF" };
    if (score === "6" || score === "5") return { bg: "#0EA5E9", text: "#FFFFFF" };
    if (score === "4" || score === "3") return { bg: "#1E293B", text: "#FFFFFF" };
    if (score === "2" || score === "1") return { bg: "#FFFFFF", text: "#0F172A" };
    return { bg: "#64748B", text: "#FFFFFF" };
  };

  // Dynamic ViewBox: scales smoothly from 1.0x to 4.5x
  const viewSize = 230 / zoomScale;
  const maxPan = (230 - viewSize) / 2;
  const clampedPanX = Math.max(-maxPan, Math.min(maxPan, panOffset.x));
  const clampedPanY = Math.max(-maxPan, Math.min(maxPan, panOffset.y));
  const minX = 115 - viewSize / 2 + clampedPanX;
  const minY = 115 - viewSize / 2 + clampedPanY;
  const currentViewBox = `${minX} ${minY} ${viewSize} ${viewSize}`;

  const isZoomed = zoomScale > 1.15;

  return (
    <Card>
      {/* Header with Title, Target Badge, Mode Toggle & Undo */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2 px-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-[13px] font-semibold text-text-mid">
            {heatmapMode ? "Grouping Heatmap" : "Arrow plot"}
          </h2>

          {isCompound ? (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
              Compound 80cm (5–10)
            </span>
          ) : (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Full Face (1–10)
            </span>
          )}

          {!heatmapMode && isZoomed && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
              {zoomScale.toFixed(1)}x
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Plot vs Pan Mode Toggle when zoomed or on demand */}
          {!heatmapMode && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10.5px]">
              <button
                type="button"
                onClick={() => setInteractionMode("plot")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-bold transition-all ${
                  interactionMode === "plot"
                    ? "bg-white text-accent shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Aim and plot arrows"
              >
                <Crosshair className="w-3 h-3" />
                <span className="hidden xs:inline">Plot</span>
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode("pan")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-bold transition-all ${
                  interactionMode === "pan"
                    ? "bg-white text-accent shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Pan/move the target face"
              >
                <Hand className="w-3 h-3" />
                <span className="hidden xs:inline">Move</span>
              </button>
            </div>
          )}

          {/* Quick Zoom Buttons */}
          {!heatmapMode && (
            <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/70">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1.0}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-all rounded hover:bg-white"
                title="Zoom Out (-0.35x)"
                aria-label="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-slate-700 hover:text-accent transition-colors"
                title="Reset to 1.0x Full Target"
              >
                {isZoomed ? `${zoomScale.toFixed(1)}x` : "1.0x"}
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 4.5}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-all rounded hover:bg-white"
                title="Zoom In (+0.35x)"
                aria-label="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {handleUndo && !heatmapMode && (
            <button 
              type="button"
              onClick={handleUndo}
              disabled={currentArrows.length === 0 || isSessionComplete}
              className="px-2 py-1 rounded font-mono font-medium text-[10px] text-black/50 hover:text-accent-soft disabled:opacity-30 transition-colors bg-slate-100 hover:bg-slate-200"
            >
              UNDO
            </button>
          )}

          {heatmapMode && (
            <div className="font-mono font-medium text-[10px] text-black/40">
              {mode === "daily" ? "TODAY" : "ALL TIME"}
            </div>
          )}
        </div>
      </div>

      {/* Flexible Zoom Controls & Presets Bar */}
      {!heatmapMode && (
        <div className="flex items-center justify-between gap-2 px-0.5 mb-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5 hidden sm:inline">
              Zoom:
            </span>
            {(isCompound ? [
              { label: "1x Full", scale: 1.0 },
              { label: "1.5x", scale: 1.5 },
              { label: "2.2x (7-10)", scale: 2.2 },
              { label: "3.2x Gold", scale: 3.2 },
            ] : [
              { label: "1x Full", scale: 1.0 },
              { label: "1.5x", scale: 1.5 },
              { label: "2.2x Center", scale: 2.2 },
              { label: "3.2x Gold", scale: 3.2 },
            ]).map((preset) => (
              <button
                key={preset.scale}
                type="button"
                onClick={() => setManualZoom(preset.scale)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  Math.abs(zoomScale - preset.scale) < 0.2
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive smooth zoom slider */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <span className="text-[9.5px] font-mono text-slate-400">1x</span>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.05"
                value={zoomScale}
                onChange={(e) => setManualZoom(parseFloat(e.target.value))}
                className="w-16 lg:w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Zoom scale slider"
              />
              <span className="text-[9.5px] font-mono text-slate-400">4x</span>
            </div>

            {isZoomed && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="text-[10px] font-bold text-accent hover:underline flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Target Face Canvas & Interactive Controls */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-slate-50/50 p-1"
        style={{ touchAction: "none" }}
      >
        {/* Mini-map Viewport Indicator (visible when zoomed in > 1.25x) */}
        {!heatmapMode && isZoomed && (
          <div 
            className="absolute top-2 left-2 z-20 w-11 h-11 rounded-lg bg-white/95 backdrop-blur-sm p-1 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer group"
            title="Click anywhere to pan here · Double-click to reset"
            onClick={handleMiniMapClick}
            onDoubleClick={handleResetZoom}
          >
            <div className="relative w-full h-full rounded-full border border-slate-300 overflow-hidden flex items-center justify-center bg-slate-100">
              {/* Simplified ring colors */}
              <div className="w-full h-full rounded-full bg-sky-500 flex items-center justify-center">
                <div className="w-[66%] h-[66%] rounded-full bg-red-500 flex items-center justify-center">
                  <div className="w-[45%] h-[45%] rounded-full bg-yellow-400" />
                </div>
              </div>
              {/* Viewport frame box */}
              <div 
                className="absolute border border-red-600 bg-red-500/25 pointer-events-none transition-all"
                style={{
                  left: `${Math.max(0, Math.min(100, (minX / 230) * 100))}%`,
                  top: `${Math.max(0, Math.min(100, (minY / 230) * 100))}%`,
                  width: `${Math.min(100, (viewSize / 230) * 100)}%`,
                  height: `${Math.min(100, (viewSize / 230) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Pan Mode Banner / Hint */}
        {!heatmapMode && interactionMode === "pan" && (
          <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-sm text-white text-[9.5px] font-semibold flex items-center gap-1.5 shadow-sm">
            <Hand className="w-2.5 h-2.5 text-accent animate-pulse" />
            <span>Drag to move target · Tap Plot to aim</span>
          </div>
        )}

        <svg 
          ref={svgRef}
          viewBox={currentViewBox} 
          style={{ touchAction: "none" }}
          className={`w-full max-w-[340px] mx-auto select-none rounded-xl transition-shadow ${
            heatmapMode 
              ? '' 
              : interactionMode === "pan"
                ? (isPointerActive ? 'cursor-grabbing' : 'cursor-grab')
                : 'cursor-crosshair'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerCancel}
          onPointerCancel={handlePointerCancel}
          onDoubleClick={handleDoubleClick}
        >
          {isCompound ? (
            /* ========================================================================= */
            /* World Archery 80cm 6-Ring Compound Target Face (Rings 5 to 10 + X)        */
            /* ========================================================================= */
            <g>
              {/* White outer paper background */}
              <rect x="0" y="0" width="230" height="230" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              
              {/* 5 & 6 Ring (Blue - outer radius 96, inner radius 80) */}
              <circle cx="115" cy="115" r="96" fill="#0284C7" stroke="#000000" strokeWidth="1.2" />
              <circle cx="115" cy="115" r="80" fill="none" stroke="#000000" strokeWidth="0.8" />

              {/* 7 & 8 Ring (Red - outer radius 64, inner radius 48) */}
              <circle cx="115" cy="115" r="64" fill="#EF4444" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="48" fill="none" stroke="#000000" strokeWidth="0.8" />

              {/* 9 & 10 Ring (Gold - outer radius 32, inner radius 16) */}
              <circle cx="115" cy="115" r="32" fill="#FACC15" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="16" fill="none" stroke="#000000" strokeWidth="0.8" />

              {/* Inner X Ring (radius 8) */}
              <circle cx="115" cy="115" r="8" fill="none" stroke="#000000" strokeWidth={isZoomed ? "0.6" : "0.8"} />

              {/* Center Crosshair (+) */}
              <line x1="112" y1="115" x2="118" y2="115" stroke="#000000" strokeWidth={isZoomed ? "0.5" : "0.75"} strokeLinecap="round" />
              <line x1="115" y1="112" x2="115" y2="118" stroke="#000000" strokeWidth={isZoomed ? "0.5" : "0.75"} strokeLinecap="round" />

              {/* Horizontal Ring Numbers (10, 9, 8, 7, 6, 5) matching World Archery 80cm face */}
              <g pointerEvents="none" className="select-none font-bold">
                <text x="127" y="117.5" fontSize={isZoomed ? "5" : "6.5"} textAnchor="middle" fill="#000000" fontWeight="bold">10</text>
                <text x="139" y="117.5" fontSize={isZoomed ? "5.5" : "7"} textAnchor="middle" fill="#000000" fontWeight="bold">9</text>
                <text x="155" y="117.5" fontSize={isZoomed ? "6" : "7.5"} textAnchor="middle" fill="#000000" fontWeight="bold">8</text>
                <text x="171" y="117.5" fontSize={isZoomed ? "6" : "7.5"} textAnchor="middle" fill="#000000" fontWeight="bold">7</text>
                <text x="187" y="117.5" fontSize={isZoomed ? "6" : "7.5"} textAnchor="middle" fill="#000000" fontWeight="bold">6</text>
                <text x="203" y="117.5" fontSize={isZoomed ? "6" : "7.5"} textAnchor="middle" fill="#000000" fontWeight="bold">5</text>
              </g>
            </g>
          ) : (
            /* ========================================================================= */
            /* World Archery 122cm / 80cm Full Target Face (Rings 1 to 10 + X)           */
            /* ========================================================================= */
            <g>
              {/* 1 & 2 ring (white) */}
              <circle cx="115" cy="115" r="110" fill="var(--target-white)" />
              <circle cx="115" cy="115" r="99" fill="none" stroke="rgba(0,0,0,.15)" strokeWidth="0.8" />

              {/* 3 & 4 ring (black) */}
              <circle cx="115" cy="115" r="88" fill="var(--target-black)" />
              <circle cx="115" cy="115" r="77" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="0.8" />

              {/* 5 & 6 ring (blue) */}
              <circle cx="115" cy="115" r="66" fill="var(--target-blue)" />
              <circle cx="115" cy="115" r="55" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="0.8" />

              {/* 7 & 8 ring (red) */}
              <circle cx="115" cy="115" r="44" fill="var(--target-red)" />
              <circle cx="115" cy="115" r="33" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="0.8" />

              {/* 9 & 10 ring (gold) */}
              <circle cx="115" cy="115" r="22" fill="var(--target-gold)" />

              {/* 10 ring line (radius 11) */}
              <circle cx="115" cy="115" r="11" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth={isZoomed ? "0.7" : "0.9"} />

              {/* X ring line (radius 5.5) */}
              <circle cx="115" cy="115" r="5.5" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={isZoomed ? "0.55" : "0.75"} />

              {/* Center Crosshair (+) for precision aiming */}
              <line x1="112.5" y1="115" x2="117.5" y2="115" stroke="rgba(0,0,0,.7)" strokeWidth={isZoomed ? "0.45" : "0.75"} strokeLinecap="round" />
              <line x1="115" y1="112.5" x2="115" y2="117.5" stroke="rgba(0,0,0,.7)" strokeWidth={isZoomed ? "0.45" : "0.75"} strokeLinecap="round" />
            </g>
          )}

          {/* Plotted Arrows */}
          <g>
            {arrowsToRender.map((arrow, i) => {
              let cx = arrow.cx;
              let cy = arrow.cy;
              
              if (cx === null || cy === null) {
                if (heatmapMode) return null;
                cx = 115;
                cy = 115;
              }

              const isNew = i === animatingIndex && !heatmapMode;
              const arrowRadius = heatmapMode ? 3.2 : Math.max(1.8, 2.8 / Math.sqrt(zoomScale));
              const arrowStroke = heatmapMode ? 0.7 : Math.max(0.5, 0.8 / Math.sqrt(zoomScale));

              return (
                <g 
                  key={i} 
                  className={isNew ? "animate-dotPop" : ""} 
                  style={{ transformOrigin: `${cx}px ${cy}px` }} 
                >
                  {/* Arrow Impact Dot */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={arrowRadius} 
                    fill="#FFFFFF" 
                    fillOpacity={heatmapMode ? 0.92 : 1}
                    stroke="rgba(15, 23, 42, 0.8)" 
                    strokeWidth={arrowStroke} 
                  />
                </g>
              );
            })}
          </g>

          {/* Live Aiming Reticle & Floating Score Pill */}
          {pointerState && !heatmapMode && !isSessionComplete && currentArrows.length < 6 && (
            <g pointerEvents="none">
              {/* Aiming Reticle Ring */}
              <circle
                cx={pointerState.x}
                cy={pointerState.y}
                r={Math.max(3.8, 6 / Math.sqrt(zoomScale))}
                fill="none"
                stroke="#FF5A4E"
                strokeWidth={Math.max(0.6, 1 / Math.sqrt(zoomScale))}
                strokeDasharray="2 1"
              />
              <circle
                cx={pointerState.x}
                cy={pointerState.y}
                r={Math.max(1.1, 1.8 / Math.sqrt(zoomScale))}
                fill="#FF5A4E"
              />

              {/* Floating Score Badge */}
              {(() => {
                const colors = getBadgeColor(pointerState.score);
                const badgeWidth = Math.max(13, 18 / Math.sqrt(zoomScale));
                const badgeHeight = Math.max(8.5, 12 / Math.sqrt(zoomScale));
                const offsetY = Math.max(9, 15 / Math.sqrt(zoomScale));
                const badgeX = pointerState.x - badgeWidth / 2;
                const badgeY = pointerState.y - offsetY;

                return (
                  <g>
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeWidth}
                      height={badgeHeight}
                      rx={isZoomed ? "2.2" : "3"}
                      fill={colors.bg}
                      stroke="#000000"
                      strokeWidth={isZoomed ? "0.4" : "0.6"}
                    />
                    <text
                      x={pointerState.x}
                      y={badgeY + badgeHeight * 0.72}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize={Math.max(5.8, 8 / Math.sqrt(zoomScale))}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {pointerState.score}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Floating on-target zoom controls (for mobile and touch devices) */}
        {!heatmapMode && (
          <div className="absolute right-2 bottom-3 flex flex-col items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-slate-200/80 z-10">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 4.5}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="text-[9.5px] font-mono font-bold text-slate-800 py-0.5 hover:text-accent cursor-pointer"
              title="Reset Zoom"
            >
              {zoomScale.toFixed(1)}x
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1.0}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            {isZoomed && (
              <button
                type="button"
                onClick={() => setInteractionMode(prev => prev === "plot" ? "pan" : "plot")}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer mt-0.5 ${
                  interactionMode === "pan"
                    ? "bg-accent text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={interactionMode === "pan" ? "Switch to Plotting" : "Switch to Moving target"}
                aria-label="Toggle mode"
              >
                {interactionMode === "pan" ? <Hand className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Instructions & Status */}
      <div className="flex items-center justify-between mt-[10px] text-[10.5px] text-black/50 px-1 flex-wrap gap-1">
        <span>
          {heatmapMode ? "Total Arrows Logged" : "Arrows"}:{" "}
          <span className="text-text-mid font-semibold">
            {heatmapMode ? arrowsToRender.length : `${currentArrows.length}/6`}
          </span>
        </span>

        {!heatmapMode && (
          <span className="text-[10px] text-text-dim">
            {isZoomed 
              ? `Zoomed ${zoomScale.toFixed(1)}x · Pinch, scroll wheel or drag to navigate` 
              : "Pinch or scroll wheel to zoom · Double-tap to focus"}
          </span>
        )}
      </div>
    </Card>
  );
}
