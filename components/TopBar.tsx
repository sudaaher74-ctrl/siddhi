export default function TopBar() {
  return (
    <div className="topbar">
      <div>
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Thu 16 Jul 2026 · SAI Range, Sonipat · 70m ranking round</div>
      </div>
      <div className="search-pill">
        ⌕ Search sessions, gear, meets…
        <span className="kbd">⌘K</span>
      </div>
      <div className="live-pill">
        <span className="live-dot" />
        Live session · End 14
      </div>
    </div>
  );
}
