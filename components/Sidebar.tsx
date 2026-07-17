"use client";

import { useState } from "react";
import { navItems } from "@/lib/data";
import Link from "next/link";

export default function Sidebar() {
  const [active, setActive] = useState(0);

  return (
    <aside className="w-full lg:w-[196px] flex-none flex flex-col gap-1 bg-panel border border-border rounded-[14px] p-[14px_10px] backdrop-blur-[20px]">
      <div className="flex items-center gap-2 p-[4px_8px_14px] border-b border-white/5 mb-2">
        <div className="w-[22px] h-[22px] rounded-full border-2 border-accent flex items-center justify-center after:content-[''] after:w-[6px] after:h-[6px] after:rounded-full after:bg-accent" />
        <div className="font-mono font-bold text-[13px] text-white tracking-[0.08em]">
          ARCHERX<em className="not-italic text-accent">AI</em>
        </div>
      </div>
      {navItems.map((item, i) => (
        <Link
          key={item.label}
          href="#"
          className={`flex items-center gap-[10px] p-[8px_10px] rounded-lg border-0 bg-transparent text-[12.5px] font-medium text-left cursor-pointer hover:bg-white/5 transition-colors ${
            i === active ? "bg-accent-hover text-[#ffb0aa]" : "text-white/60"
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActive(i);
          }}
        >
          <span
            className={`w-[7px] h-[7px] flex-none ${
              i === active ? "bg-accent" : "bg-white/30"
            } ${
              item.dotShape === "circle"
                ? "rounded-full"
                : item.dotShape === "square"
                ? "rounded-[2px]"
                : "rounded-[1px]"
            }`}
          />
          {item.label}
        </Link>
      ))}
      <div className="mt-auto flex items-center gap-[9px] p-[9px_8px] rounded-[10px] bg-white/5 border border-white/5">
        <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-[#ff5a4e] to-[#8d2f28] flex items-center justify-center text-white font-sans font-semibold text-[11px]">
          AM
        </div>
        <div>
          <div className="text-[12px] font-semibold text-text-mid">Arjun Mehta</div>
          <div className="text-[10px] text-text-dim">Recurve · Nat. Rank #4</div>
        </div>
      </div>
    </aside>
  );
}
