import { sessions } from "@/lib/data";

export default function SessionsTable() {
  return (
    <div className="sessions">
      <div className="sessions-head">
        <span>Session</span>
        <span>Type</span>
        <span>Arrows</span>
        <span>Score</span>
        <span>Avg</span>
        <span>10+X</span>
        <span>AI note</span>
      </div>
      {sessions.map((s, i) => (
        <div className="session-row" key={i}>
          <span className="name">{s.name}</span>
          <span className="type">{s.type}</span>
          <span className="mono">{s.arrows}</span>
          <span className="score">{s.score}</span>
          <span className="mono">{s.avg}</span>
          <span className="mono">{s.tens}</span>
          <span className="note">{s.note}</span>
        </div>
      ))}
    </div>
  );
}
