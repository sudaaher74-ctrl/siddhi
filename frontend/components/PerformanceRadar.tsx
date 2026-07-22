import Card from "@/components/ui/Card";

export default function PerformanceRadar() {
  return (
    <Card>
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Performance radar</h2>
        <div className="ml-auto font-mono font-medium text-[10px] text-black/40">VS LAST MONTH</div>
      </div>
      <svg viewBox="0 0 220 210" className="w-full max-w-[230px] mx-auto mt-2">
        <g fill="none" stroke="rgba(0,0,0,.09)">
          <polygon points="110,25 178,64 178,142 110,181 42,142 42,64" />
          <polygon points="110,51 155,77 155,129 110,155 65,129 65,77" />
          <polygon points="110,77 133,90 133,116 110,129 87,116 87,90" />
          <line x1="110" y1="103" x2="110" y2="25" />
          <line x1="110" y1="103" x2="178" y2="64" />
          <line x1="110" y1="103" x2="178" y2="142" />
          <line x1="110" y1="103" x2="110" y2="181" />
          <line x1="110" y1="103" x2="42" y2="142" />
          <line x1="110" y1="103" x2="42" y2="64" />
        </g>
        {/* Empty state: No data polygons rendered */}
        <g fontFamily="var(--font-sans), sans-serif" fontSize="10" fill="rgba(0,0,0,.6)" textAnchor="middle">
          <text x="110" y="16">Focus</text>
          <text x="192" y="60">Accuracy</text>
          <text x="192" y="156">Consistency</text>
          <text x="110" y="196">Release</text>
          <text x="28" y="156">Timing</text>
          <text x="28" y="60">Endurance</text>
        </g>
      </svg>
      <div className="mt-auto flex gap-3 justify-center text-[10.5px] text-black/50 pt-4">
        <span className="flex items-center gap-[5px]">
          <span className="w-[8px] h-[2px] bg-accent" />
          Now
        </span>
        <span className="flex items-center gap-[5px]">
          <span className="w-[8px] h-[2px] bg-black/35" />
          June
        </span>
      </div>
    </Card>
  );
}
