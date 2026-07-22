"use client";

import React, { useState } from "react";
import { Undo2 } from "lucide-react";

type ScoreValue = "X" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2" | "1" | "M";

export default function ScorePad() {
  const scores: ScoreValue[] = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];
  
  // State for 6 ends (rounds), each can hold up to 6 arrows
  const [ends, setEnds] = useState<ScoreValue[][]>(Array(6).fill([]));
  const [currentEndIndex, setCurrentEndIndex] = useState(0);

  const currentArrows = ends[currentEndIndex] || [];
  const isSessionComplete = currentEndIndex >= 6;

  const handleScoreInput = (score: ScoreValue) => {
    if (isSessionComplete) return;
    if (currentArrows.length < 6) {
      const newEnds = [...ends];
      newEnds[currentEndIndex] = [...currentArrows, score];
      setEnds(newEnds);
    }
  };

  const handleUndo = () => {
    if (isSessionComplete) return;
    if (currentArrows.length > 0) {
      const newEnds = [...ends];
      newEnds[currentEndIndex] = currentArrows.slice(0, -1);
      setEnds(newEnds);
    }
  };

  const handleSubmitEnd = () => {
    if (isSessionComplete) return;
    if (currentArrows.length === 6) {
      setCurrentEndIndex((prev) => prev + 1);
    }
  };

  const calculateValue = (s: ScoreValue): number => {
    if (s === "X") return 10;
    if (s === "M") return 0;
    return parseInt(s, 10);
  };

  const currentEndScore = currentArrows.reduce((sum, s) => sum + calculateValue(s), 0);
  const totalScore = ends.flat().reduce((sum, s) => sum + calculateValue(s), 0);

  // Display arrows (pad with dashes)
  const displayArrows: Array<ScoreValue | "-"> = [...currentArrows];
  while (displayArrows.length < 6) {
    displayArrows.push("-");
  }

  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 sm:p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-[14px] font-semibold text-text">
          {isSessionComplete ? "Session Complete" : `Input Score (End ${currentEndIndex + 1}/6)`}
        </h3>
        <div className="text-[12px] font-bold text-text-dim">Total: {totalScore}</div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
        {scores.map((score, i) => (
          <button
            key={i}
            onClick={() => handleScoreInput(score)}
            disabled={isSessionComplete || currentArrows.length >= 6}
            className={`
              flex items-center justify-center h-12 sm:h-14 rounded-xl text-[16px] sm:text-lg font-bold border border-black/5 transition-colors
              ${isSessionComplete || currentArrows.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}
              ${score === 'X' || score === '10' || score === '9' ? 'bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30' : ''}
              ${score === '8' || score === '7' ? 'bg-[#E53935]/20 text-[#E53935] hover:bg-[#E53935]/30' : ''}
              ${score === '6' || score === '5' ? 'bg-[#4FC3F7]/20 text-[#4FC3F7] hover:bg-[#4FC3F7]/30' : ''}
              ${score === '4' || score === '3' ? 'bg-[#1C1C1C]/60 text-black hover:bg-[#1C1C1C]/80' : ''}
              ${score === '2' || score === '1' || score === 'M' ? 'bg-black/10 text-black hover:bg-black/20' : ''}
            `}
          >
            {score}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center bg-black/5 rounded-lg p-3 sm:p-4 border border-black/5">
        <div>
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1">Current End</div>
          <div className="text-[20px] sm:text-[24px] font-mono font-bold text-black tracking-widest flex gap-2">
            {displayArrows.map((a, i) => (
              <span key={i} className={a === '-' ? 'text-black/20' : ''}>{a}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1">End Score</div>
          <div className="text-[20px] sm:text-[24px] font-bold text-accent">{currentEndScore}</div>
        </div>
      </div>
      
      {!isSessionComplete ? (
        <div className="flex gap-2 mt-4">
          <button 
            onClick={handleUndo}
            disabled={currentArrows.length === 0}
            className="flex items-center justify-center px-4 bg-black/5 hover:bg-black/10 border border-black/10 rounded-lg text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSubmitEnd}
            disabled={currentArrows.length < 6}
            className="flex-1 py-2.5 sm:py-3 bg-black/5 hover:bg-black/10 border border-black/10 rounded-lg text-[13px] font-semibold text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit End
          </button>
        </div>
      ) : (
        <button className="w-full mt-4 py-2.5 sm:py-3 bg-accent text-panel border border-accent rounded-lg text-[13px] font-semibold transition-colors hover:shadow-[0_0_15px_rgba(255,90,78,0.4)]">
          Save Session
        </button>
      )}
    </div>
  );
}
