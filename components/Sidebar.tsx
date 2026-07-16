"use client";

import { useState } from "react";
import { navItems } from "@/lib/data";

export default function Sidebar() {
  const [active, setActive] = useState(0);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-ring" />
        <div className="logo-text">
          ARCHERX<em>AI</em>
        </div>
      </div>
      {navItems.map((item, i) => (
        <button
          key={item.label}
          className={`nav-item${i === active ? " active" : ""}`}
          onClick={() => setActive(i)}
        >
          <span className={`nav-dot ${item.dotShape}`} />
          {item.label}
        </button>
      ))}
      <div className="user-card">
        <div className="avatar">AM</div>
        <div>
          <div className="user-name">Arjun Mehta</div>
          <div className="user-sub">Recurve · Nat. Rank #4</div>
        </div>
      </div>
    </aside>
  );
}
