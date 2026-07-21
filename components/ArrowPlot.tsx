import { arrowPlotPoints } from "@/lib/data";

export default function ArrowPlot() {
  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 flex flex-col">
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Arrow plot</h2>
        <div className="ml-auto font-mono font-medium text-[10px] text-black/40">END 12–14 · 70m</div>
      </div>
      <svg viewBox="0 0 230 230" className="w-full max-w-[230px] mx-auto mt-[10px]">
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
        {/* Impacts */}
        <g fill="#fff" stroke="#0a0c10" strokeWidth="1.4">
          {arrowPlotPoints.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="4" />
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
    </div>
  );
}
