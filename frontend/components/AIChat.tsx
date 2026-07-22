import React from "react";
import { Send, Bot, User } from "lucide-react";

export default function AIChat() {
  return (
    <div className="flex flex-col h-[calc(100vh-210px)] lg:h-[calc(100vh-140px)] bg-panel border border-border rounded-[14px] overflow-hidden">
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6">
        
        {/* User Message */}
        <div className="flex gap-3 sm:gap-4 self-end max-w-[90%] sm:max-w-[80%]">
          <div className="bg-black/5 rounded-2xl rounded-tr-sm p-3 sm:p-4 text-[13px] text-black/90 border border-black/5">
            Hey Coach, my arrows have been grouping a bit to the left today, especially when the wind picks up. Any tips?
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-[#b71c1c] flex-shrink-0 flex items-center justify-center text-black text-xs font-bold">
            AM
          </div>
        </div>

        {/* AI Message */}
        <div className="flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%]">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex-shrink-0 flex items-center justify-center text-accent">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-accent/5 rounded-2xl rounded-tl-sm p-3 sm:p-4 text-[13px] text-black/90 border border-accent/10">
            <p className="mb-2">I noticed that in your last end, your release timing was about 40ms slower than your average. When shooting in the wind, it's common to hesitate or "over-aim", which can cause left drift for right-handed archers due to tension building up in the bow arm.</p>
            <p className="mb-2"><strong>Tip:</strong> Try to keep your expansion continuous. Don't stop pulling to aim. Trust your float.</p>
            <div className="mt-3 p-3 bg-white/20 rounded-lg border border-black/5">
              <div className="text-[11px] text-text-dim mb-1">Recommended Drill</div>
              <div className="text-[13px] font-medium text-accent-soft">Blank Bale Timing (30 arrows)</div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-black/5 border-t border-black/5">
        <div className="flex items-center gap-3 bg-white/20 rounded-full px-4 py-2 border border-black/10 focus-within:border-accent/50 transition-colors">
          <input 
            type="text" 
            placeholder="Ask your coach..." 
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-black placeholder:text-black/30"
          />
          <button className="p-2 rounded-full bg-accent text-panel hover:bg-accent-hover transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
