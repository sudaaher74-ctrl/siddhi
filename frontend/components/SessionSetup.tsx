"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import { Target } from "lucide-react";

export const DISTANCE_OPTIONS = ["18m", "30m", "40m", "50m", "60m", "70m", "90m"];
export const SESSION_TYPES = ["Practice", "Blank Bale", "Scoring"];

export type SessionSetupValues = {
  distance: string;
  type: string;
};

interface SessionSetupProps {
  onStart: (values: SessionSetupValues) => void;
}

export default function SessionSetup({ onStart }: SessionSetupProps) {
  const [distance, setDistance] = useState("70m");
  const [customDistance, setCustomDistance] = useState("");
  const [type, setType] = useState("Practice");

  const resolvedDistance = distance === "custom" ? customDistance.trim() : distance;
  const canStart = resolvedDistance.length > 0;

  return (
    <div className="max-w-lg mx-auto mt-6">
      <Card>
        <div className="p-2">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-accent" />
            <h2 className="text-[16px] font-bold text-text">Before you shoot</h2>
          </div>
          <p className="text-[13px] text-text-dim mb-5">
            Which target are you shooting today? This is saved with your session.
          </p>

          <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-2">
            Distance
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {DISTANCE_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDistance(d)}
                className={`py-3 rounded-lg text-[14px] font-semibold transition-colors ${
                  distance === d
                    ? "bg-accent text-white"
                    : "bg-black/5 text-text hover:bg-black/10"
                }`}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDistance("custom")}
              className={`py-3 rounded-lg text-[14px] font-semibold transition-colors ${
                distance === "custom"
                  ? "bg-accent text-white"
                  : "bg-black/5 text-text hover:bg-black/10"
              }`}
            >
              Other
            </button>
          </div>

          {distance === "custom" && (
            <input
              type="text"
              value={customDistance}
              onChange={(e) => setCustomDistance(e.target.value)}
              placeholder="e.g. 25m"
              className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent mb-3"
            />
          )}

          <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-2 mt-4">
            Session Type
          </label>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-3 rounded-lg text-[13px] font-semibold transition-colors ${
                  type === t ? "bg-accent text-white" : "bg-black/5 text-text hover:bg-black/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={() => onStart({ distance: resolvedDistance, type })}
            className="w-full py-3 bg-accent text-white font-semibold text-[14px] rounded-lg transition-opacity disabled:opacity-40"
          >
            Start Shooting
          </button>
        </div>
      </Card>
    </div>
  );
}
