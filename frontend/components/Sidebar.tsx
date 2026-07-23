"use client";

import { usePathname } from "next/navigation";
import { navItems } from "@/lib/data";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-[196px] flex-none flex flex-col gap-1 bg-panel border border-border rounded-[14px] p-[14px_10px] backdrop-blur-[20px]">
      <div className="flex items-center gap-2 p-[4px_8px_14px] border-b border-black/5 mb-2">
        <div className="w-[22px] h-[22px] rounded-full border-2 border-accent flex items-center justify-center after:content-[''] after:w-[6px] after:h-[6px] after:rounded-full after:bg-accent" />
        <div className="font-mono font-bold text-[13px] text-black tracking-[0.08em]">
          ARCHERX<em className="not-italic text-accent">AI</em>
        </div>
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-[10px] p-[8px_10px] rounded-lg border-0 bg-transparent text-[12.5px] font-medium text-left cursor-pointer hover:bg-black/5 transition-colors ${
              isActive ? "bg-accent-hover text-accent-soft" : "text-black/60"
            }`}
          >
            <span
              className={`w-[7px] h-[7px] flex-none ${
                isActive ? "bg-accent" : "bg-black/30"
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
        );
      })}
      <div className="mt-auto flex items-center gap-[9px] p-[9px_8px] rounded-[10px] bg-black/5 border border-black/5 pt-4">
        <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-target-red to-[#b71c1c] flex items-center justify-center text-black font-sans font-semibold text-[11px] flex-shrink-0">
          SD
        </div>
        <div>
          <div className="text-[12px] font-semibold text-text-mid">Siddhi Deshmukh</div>
          <div className="text-[10px] text-text-dim">Recurve · Nat. Rank #4</div>
        </div>
      </div>
    </aside>
  );
}
