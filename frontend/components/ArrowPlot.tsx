"use client";

import { useRef, useState, useEffect, useMemo, PointerEvent as ReactPointerEvent } from "react";
import Card from "@/components/ui/Card";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";
import { Session } from "@/lib/data";
import { Plus, Minus, RotateCcw } from "lucide-react";

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
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [pointerState, setPointerState] = useState<{ x: number; y: number; score: ScoreValue } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isCompound = bowType?.toLowerCase().includes("compound") ?? false;

  // Multi-touch tracking for pinch-to-zoom on mobile
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchInitialDistRef = useRef<number | null>(null);
  const pinchInitialScaleRef = useRef<number>(1.0);
  const pinchInitialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchInitialCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
  const calculateScoreFromDistance = (d: number): ScoreValue => {
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
  };

  const getSVGPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return cursorPt;
  };

  const updateAim = (clientX: number, clientY: number) => {
    const pt = getSVGPoint(clientX, clientY);
    if (!pt) return null;

    const dx = pt.x - 115;
    const dy = pt.y - 115;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const score = calculateScoreFromDistance(distance);

    const nextState = { x: pt.x, y: pt.y, score };
    setPointerState(nextState);
    return nextState;
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomScale(prev => {
      const next = Math.min(3.5, Math.round((prev + 0.5) * 10) / 10);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(1.0, Math.round((prev - 0.5) * 10) / 10);
      if (next <= 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const setManualZoom = (scale: number) => {
    setZoomScale(scale);
    if (scale <= 1.0) setPanOffset({ x: 0, y: 0 });
  };

  // Pointer event handlers with multi-touch pinch-to-zoom support
  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch detected (2 or more fingers)
    if (activePointersRef.current.size >= 2) {
      setIsDragging(false);
      setPointerState(null);

      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchInitialDistRef.current = dist;
      pinchInitialScaleRef.current = zoomScale;
      pinchInitialPanRef.current = { ...panOffset };
      pinchInitialCenterRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      return;
    }

    if (heatmapMode) return;
    if (isSessionComplete || currentArrows.length >= 6) return;
    setIsDragging(true);
    updateAim(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch gesture
    if (activePointersRef.current.size >= 2 && pinchInitialDistRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scaleFactor = currentDist / pinchInitialDistRef.current;
      const newScale = Math.max(1.0, Math.min(3.5, Math.round(pinchInitialScaleRef.current * scaleFactor * 20) / 20));
      setZoomScale(newScale);

      if (newScale > 1.0) {
        const currentCenterX = (pts[0].x + pts[1].x) / 2;
        const currentCenterY = (pts[0].y + pts[1].y) / 2;
        const deltaX = (currentCenterX - pinchInitialCenterRef.current.x) * (230 / (320 * newScale));
        const deltaY = (currentCenterY - pinchInitialCenterRef.current.y) * (230 / (320 * newScale));

        const maxPan = (230 - 230 / newScale) / 2;
        setPanOffset({
          x: Math.max(-maxPan, Math.min(maxPan, pinchInitialPanRef.current.x - deltaX)),
          y: Math.max(-maxPan, Math.min(maxPan, pinchInitialPanRef.current.y - deltaY)),
        });
      } else {
        setPanOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (heatmapMode) return;
    if (isSessionComplete || currentArrows.length >= 6) return;
    if (isDragging) {
      updateAim(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchInitialDistRef.current = null;
    }

    // Commit shot if single-touch aiming was active
    if (isDragging && activePointersRef.current.size === 0) {
      if (!heatmapMode && !isSessionComplete && currentArrows.length < 6) {
        const finalAim = updateAim(e.clientX, e.clientY) || pointerState;
        if (finalAim && handleScoreInput) {
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(14);
          handleScoreInput(finalAim.score, finalAim.x, finalAim.y);
        }
      }
      setIsDragging(false);
      setPointerState(null);
    }
  };

  const handlePointerLeave = (e: ReactPointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchInitialDistRef.current = null;
    }
    if (!isDragging || activePointersRef.current.size === 0) {
      setPointerState(null);
      setIsDragging(false);
    }
  };

  const handlePointerCancel = (e: ReactPointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(e.pointerId);
    pinchInitialDistRef.current = null;
    setIsDragging(false);
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

  // Dynamic ViewBox: scales smoothly from 1.0x to 3.5x
  const viewSize = 230 / zoomScale;
  const maxPan = (230 - viewSize) / 2;
  const clampedPanX = Math.max(-maxPan, Math.min(maxPan, panOffset.x));
  const clampedPanY = Math.max(-maxPan, Math.min(maxPan, panOffset.y));
  const minX = 115 - viewSize / 2 + clampedPanX;
  const minY = 115 - viewSize / 2 + clampedPanY;
  const currentViewBox = `${minX} ${minY} ${viewSize} ${viewSize}`;

  const isZoomed = zoomScale > 1.25;

  return (
    <Card>
      {/* Header with Title, Target Badge, Zoom Controls & Undo */}
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

          {!heatmapMode && zoomScale > 1.05 && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
              {zoomScale.toFixed(1)}x
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!heatmapMode && (
            <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/70">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1.0}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-all rounded hover:bg-white"
                title="Zoom Out (-0.5x)"
                aria-label="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-[10.5px] font-mono font-bold text-slate-700 hover:text-accent transition-colors"
                title="Reset to 1.0x Full Target"
              >
                {zoomScale > 1.05 ? `${zoomScale.toFixed(1)}x` : "1.0x"}
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3.5}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-all rounded hover:bg-white"
                title="Zoom In (+0.5x)"
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

      {/* Quick Manual Zoom Presets */}
      {!heatmapMode && (
        <div className="flex items-center justify-between px-0.5 mb-2">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Zoom:
            </span>
            {(isCompound ? [
              { label: "1x Full", scale: 1.0 },
              { label: "1.5x", scale: 1.5 },
              { label: "2.2x (7-10)", scale: 2.2 },
              { label: "3x Gold", scale: 3.0 },
            ] : [
              { label: "1x Full", scale: 1.0 },
              { label: "1.5x", scale: 1.5 },
              { label: "2.2x Center", scale: 2.2 },
              { label: "3x Gold", scale: 3.0 },
            ]).map((preset) => (
              <button
                key={preset.scale}
                type="button"
                onClick={() => setManualZoom(preset.scale)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  Math.abs(zoomScale - preset.scale) < 0.18
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {zoomScale > 1.05 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="text-[10.5px] font-bold text-accent hover:underline flex items-center gap-0.5 ml-2 whitespace-nowrap"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      {/* Target Face Canvas & Floating Controls */}
      <div className="relative">
        <svg 
          ref={svgRef}
          viewBox={currentViewBox} 
          className={`w-full max-w-[340px] mx-auto mt-[6px] touch-none select-none rounded-xl ${
            heatmapMode ? '' : 'cursor-crosshair'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
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

        {/* Floating on-target zoom controls (optimized for quick mobile tapping) */}
        {!heatmapMode && (
          <div className="absolute right-2 bottom-3 flex flex-col items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-slate-200/80 z-10 sm:hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 3.5}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-30"
              aria-label="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="text-[9.5px] font-mono font-bold text-slate-800 py-0.5"
              title="Reset Zoom"
            >
              {zoomScale.toFixed(1)}x
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1.0}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-30"
              aria-label="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-[10px] text-[10.5px] text-black/50 px-1">
        <span>
          {heatmapMode ? "Total Arrows Logged" : "Arrows"}:{" "}
          <span className="text-text-mid font-semibold">
            {heatmapMode ? arrowsToRender.length : `${currentArrows.length}/6`}
          </span>
        </span>

        {!heatmapMode && (
          <span className="text-[10px] text-text-dim">
            {isCompound
              ? (zoomScale > 1.05 ? `Zoomed ${zoomScale.toFixed(1)}x (Compound 5–10)` : "Compound 50m Target · Rings 5–10")
              : (zoomScale > 1.05 ? `Zoomed ${zoomScale.toFixed(1)}x` : "Tap or drag to aim · Pinch to zoom")}
          </span>
        )}
      </div>
    </Card>
  );
}
