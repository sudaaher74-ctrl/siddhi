import React from "react";

export default function ScorePad() {
  const scores = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];
  
  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 sm:p-6">
      <h3 className="text-[14px] font-semibold text-text mb-3 sm:mb-4">Input Score</h3>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
        {scores.map((score, i) => (
          <button
            key={i}
            className={`
              flex items-center justify-center h-12 sm:h-14 rounded-xl text-[16px] sm:text-lg font-bold border border-black/5 transition-colors
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
          <div className="text-[20px] sm:text-[24px] font-mono font-bold text-black tracking-widest">
            X 10 9 <span className="text-black/20">- - -</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1">End Score</div>
          <div className="text-[20px] sm:text-[24px] font-bold text-accent">29</div>
        </div>
      </div>
      
      <button className="w-full mt-4 py-2.5 sm:py-3 bg-black/5 hover:bg-black/10 border border-black/10 rounded-lg text-[13px] font-semibold text-black transition-colors">
        Submit End
      </button>
    </div>
  );
}
