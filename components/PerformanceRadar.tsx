export default function PerformanceRadar() {
  return (
    <div className="card col">
      <div className="card-head">
        <div className="card-title">Performance radar</div>
        <div className="card-meta">VS LAST MONTH</div>
      </div>
      <svg viewBox="0 0 220 210" className="radar-svg">
        <g fill="none" stroke="rgba(255,255,255,.09)">
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
        <polygon
          points="110,32 168,70 158,134 110,168 55,131 52,68"
          fill="rgba(255,90,78,.18)"
          stroke="#ff5a4e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points="110,48 152,76 148,126 110,150 68,124 62,74"
          fill="none"
          stroke="rgba(255,255,255,.3)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <g fontFamily="Instrument Sans" fontSize="10" fill="rgba(255,255,255,.6)" textAnchor="middle">
          <text x="110" y="16">Focus</text>
          <text x="192" y="60">Accuracy</text>
          <text x="192" y="156">Consistency</text>
          <text x="110" y="196">Release</text>
          <text x="28" y="156">Timing</text>
          <text x="28" y="60">Endurance</text>
        </g>
      </svg>
      <div className="radar-legend">
        <span>
          <span className="legend-swatch" style={{ background: "#ff5a4e" }} />
          Now
        </span>
        <span>
          <span className="legend-swatch" style={{ background: "rgba(255,255,255,.35)" }} />
          June
        </span>
      </div>
    </div>
  );
}
