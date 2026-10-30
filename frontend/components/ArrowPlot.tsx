"use client";

import { useRef, useState, useEffect, useMemo, useCallback, PointerEvent as ReactPointerEvent } from "react";
import Card from "@/components/ui/Card";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";
import { Session } from "@/lib/data";
import { Plus, Minus } from "lucide-react";
import {
  TargetFaceType,
  TARGET_FACE_CONFIG,
  MODE_TARGET_FACES,
  getDefaultTargetFace,
  BowOption,
  ModeOption,
} from "./SessionSetup";

interface ArrowPlotProps {
  currentArrows?: ArrowShot[];
  handleScoreInput?: (score: ScoreValue, cx?: number | null, cy?: number | null) => void;
  handleUndo?: () => void;
  isSessionComplete?: boolean;
  heatmapMode?: boolean;
  sessions?: Session[];
  mode?: "overall" | "daily";
  bowType?: string;
  targetFace?: TargetFaceType;
  disciplineMode?: ModeOption;
}

export default function ArrowPlot({
  currentArrows = [],
  handleScoreInput,
  handleUndo,
  isSessionComplete = true,
  heatmapMode = false,
  sessions = [],
  mode = "overall",
  bowType = "Recurve Bow",
  targetFace,
  disciplineMode = "Outdoor",
}: ArrowPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [pointerState, setPointerState] = useState<{ x: number; y: number; score: ScoreValue } | null>(null);

  // Active target face: defaults to passed prop or computes from discipline + bow
  const [activeFace, setActiveFace] = useState<TargetFaceType>(
    targetFace || getDefaultTargetFace(disciplineMode, (bowType as BowOption) || "Recurve Bow")
  );

  useEffect(() => {
    if (targetFace) {
      setActiveFace(targetFace);
    }
  }, [targetFace]);

  const availableFaces = useMemo(() => {
    return MODE_TARGET_FACES[disciplineMode] || ["full-10", "compound-80"];
  }, [disciplineMode]);

  // Cycle to next available target face on badge tap
  const handleCycleTargetFace = () => {
    const currentIndex = availableFaces.indexOf(activeFace);
    const nextIndex = (currentIndex + 1) % availableFaces.length;
    setActiveFace(availableFaces[nextIndex]);
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

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
  const justPinchedRef = useRef(false);
  const isAimingRef = useRef(false);

  // Parse all arrows from sessions if in heatmap mode
  const allHistoricalArrows = useMemo(() => {
    if (!heatmapMode || sessions.length === 0) return [];

    let allArrows: ArrowShot[] = [];
    const today = new Date().toLocaleDateString();

    sessions.forEach((session) => {
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
  const calculateScore = useCallback(
    (ptX: number, ptY: number): ScoreValue => {
      const buffer = 1.8;

      if (activeFace === "compound-80") {
        const dx = ptX - 115;
        const dy = ptY - 115;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 8.0 + buffer) return "X";
        if (d <= 16.0 + buffer) return "10";
        if (d <= 32.0 + buffer) return "9";
        if (d <= 48.0 + buffer) return "8";
        if (d <= 64.0 + buffer) return "7";
        if (d <= 80.0 + buffer) return "6";
        if (d <= 96.0 + buffer) return "5";
        return "M";
      }

      if (activeFace === "field-wa") {
        const dx = ptX - 115;
        const dy = ptY - 115;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 8.3 + buffer) return "X";
        if (d <= 16.6 + buffer) return "6";
        if (d <= 33.3 + buffer) return "5";
        if (d <= 50.0 + buffer) return "4";
        if (d <= 66.6 + buffer) return "3";
        if (d <= 83.3 + buffer) return "2";
        if (d <= 100.0 + buffer) return "1";
        return "M";
      }

      if (activeFace === "field-bw") {
        const dx = ptX - 115;
        const dy = ptY - 115;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 10.0 + buffer) return "X";
        if (d <= 20.0 + buffer) return "5";
        if (d <= 60.0 + buffer) return "4";
        if (d <= 100.0 + buffer) return "3";
        return "M";
      }

      if (activeFace === "triple-spot") {
        const spotYCoords = [46, 115, 184];
        let minD = Infinity;
        spotYCoords.forEach((sy) => {
          const dist = Math.hypot(ptX - 115, ptY - sy);
          if (dist < minD) minD = dist;
        });
        const d = minD;
        if (d <= 2.6 + buffer * 0.4) return "X";
        if (d <= 5.0 + buffer * 0.4) return "10";
        if (d <= 10.0 + buffer * 0.4) return "9";
        if (d <= 15.0 + buffer * 0.4) return "8";
        if (d <= 20.0 + buffer * 0.4) return "7";
        if (d <= 30.0 + buffer * 0.4) return "6";
        return "M";
      }

      // Default: full-10 (Full 10-ring face)
      const dx = ptX - 115;
      const dy = ptY - 115;
      const d = Math.sqrt(dx * dx + dy * dy);
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
    },
    [activeFace]
  );

  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return cursorPt;
  }, []);

  const updateAim = useCallback(
    (clientX: number, clientY: number) => {
      const pt = getSVGPoint(clientX, clientY);
      if (!pt) return null;

      const score = calculateScore(pt.x, pt.y);
      const nextState = { x: pt.x, y: pt.y, score };
      setPointerState(nextState);
      return nextState;
    },
    [getSVGPoint, calculateScore]
  );

  // Zoom button handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => {
      const next = Math.min(4.0, Math.round((prev + 0.35) * 10) / 10);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1.0, Math.round((prev - 0.35) * 10) / 10);
      if (next <= 1.05) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const setManualZoom = (scale: number, panY = 0) => {
    setZoomScale(scale);
    if (scale <= 1.05) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      const viewSize = 230 / scale;
      const maxPan = (230 - viewSize) / 2;
      setPanOffset({
        x: 0,
        y: Math.max(-maxPan, Math.min(maxPan, panY)),
      });
    }
  };

  // Double-click to quick-zoom or reset
  const handleDoubleClick = () => {
    if (heatmapMode) return;
    if (zoomScale > 1.25) {
      handleResetZoom();
    } else {
      setManualZoom(2.2);
    }
  };

  // Pointer event handlers with multi-touch pinch
  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch detected (2 fingers)
    if (activePointersRef.current.size >= 2) {
      isAimingRef.current = false;
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
      const nextScale = Math.max(1.0, Math.min(4.0, Math.round(pinchInitialRef.current.scale * scaleRatio * 100) / 100));
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

    // Aiming in progress
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

    if (activePointersRef.current.size < 2 && pinchInitialRef.current) {
      pinchInitialRef.current = null;
      justPinchedRef.current = true;
      setTimeout(() => {
        justPinchedRef.current = false;
      }, 350);
    }

    if (isAimingRef.current) {
      isAimingRef.current = false;

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
    pinchInitialRef.current = null;
    isAimingRef.current = false;
    setPointerState(null);
  };

  // Official World Archery score badge colors
  const getBadgeColor = (score: ScoreValue) => {
    if (activeFace === "field-wa") {
      if (score === "X" || score === "6" || score === "5") return { bg: "#FFD700", text: "#000000" };
      if (score === "4" || score === "3" || score === "2" || score === "1") return { bg: "#1E293B", text: "#FFFFFF" };
      return { bg: "#64748B", text: "#FFFFFF" };
    }
    if (activeFace === "field-bw") {
      if (score === "X" || score === "5") return { bg: "#FFFFFF", text: "#0F172A" };
      if (score === "4" || score === "3") return { bg: "#1E293B", text: "#FFFFFF" };
      return { bg: "#64748B", text: "#FFFFFF" };
    }
    if (score === "X" || score === "10" || score === "9") return { bg: "#FFD700", text: "#000000" };
    if (score === "8" || score === "7") return { bg: "#E53935", text: "#FFFFFF" };
    if (score === "6" || score === "5") return { bg: "#0EA5E9", text: "#FFFFFF" };
    if (score === "4" || score === "3") return { bg: "#1E293B", text: "#FFFFFF" };
    if (score === "2" || score === "1") return { bg: "#FFFFFF", text: "#0F172A" };
    return { bg: "#64748B", text: "#FFFFFF" };
  };

  // Dynamic ViewBox: scales smoothly from 1.0x to 4.0x
  const viewSize = 230 / zoomScale;
  const maxPan = (230 - viewSize) / 2;
  const clampedPanX = Math.max(-maxPan, Math.min(maxPan, panOffset.x));
  const clampedPanY = Math.max(-maxPan, Math.min(maxPan, panOffset.y));
  const minX = 115 - viewSize / 2 + clampedPanX;
  const minY = 115 - viewSize / 2 + clampedPanY;
  const currentViewBox = `${minX} ${minY} ${viewSize} ${viewSize}`;

  // Zoom presets tailored to the active target face
  const zoomPresets = useMemo(() => {
    if (activeFace === "compound-80") {
      return [
        { label: "1x Full", scale: 1.0, panY: 0 },
        { label: "1.5x", scale: 1.5, panY: 0 },
        { label: "2.2x (7-10)", scale: 2.2, panY: 0 },
        { label: "3x Gold", scale: 3.0, panY: 0 },
      ];
    }
    if (activeFace === "field-wa") {
      return [
        { label: "1x Full", scale: 1.0, panY: 0 },
        { label: "1.5x", scale: 1.5, panY: 0 },
        { label: "2.2x (4-6)", scale: 2.2, panY: 0 },
        { label: "3x Gold", scale: 3.0, panY: 0 },
      ];
    }
    if (activeFace === "field-bw") {
      return [
        { label: "1x Full", scale: 1.0, panY: 0 },
        { label: "1.5x", scale: 1.5, panY: 0 },
        { label: "2.2x (4-5)", scale: 2.2, panY: 0 },
        { label: "3x Center", scale: 3.0, panY: 0 },
      ];
    }
    if (activeFace === "triple-spot") {
      return [
        { label: "1x Full", scale: 1.0, panY: 0 },
        { label: "1.8x Top", scale: 1.8, panY: -50 },
        { label: "1.8x Mid", scale: 1.8, panY: 0 },
        { label: "1.8x Btm", scale: 1.8, panY: 50 },
      ];
    }
    // Full 10-ring
    return [
      { label: "1x Full", scale: 1.0, panY: 0 },
      { label: "1.5x", scale: 1.5, panY: 0 },
      { label: "2.2x Center", scale: 2.2, panY: 0 },
      { label: "3x Gold", scale: 3.0, panY: 0 },
    ];
  }, [activeFace]);

  const footerText = useMemo(() => {
    if (activeFace === "compound-80") return "Compound 50m Target: Rings 5-10";
    if (activeFace === "field-wa") return "World Archery Field: Rings 1-6 (Black & Gold)";
    if (activeFace === "field-bw") return "Classic Field: Rings 3-5 + X (Black & White)";
    if (activeFace === "triple-spot") return "Indoor 18m Vertical 3-Spot: Rings 6-10";
    return "World Archery Target Face: Rings 1-10";
  }, [activeFace]);

  return (
    <Card className="border border-slate-200/90 shadow-xs">
      {/* Header: Title, Badge, Stepper Zoom & Undo */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-slate-800">
            {heatmapMode ? "Grouping Heatmap" : "Arrow plot"}
          </h2>

          <button
            type="button"
            onClick={handleCycleTargetFace}
            className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Click to switch target plot face"
          >
            <span>{TARGET_FACE_CONFIG[activeFace]?.badge || "Target Face"}</span>
            <span className="text-[9px] text-sky-500 font-bold">⇄</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Stepper Control */}
          {!heatmapMode && (
            <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/80">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1.0}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all rounded hover:bg-white cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span
                className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 select-none cursor-pointer"
                onClick={handleResetZoom}
                title="Click to reset zoom"
              >
                {zoomScale.toFixed(1)}x
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 4.0}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all rounded hover:bg-white cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Undo Button */}
          {handleUndo && !heatmapMode && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={currentArrows.length === 0 || isSessionComplete}
              className="px-2.5 py-1 rounded font-mono font-bold text-[10px] text-slate-400 hover:text-slate-700 disabled:opacity-40 transition-colors bg-slate-100 hover:bg-slate-200 uppercase cursor-pointer"
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

      {/* Zoom Presets Row */}
      {!heatmapMode && (
        <div className="flex items-center gap-1.5 px-0.5 mb-3 overflow-x-auto scrollbar-none">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            ZOOM:
          </span>
          {zoomPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setManualZoom(preset.scale, preset.panY)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                Math.abs(zoomScale - preset.scale) < 0.15
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Target Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-100 shadow-xs"
        style={{ touchAction: "none" }}
      >
        <svg
          ref={svgRef}
          viewBox={currentViewBox}
          style={{ touchAction: "none" }}
          className={`w-full max-w-[340px] select-none rounded-xl mx-auto ${
            heatmapMode ? "" : "cursor-crosshair"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerCancel}
          onPointerCancel={handlePointerCancel}
          onDoubleClick={handleDoubleClick}
        >
          {/* ========================================================================= */}
          {/* Target Face 1: Compound 80cm 6-Ring (Blue, Red, Gold)                     */}
          {/* ========================================================================= */}
          {activeFace === "compound-80" && (
            <g>
              <rect x="0" y="0" width="230" height="230" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="115" cy="115" r="96" fill="#0284C7" stroke="#000000" strokeWidth="1.2" />
              <circle cx="115" cy="115" r="80" fill="none" stroke="#000000" strokeWidth="0.8" />
              <circle cx="115" cy="115" r="64" fill="#EF4444" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="48" fill="none" stroke="#000000" strokeWidth="0.8" />
              <circle cx="115" cy="115" r="32" fill="#FACC15" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="16" fill="none" stroke="#000000" strokeWidth="0.8" />
              <circle cx="115" cy="115" r="8" fill="none" stroke="#000000" strokeWidth="0.8" />
              <line x1="112" y1="115" x2="118" y2="115" stroke="#000000" strokeWidth="0.75" strokeLinecap="round" />
              <line x1="115" y1="112" x2="115" y2="118" stroke="#000000" strokeWidth="0.75" strokeLinecap="round" />
              <g pointerEvents="none" className="select-none font-bold">
                <text x="123" y="117.2" fontSize="6.5" textAnchor="middle" fill="#000000" fontWeight="bold">10</text>
                <text x="139" y="117.2" fontSize="7" textAnchor="middle" fill="#000000" fontWeight="bold">9</text>
                <text x="156" y="117.2" fontSize="7.5" textAnchor="middle" fill="#000000" fontWeight="bold">8</text>
                <text x="172" y="117.2" fontSize="7.5" textAnchor="middle" fill="#000000" fontWeight="bold">7</text>
                <text x="188" y="117.2" fontSize="7.5" textAnchor="middle" fill="#000000" fontWeight="bold">6</text>
                <text x="204" y="117.2" fontSize="7.5" textAnchor="middle" fill="#000000" fontWeight="bold">5</text>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* Target Face 2: World Archery Field Face (Rings 1-4 Black, 5-6 Gold)       */}
          {/* ========================================================================= */}
          {activeFace === "field-wa" && (
            <g>
              <rect x="0" y="0" width="230" height="230" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              {/* Outer Black rings 1-4 */}
              <circle cx="115" cy="115" r="100" fill="#111827" stroke="#000000" strokeWidth="1.2" />
              <circle cx="115" cy="115" r="83.3" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.6" />
              <circle cx="115" cy="115" r="66.6" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.6" />
              <circle cx="115" cy="115" r="50" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.6" />

              {/* Center Gold rings 5-6 */}
              <circle cx="115" cy="115" r="33.3" fill="#FACC15" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="16.6" fill="none" stroke="#000000" strokeWidth="0.8" />
              <circle cx="115" cy="115" r="8.3" fill="none" stroke="#000000" strokeWidth="0.75" />
              <line x1="112" y1="115" x2="118" y2="115" stroke="#000000" strokeWidth="0.75" strokeLinecap="round" />
              <line x1="115" y1="112" x2="115" y2="118" stroke="#000000" strokeWidth="0.75" strokeLinecap="round" />

              {/* Horizontal Ring Numbers (6, 5 Gold, 4, 3, 2, 1 White) */}
              <g pointerEvents="none" className="select-none font-bold">
                <text x="123" y="117.2" fontSize="6.5" textAnchor="middle" fill="#000000" fontWeight="bold">6</text>
                <text x="131" y="117.2" fontSize="6.5" textAnchor="middle" fill="#000000" fontWeight="bold">5</text>
                <text x="148" y="117.2" fontSize="7" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">4</text>
                <text x="165" y="117.2" fontSize="7" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">3</text>
                <text x="182" y="117.2" fontSize="7.5" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">2</text>
                <text x="199" y="117.2" fontSize="7.5" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">1</text>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* Target Face 3: Classic Field Face (Black & White)                         */}
          {/* ========================================================================= */}
          {activeFace === "field-bw" && (
            <g>
              <rect x="0" y="0" width="230" height="230" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              {/* Outer Black rings 1-4 */}
              <circle cx="115" cy="115" r="100" fill="#0F172A" stroke="#000000" strokeWidth="1.2" />
              <circle cx="115" cy="115" r="80" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.6" />
              <circle cx="115" cy="115" r="60" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.6" />
              <circle cx="115" cy="115" r="40" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.6" />

              {/* Center Bullseye White (Ring 5 & X) */}
              <circle cx="115" cy="115" r="20" fill="#FFFFFF" stroke="#000000" strokeWidth="1.2" />
              <circle cx="115" cy="115" r="10" fill="none" stroke="#000000" strokeWidth="0.8" />
              <line x1="112" y1="115" x2="118" y2="115" stroke="#000000" strokeWidth="0.75" strokeLinecap="round" />
              <line x1="115" y1="112" x2="115" y2="118" stroke="#000000" strokeWidth="0.75" strokeLinecap="round" />

              {/* Numbers */}
              <g pointerEvents="none" className="select-none font-bold">
                <text x="122" y="117.2" fontSize="6.5" textAnchor="middle" fill="#000000" fontWeight="bold">5</text>
                <text x="145" y="117.2" fontSize="7" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">4</text>
                <text x="175" y="117.2" fontSize="7.5" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">3</text>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* Target Face 4: Indoor Vertical 3-Spot Face (3 Stacked Targets)           */}
          {/* ========================================================================= */}
          {activeFace === "triple-spot" && (
            <g>
              <rect x="0" y="0" width="230" height="230" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              {[46, 115, 184].map((sy, idx) => (
                <g key={idx}>
                  {/* Spot target index label */}
                  <text x="65" y={sy + 3.5} fontSize="8" fill="#94A3B8" fontWeight="bold" textAnchor="middle">
                    {idx + 1}
                  </text>
                  {/* 6 Ring (Blue) */}
                  <circle cx="115" cy={sy} r="30" fill="#0284C7" stroke="#000000" strokeWidth="0.8" />
                  {/* 7 & 8 Ring (Red) */}
                  <circle cx="115" cy={sy} r="20" fill="#EF4444" stroke="#000000" strokeWidth="0.7" />
                  <circle cx="115" cy={sy} r="15" fill="none" stroke="#000000" strokeWidth="0.6" />
                  {/* 9 & 10 Ring (Gold) */}
                  <circle cx="115" cy={sy} r="10" fill="#FACC15" stroke="#000000" strokeWidth="0.7" />
                  <circle cx="115" cy={sy} r="5" fill="none" stroke="#000000" strokeWidth="0.6" />
                  {/* Inner X Ring */}
                  <circle cx="115" cy={sy} r="2.5" fill="none" stroke="#000000" strokeWidth="0.5" />
                  <line x1="113.5" y1={sy} x2="116.5" y2={sy} stroke="#000000" strokeWidth="0.5" strokeLinecap="round" />
                  <line x1="115" y1={sy - 1.5} x2="115" y2={sy + 1.5} stroke="#000000" strokeWidth="0.5" strokeLinecap="round" />
                </g>
              ))}
            </g>
          )}

          {/* ========================================================================= */}
          {/* Target Face 5: Standard Full 10-Ring Face (5 Colors)                      */}
          {/* ========================================================================= */}
          {activeFace === "full-10" && (
            <g>
              <rect x="0" y="0" width="230" height="230" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              {/* 1 & 2 ring (white) */}
              <circle cx="115" cy="115" r="104" fill="#F8FAFC" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="93.6" fill="none" stroke="#CBD5E1" strokeWidth="0.8" />
              {/* 3 & 4 ring (black) */}
              <circle cx="115" cy="115" r="83.2" fill="#1E293B" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="72.8" fill="none" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.4" />
              {/* 5 & 6 ring (blue) */}
              <circle cx="115" cy="115" r="62.4" fill="#0284C7" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="52.0" fill="none" stroke="#000000" strokeWidth="0.8" />
              {/* 7 & 8 ring (red) */}
              <circle cx="115" cy="115" r="41.6" fill="#EF4444" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="31.2" fill="none" stroke="#000000" strokeWidth="0.8" />
              {/* 9 & 10 ring (gold) */}
              <circle cx="115" cy="115" r="20.8" fill="#FACC15" stroke="#000000" strokeWidth="1.0" />
              <circle cx="115" cy="115" r="10.4" fill="none" stroke="#000000" strokeWidth="0.8" />
              {/* Inner X Ring */}
              <circle cx="115" cy="115" r="5.2" fill="none" stroke="#000000" strokeWidth="0.7" />
              <line x1="112.5" y1="115" x2="117.5" y2="115" stroke="#000000" strokeWidth="0.7" strokeLinecap="round" />
              <line x1="115" y1="112.5" x2="115" y2="117.5" stroke="#000000" strokeWidth="0.7" strokeLinecap="round" />
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
                <g key={i} className={isNew ? "animate-dotPop" : ""} style={{ transformOrigin: `${cx}px ${cy}px` }}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={arrowRadius}
                    fill="#FFFFFF"
                    fillOpacity={heatmapMode ? 0.92 : 1}
                    stroke="rgba(15, 23, 42, 0.85)"
                    strokeWidth={arrowStroke}
                  />
                </g>
              );
            })}
          </g>

          {/* Live Aiming Reticle & Floating Score Pill */}
          {pointerState && !heatmapMode && !isSessionComplete && currentArrows.length < 6 && (
            <g pointerEvents="none">
              <circle
                cx={pointerState.x}
                cy={pointerState.y}
                r={Math.max(3.8, 6 / Math.sqrt(zoomScale))}
                fill="none"
                stroke="#FF5A4E"
                strokeWidth={Math.max(0.6, 1 / Math.sqrt(zoomScale))}
                strokeDasharray="2 1"
              />
              <circle cx={pointerState.x} cy={pointerState.y} r={Math.max(1.1, 1.8 / Math.sqrt(zoomScale))} fill="#FF5A4E" />

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
                      rx="2.5"
                      fill={colors.bg}
                      stroke="#000000"
                      strokeWidth={0.5}
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
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 px-1 select-none">
        <span>
          {heatmapMode ? "Total Arrows Logged" : "Arrows"}:{" "}
          <span className="text-slate-700 font-semibold">
            {heatmapMode ? arrowsToRender.length : `${currentArrows.length}/6`}
          </span>
        </span>

        {!heatmapMode && (
          <span className="text-[10.5px] text-slate-400">
            {footerText}
          </span>
        )}
      </div>
    </Card>
  );
}
