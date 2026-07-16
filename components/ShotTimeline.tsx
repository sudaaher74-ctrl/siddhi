import { arrowTimeline } from "@/lib/data";

export default function ShotTimeline() {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Shot timeline</div>
        <div className="timeline-head-note">last 36 arrows · click to replay</div>
        <button className="replay-btn">▶ REPLAY</button>
      </div>
      <div className="timeline-grid">
        {arrowTimeline.map((a, i) => (
          <div
            key={i}
            className="arrow-tile"
            style={{ color: a.c, borderBottomColor: a.c }}
          >
            {a.v}
          </div>
        ))}
      </div>
      <div className="timeline-foot">
        <span>Ends 9–14</span>
        <span>
          Best end <span className="gold">58</span>
        </span>
        <span>
          Drop after arrow <span className="coral">90</span> · −4.1%
        </span>
      </div>
    </div>
  );
}
