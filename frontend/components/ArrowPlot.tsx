"use client";

import { useRef, useState, useEffect, useMemo, PointerEvent as ReactPointerEvent } from "react";
import Card from "@/components/ui/Card";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";
import { Session } from "@/lib/data";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ArrowPlotProps {
  currentArrows?: ArrowShot[];
  handleScoreInput?: (score: ScoreValue, cx?: number | null, cy?: number | null) => void;
  handleUndo?: () => void;
  isSessionComplete?: boolean;
  heatmapMode?: boolean;
  sessions?: Session[];
  mode?: "overall" | "daily";
}

export default function ArrowPlot({
  currentArrows = [],
  handleScoreInput,
  handleUndo,
  isSessionComplete = true,
  heatmapMode = false,
  sessions = [],
  mode = "overall"
}: ArrowPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [pointerState, setPointerState] = useState<{ x: number; y: number; score: ScoreValue } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
   * In our SVG target, the visual arrow impact dot has radius 2.5.
   * With a line cutter buffer of 1.8px (shaft radius allowance), an arrow touching
   * the X line (radius 5.5) scores X!
   */
  const calculateScoreFromDistance = (d: number): ScoreValue => {
    const buffer = 1.8;
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

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (heatmapMode) return;
    if (isSessionComplete || currentArrows.length >= 6) return;
    setIsDragging(true);
    updateAim(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (heatmapMode) return;
    if (isSessionComplete || currentArrows.length >= 6) return;
    updateAim(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (heatmapMode) return;
    if (isSessionComplete || currentArrows.length >= 6) return;
    const finalAim = updateAim(e.clientX, e.clientY) || pointerState;
    if (finalAim && handleScoreInput) {
      handleScoreInput(finalAim.score, finalAim.x, finalAim.y);
    }
    setIsDragging(false);
    setPointerState(null);
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setPointerState(null);
    }
  };

  // Get score badge color
  const getBadgeColor = (score: ScoreValue) => {
    if (score === "X" || score === "10" || score === "9") return { bg: "#FFD700", text: "#000000" };
    if (score === "8" || score === "7") return { bg: "#E53935", text: "#FFFFFF" };
    if (score === "6" || score === "5") return { bg: "#4FC3F7", text: "#000000" };
    if (score === "4" || score === "3") return { bg: "#1C1C1C", text: "#FFFFFF" };
    if (score === "2" || score === "1") return { bg: "#FFFFFF", text: "#000000" };
    return { bg: "#64748B", text: "#FFFFFF" };
  };

  // Target viewBox: regular 0 0 230 230, or zoomed center 65 65 100 100 (2.3x magnification)
  const currentViewBox = isZoomed ? "65 65 100 100" : "0 0 230 230";

  return (
    <Card>
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">
          {heatmapMode ? "Grouping Heatmap" : "Arrow plot"}
        </h2>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {!heatmapMode && (
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono font-medium text-[10px] transition-colors ${
                isZoomed 
                  ? "bg-accent text-white" 
                  : "bg-black/5 hover:bg-black/10 text-text"
              }`}
              title={isZoomed ? "View Full Target" : "Zoom into Center (Gold Rings)"}
            >
              {isZoomed ? (
                <>
                  <ZoomOut className="w-3 h-3" />
                  <span>RESET ZOOM</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-3 h-3" />
                  <span>ZOOM CENTER</span>
                </>
              )}
            </button>
          )}

          {handleUndo && !heatmapMode && (
            <button 
              type="button"
              onClick={handleUndo}
              disabled={currentArrows.length === 0 || isSessionComplete}
              className="font-mono font-medium text-[10px] text-black/40 hover:text-accent-soft disabled:opacity-50 transition-colors"
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

      <div className="relative">
        <svg 
          ref={svgRef}
          viewBox={currentViewBox} 
          className={`w-full max-w-[340px] mx-auto mt-[10px] touch-none select-none ${
            heatmapMode ? '' : 'cursor-crosshair'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
          {/* Target face rings */}
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
          <circle cx="115" cy="115" r="11" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="0.9" />

          {/* X ring line (radius 5.5) - now clearly visible! */}
          <circle cx="115" cy="115" r="5.5" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={isZoomed ? "0.6" : "0.75"} />

          {/* Center Crosshair (+) for precision aiming at dead center */}
          <line x1="112.5" y1="115" x2="117.5" y2="115" stroke="rgba(0,0,0,.7)" strokeWidth={isZoomed ? "0.5" : "0.75"} strokeLinecap="round" />
          <line x1="115" y1="112.5" x2="115" y2="117.5" stroke="rgba(0,0,0,.7)" strokeWidth={isZoomed ? "0.5" : "0.75"} strokeLinecap="round" />

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

              return (
                <g 
                  key={i} 
                  className={isNew ? "animate-dotPop" : ""} 
                  style={{ transformOrigin: `${cx}px ${cy}px` }} 
                >
                  {/* Simple White Dot */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={heatmapMode ? "3.5" : (isZoomed ? "2.2" : "2.8")} 
                    fill={heatmapMode ? "var(--accent)" : "#FFFFFF"} 
                    fillOpacity={heatmapMode ? 0.7 : 1}
                    stroke={heatmapMode ? "none" : "#0f172a"} 
                    strokeWidth={heatmapMode ? "0" : (isZoomed ? "0.6" : "0.8")} 
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
                r={isZoomed ? "4" : "6"}
                fill="none"
                stroke="#FF5A4E"
                strokeWidth={isZoomed ? "0.75" : "1"}
                strokeDasharray="2 1"
              />
              <circle
                cx={pointerState.x}
                cy={pointerState.y}
                r={isZoomed ? "1.2" : "1.8"}
                fill="#FF5A4E"
              />

              {/* Floating Score Badge */}
              {(() => {
                const colors = getBadgeColor(pointerState.score);
                const badgeWidth = isZoomed ? 14 : 18;
                const badgeHeight = isZoomed ? 9 : 12;
                const offsetY = isZoomed ? 10 : 15;
                const badgeX = pointerState.x - badgeWidth / 2;
                const badgeY = pointerState.y - offsetY;

                return (
                  <g>
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeWidth}
                      height={badgeHeight}
                      rx={isZoomed ? "2.5" : "3"}
                      fill={colors.bg}
                      stroke="#000000"
                      strokeWidth={isZoomed ? "0.4" : "0.6"}
                    />
                    <text
                      x={pointerState.x}
                      y={badgeY + (isZoomed ? 6.5 : 8.5)}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize={isZoomed ? "6.5" : "8"}
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

      <div className="flex items-center justify-between mt-[10px] text-[10.5px] text-black/50 px-1">
        <span>
          {heatmapMode ? "Total Arrows Logged" : "Arrows"}:{" "}
          <span className="text-text-mid font-semibold">
            {heatmapMode ? arrowsToRender.length : `${currentArrows.length}/6`}
          </span>
        </span>

        {!heatmapMode && (
          <span className="text-[10px] text-text-dim">
            {isZoomed ? "Center Zoomed (2.3x)" : "Tap or drag to aim"}
          </span>
        )}
      </div>
    </Card>
  );
}
