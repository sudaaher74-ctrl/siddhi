"use client";

import { useState } from "react";

const PERIODS = ["D", "W", "M", "Y"] as const;

export default function ScoreTrend() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("W");

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Score trend</div>
        <div className="card-sub">avg per 36-arrow block</div>
        <div className="seg">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`seg-btn${p === period ? " active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 560 190" className="trend-svg">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff5a4e" stopOpacity=".28" />
            <stop offset="1" stopColor="#ff5a4e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="rgba(255,255,255,.06)">
          <line x1="0" y1="40" x2="560" y2="40" />
          <line x1="0" y1="85" x2="560" y2="85" />
          <line x1="0" y1="130" x2="560" y2="130" />
          <line x1="0" y1="175" x2="560" y2="175" />
        </g>
        <path
          d="M0,128 L40,118 L80,124 L120,101 L160,108 L200,92 L240,97 L280,74 L320,82 L360,63 L400,70 L440,55 L480,61 L520,42 L560,48 L560,190 L0,190 Z"
          fill="url(#trendFill)"
        />
        <polyline
          points="0,128 40,118 80,124 120,101 160,108 200,92 240,97 280,74 320,82 360,63 400,70 440,55 480,61 520,42 560,48"
          fill="none"
          stroke="#ff5a4e"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeDasharray="900"
          style={{ animation: "dashin 1.8s ease-out both" }}
        />
        <circle cx="520" cy="42" r="4" fill="#0a0c10" stroke="#ff5a4e" strokeWidth="2.5" />
        <g fontFamily="IBM Plex Mono" fontSize="9" fill="rgba(255,255,255,.35)">
          <text x="4" y="36">9.5</text>
          <text x="4" y="81">9.0</text>
          <text x="4" y="126">8.5</text>
          <text x="4" y="171">8.0</text>
        </g>
      </svg>
      <div className="trend-foot">
        <span>
          <span className="coral">9.34</span> this week
        </span>
        <span>
          <span className="strong">9.11</span> 30-day avg
        </span>
        <span className="up">▲ 2.1% wk / wk</span>
      </div>
    </div>
  );
}
