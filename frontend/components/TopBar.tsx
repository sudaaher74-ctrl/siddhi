import { Search } from "lucide-react";

export default function TopBar({ title = "Dashboard" }: { title?: string }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center gap-4 md:gap-[12px] sticky top-0 z-50 bg-white/80 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-transparent">
      <div className="flex justify-between items-start w-full md:w-auto">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
        <div className="md:hidden flex items-center gap-[7px] p-[5px_10px] rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold w-max shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulseCustom" />
          Live
        </div>
      </div>
      <div className="md:ml-auto hidden md:flex items-center gap-3 px-4 h-[48px] rounded-[12px] bg-slate-50 border border-slate-200 text-slate-500 text-[14px] w-[260px] cursor-pointer hover:border-slate-300 hover:bg-white focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all shadow-sm group">
        <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" /> 
        <input 
          type="text" 
          placeholder="Search sessions..." 
          className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400"
        />
        <span className="ml-auto font-mono font-medium text-[11px] border border-slate-200 bg-white rounded-[6px] px-1.5 py-0.5 text-slate-400 shadow-sm">⌘K</span>
      </div>
    </header>
  );
}
