import { arrowTimeline } from "@/lib/data";

export default function ShotTimeline() {
  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 flex flex-col">
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Shot timeline</h2>
        <div className="text-[11px] text-black/40 ml-[10px]">last 36 arrows · click to replay</div>
        <button className="ml-auto font-mono font-semibold text-[11px] text-accent-soft bg-transparent border-0 cursor-pointer p-0">▶ REPLAY</button>
      </div>
      <div className="flex gap-1 mt-3 flex-wrap">
        {arrowTimeline.map((a, i) => (
          <div
            key={i}
            className="w-[26px] h-[32px] flex-none rounded-[6px] bg-black/5 border border-black/10 border-b-2 flex items-center justify-center font-mono font-semibold text-[11px] cursor-pointer hover:bg-black/10 transition-colors"
            style={{ color: a.c, borderBottomColor: a.c }}
          >
            {a.v}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-text-dim">
        <span>Ends 9–14</span>
        <span>
          Best end <span className="text-gold font-semibold">58</span>
        </span>
        <span>
          Drop after arrow <span className="text-accent-soft font-semibold">90</span> · −4.1%
        </span>
      </div>
    </div>
  );
}
