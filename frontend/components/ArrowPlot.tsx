"use client";

import { useRef, MouseEvent, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";

interface ArrowPlotProps {
  currentArrows?: ArrowShot[];
  handleScoreInput?: (score: ScoreValue, cx?: number | null, cy?: number | null) => void;
  handleUndo?: () => void;
  isSessionComplete?: boolean;
}

export default function ArrowPlot({
  currentArrows = [],
  handleScoreInput,
  handleUndo,
  isSessionComplete = true
}: ArrowPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  // When a new arrow is added, animate it
  useEffect(() => {
    if (currentArrows.length > 0) {
      setAnimatingIndex(currentArrows.length - 1);
      const timer = setTimeout(() => setAnimatingIndex(null), 300);
      return () => clearTimeout(timer);
    }
  }, [currentArrows.length]);

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
        <h2 className="text-[13px] font-semibold text-text-mid">Arrow plot</h2>
        <div className="ml-auto flex items-center gap-3">
          {handleUndo && (
            <button 
              onClick={handleUndo}
              disabled={currentArrows.length === 0 || isSessionComplete}
              className="font-mono font-medium text-[10px] text-black/40 hover:text-accent-soft disabled:opacity-50 transition-colors"
            >
              UNDO
            </button>
          )}
        </div>
      </div>
      <svg 
        ref={svgRef}
        viewBox="0 0 230 230" 
        className="w-full max-w-[230px] mx-auto mt-[10px] cursor-crosshair touch-none"
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
          {currentArrows.map((arrow, i) => {
            // If the arrow was entered via keypad, we might not have cx/cy. 
            // In a real app, we might place it randomly or hide it.
            // For now, if null, place it in the center or based on score.
            let cx = arrow.cx;
            let cy = arrow.cy;
            
            if (cx === null || cy === null) {
              // Very rough approximation: place it near the center if missing
              cx = 115;
              cy = 115;
            }

            const isNew = i === animatingIndex;

            return (
              <g 
                key={i} 
                className={isNew ? "animate-shootArrow" : ""} 
                style={{ transformOrigin: `${cx}px ${cy}px` }} 
              >
                {/* Arrow Shaft (Angle pointing to bottom-right) */}
                <line x1={cx} y1={cy} x2={cx + 18} y2={cy + 18} stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* Fletchings (Vanes) */}
                <line x1={cx + 13} y1={cy + 13} x2={cx + 18} y2={cy + 9} stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" />
                <line x1={cx + 13} y1={cy + 13} x2={cx + 9} y2={cy + 18} stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* Impact Dot (Hole in target) */}
                <circle cx={cx} cy={cy} r="2.5" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="flex gap-[14px] justify-center mt-[10px] text-[10.5px] text-black/50">
        <span>
          Arrows <span className="text-text-mid font-semibold">{currentArrows.length}/6</span>
        </span>
      </div>
    </Card>
  );
}
