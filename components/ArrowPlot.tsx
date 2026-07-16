import { arrowPlotPoints } from "@/lib/data";

export default function ArrowPlot() {
  return (
    <div className="card col">
      <div className="card-head">
        <div className="card-title">Arrow plot</div>
        <div className="card-meta">END 12–14 · 70m</div>
      </div>
      <svg viewBox="0 0 230 230" className="plot-svg">
        {/* Target face rings */}
        <circle cx="115" cy="115" r="110" fill="#dfe1e4" />
        <circle cx="115" cy="115" r="88" fill="#17181b" />
        <circle cx="115" cy="115" r="66" fill="#3f9bd8" />
        <circle cx="115" cy="115" r="44" fill="#e34e42" />
        <circle cx="115" cy="115" r="22" fill="#f2c53d" />
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
        <circle cx="112" cy="110" r="26" fill="none" stroke="#ff5a4e" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <div className="plot-legend">
        <span>
          Group ⌀ <span className="strong">9.4cm</span>
        </span>
        <span>
          Bias <span className="coral">↖ 1.2cm</span>
        </span>
        <span>
          X-ring <span className="gold">4/18</span>
        </span>
      </div>
    </div>
  );
}
