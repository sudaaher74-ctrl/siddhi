import { Search } from "lucide-react";

export default function TopBar({ title = "Dashboard" }: { title?: string }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center gap-3 md:gap-[12px]">
      <div>
        <h1 className="text-[19px] font-bold text-text tracking-[-0.01em]">{title}</h1>
        <div className="text-[11.5px] text-text-dim">Thu 16 Jul 2026 · SAI Range, Sonipat · 70m ranking round</div>
      </div>
      <div className="md:ml-auto flex items-center gap-2 p-[7px_12px] rounded-full bg-white/5 border border-border text-white/50 text-[12px] w-full md:w-[220px] cursor-pointer">
        <Search className="w-3.5 h-3.5" /> Search sessions, gear, meets…
        <span className="ml-auto font-mono font-medium text-[10px] border border-white/15 rounded-[4px] p-[1px_4px]">⌘K</span>
      </div>
      <div className="flex items-center gap-[7px] p-[7px_13px] rounded-full bg-accent-subtle border border-accent/40 text-accent-soft text-[12px] font-semibold w-max">
        <span className="w-[7px] h-[7px] rounded-full bg-accent animate-pulseCustom" />
        Live session · End 14
      </div>
    </header>
  );
}
