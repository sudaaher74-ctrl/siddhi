import React from "react";

export default function ScorePad() {
  const scores = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];
  
  return (
    <div className="bg-panel border border-border rounded-[14px] p-6">
      <h3 className="text-[14px] font-semibold text-text mb-4">Input Score</h3>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        {scores.map((score, i) => (
          <button
            key={i}
            className={`
              flex items-center justify-center h-14 rounded-xl text-lg font-bold border border-white/5 transition-colors
              ${score === 'X' || score === '10' ? 'bg-[#f2c53d]/20 text-[#f2c53d] hover:bg-[#f2c53d]/30' : ''}
              ${score === '9' || score === '8' || score === '7' ? 'bg-[#ff8b82]/20 text-[#ff8b82] hover:bg-[#ff8b82]/30' : ''}
              ${score === '6' || score === '5' || score === '4' ? 'bg-[#6fb4e8]/20 text-[#6fb4e8] hover:bg-[#6fb4e8]/30' : ''}
              ${score === '3' || score === '2' || score === '1' ? 'bg-white/10 text-white hover:bg-white/20' : ''}
              ${score === 'M' ? 'bg-black/40 text-text-dim hover:bg-black/60' : ''}
            `}
          >
            {score}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center bg-white/5 rounded-lg p-4 border border-white/5">
        <div>
          <div className="text-[11px] text-text-dim uppercase tracking-wider mb-1">Current End</div>
          <div className="text-[24px] font-mono font-bold text-white tracking-widest">
            X 10 9 <span className="text-white/20">- - -</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-text-dim uppercase tracking-wider mb-1">End Score</div>
          <div className="text-[24px] font-bold text-accent">29</div>
        </div>
      </div>
      
      <button className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[13px] font-semibold text-white transition-colors">
        Submit End
      </button>
    </div>
  );
}
