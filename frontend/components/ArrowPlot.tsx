"use client";

import { useRef, MouseEvent, useEffect, useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";
import { Session } from "@/lib/data";

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

  const calculateScoreFromDistance = (d: number): ScoreValue => {
    if (d <= 5.5) return "X";
    if (d <= 11) return "10";
    if (d <= 22) return "9";
    if (d <= 33) return "8";
    if (d <= 44) return "7";
    if (d <= 55) return "6";
    if (d <= 66) return "5";
    if (d <= 77) return "4";
    if (d <= 88) return "3";
    if (d <= 99) return "2";
    if (d <= 110) return "1";
    return "M";
  };

  const handleSVGClick = (e: MouseEvent<SVGSVGElement>) => {
    if (heatmapMode) return;
    if (isSessionComplete || currentArrows.length >= 6) return;
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    // Calculate distance from center (115, 115)
    const dx = cursorPt.x - 115;
    const dy = cursorPt.y - 115;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const score = calculateScoreFromDistance(distance);
    
    if (handleScoreInput) {
      handleScoreInput(score, cursorPt.x, cursorPt.y);
    }
  };

  return (
    <Card>
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">
          {heatmapMode ? "Grouping Heatmap" : "Arrow plot"}
        </h2>
        <div className="ml-auto flex items-center gap-3">
          {handleUndo && !heatmapMode && (
            <button 
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
      <svg 
        ref={svgRef}
        viewBox="0 0 230 230" 
        className={`w-full max-w-[340px] mx-auto mt-[10px] touch-none ${heatmapMode ? '' : 'cursor-crosshair'}`}
        onClick={handleSVGClick}
      >
        {/* Target face rings */}
        <circle cx="115" cy="115" r="110" fill="var(--target-white)" />
        <circle cx="115" cy="115" r="88" fill="var(--target-black)" />
        <circle cx="115" cy="115" r="66" fill="var(--target-blue)" />
        <circle cx="115" cy="115" r="44" fill="var(--target-red)" />
        <circle cx="115" cy="115" r="22" fill="var(--target-gold)" />
        
        {/* X ring (radius 5.5) - invisible but good to know mathematically */}
        
        {/* 10 ring (radius 11) */}
        <circle cx="115" cy="115" r="11" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
        
        {/* 2 ring */}
        <circle cx="115" cy="115" r="99" fill="none" stroke="rgba(0,0,0,.15)" />
        
        {/* 4 ring */}
        <circle cx="115" cy="115" r="77" fill="none" stroke="rgba(255,255,255,.15)" />
        
        {/* 6 ring */}
        <circle cx="115" cy="115" r="55" fill="none" stroke="rgba(255,255,255,.25)" />
        
        {/* 8 ring */}
        <circle cx="115" cy="115" r="33" fill="none" stroke="rgba(0,0,0,.15)" />
        
        <g>
          {arrowsToRender.map((arrow, i) => {
            let cx = arrow.cx;
            let cy = arrow.cy;
            
            if (cx === null || cy === null) {
              if (heatmapMode) return null; // Don't render missing coordinate arrows in heatmap
              cx = 115;
              cy = 115;
            }

            const isNew = i === animatingIndex && !heatmapMode;

            return (
              <g 
                key={i} 
                className={isNew ? "animate-shootArrow" : ""} 
                style={{ transformOrigin: `${cx}px ${cy}px` }} 
              >
                {!heatmapMode && (
                  <>
                    <line x1={cx} y1={cy} x2={cx + 18} y2={cy + 18} stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1={cx + 13} y1={cy + 13} x2={cx + 18} y2={cy + 9} stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1={cx + 13} y1={cy + 13} x2={cx + 9} y2={cy + 18} stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
                
                {/* Impact Dot */}
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={heatmapMode ? "3.5" : "2.5"} 
                  fill={heatmapMode ? "var(--accent)" : "#FFFFFF"} 
                  fillOpacity={heatmapMode ? 0.6 : 1}
                  stroke={heatmapMode ? "none" : "#000000"} 
                  strokeWidth={heatmapMode ? "0" : "1"} 
                />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="flex gap-[14px] justify-center mt-[10px] text-[10.5px] text-black/50">
        <span>
          {heatmapMode ? "Total Arrows Logged" : "Arrows"} <span className="text-text-mid font-semibold">{heatmapMode ? arrowsToRender.length : `${currentArrows.length}/6`}</span>
        </span>
      </div>
    </Card>
  );
}
