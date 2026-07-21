"use client";

import { useState, useRef, MouseEvent } from "react";
import { arrowPlotPoints } from "@/lib/data";
import Card from "@/components/ui/Card";

export default function ArrowPlot() {
  const [shots, setShots] = useState<{cx: number, cy: number, isNew: boolean}[]>(
    arrowPlotPoints.map(([cx, cy]) => ({ cx, cy, isNew: false }))
  );
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSVGClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    setShots([...shots, { cx: cursorPt.x, cy: cursorPt.y, isNew: true }]);
  };
  return (
    <Card>
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Arrow plot</h2>
        <div className="ml-auto font-mono font-medium text-[10px] text-black/40">END 12–14 · 70m</div>
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
        <circle cx="115" cy="115" r="11" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
        <circle cx="115" cy="115" r="99" fill="none" stroke="rgba(0,0,0,.15)" />
        <circle cx="115" cy="115" r="77" fill="none" stroke="rgba(255,255,255,.15)" />
        <circle cx="115" cy="115" r="55" fill="none" stroke="rgba(255,255,255,.25)" />
        <circle cx="115" cy="115" r="33" fill="none" stroke="rgba(0,0,0,.15)" />
        <g>
          {shots.map(({ cx, cy, isNew }, i) => (
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
          ))}
        </g>
        {/* Group circle */}
        <circle cx="112" cy="110" r="26" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <div className="flex gap-[14px] justify-center mt-[10px] text-[10.5px] text-black/50">
        <span>
          Group ⌀ <span className="text-text-mid font-semibold">9.4cm</span>
        </span>
        <span>
          Bias <span className="text-accent-soft font-semibold">↖ 1.2cm</span>
        </span>
        <span>
          X-ring <span className="text-gold font-semibold">4/18</span>
        </span>
      </div>
    </Card>
  );
}
