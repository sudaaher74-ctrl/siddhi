"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import { Target } from "lucide-react";

export const BOW_OPTIONS = ["Recurve Bow", "Compound Bow", "Indian Bow"] as const;
export type BowOption = (typeof BOW_OPTIONS)[number];

export const BOW_DISTANCES: Record<BowOption, string[]> = {
  "Recurve Bow": ["30m", "40m", "50m", "60m", "70m"],
  "Compound Bow": ["30m", "40m", "50m"],
  "Indian Bow": ["20m", "30m", "40m", "50m"],
};

export const DISTANCE_OPTIONS = ["20m", "30m", "40m", "50m", "60m", "70m"];
export const SESSION_TYPES = ["Practice", "Match"];

export type SessionSetupValues = {
  bow: string;
  distance: string;
  type: string;
};

interface SessionSetupProps {
  onStart: (values: SessionSetupValues) => void;
}

export default function SessionSetup({ onStart }: SessionSetupProps) {
  const [bow, setBow] = useState<BowOption>("Recurve Bow");
  const [distance, setDistance] = useState("70m");
  const [type, setType] = useState("Practice");

  const availableDistances = BOW_DISTANCES[bow] || DISTANCE_OPTIONS;

  const handleBowSelect = (selectedBow: BowOption) => {
    setBow(selectedBow);
    const validDistances = BOW_DISTANCES[selectedBow];
    if (validDistances && !validDistances.includes(distance)) {
      if (selectedBow === "Compound Bow") {
        setDistance("50m");
      } else if (selectedBow === "Indian Bow") {
        setDistance("30m");
      } else {
        setDistance("70m");
      }
    }
  };

  const getDistanceGridClass = (count: number) => {
    if (count === 3) return "grid grid-cols-3 gap-2 mb-3";
    if (count === 4) return "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3";
    return "grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3";
  };

  const canStart = bow.length > 0 && distance.length > 0;

  return (
    <div className="max-w-lg mx-auto mt-6">
      <Card>
        <div className="p-2">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-accent" />
            <h2 className="text-[16px] font-bold text-text">Before you shoot</h2>
          </div>
          <p className="text-[13px] text-text-dim mb-5">
            Select your bow and distance. This is saved with your session.
          </p>

          {/* Bow Selection */}
          <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-2">
            Bow
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {BOW_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleBowSelect(b)}
                className={`py-3 px-2 rounded-lg text-[13px] font-semibold transition-all text-center ${
                  bow === b
                    ? "bg-accent text-white shadow-sm"
                    : "bg-black/5 text-text hover:bg-black/10"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Distance Selection */}
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold">
              Distance
            </label>
            <span className="text-[11px] text-text-dim font-medium">
              Available for {bow}
            </span>
          </div>
          <div className={getDistanceGridClass(availableDistances.length)}>
            {availableDistances.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDistance(d)}
                className={`py-3 rounded-lg text-[14px] font-semibold transition-all text-center ${
                  distance === d
                    ? "bg-accent text-white shadow-sm"
                    : "bg-black/5 text-text hover:bg-black/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Session Type */}
          <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-2 mt-4">
            Session Type
          </label>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-3 rounded-lg text-[13px] font-semibold transition-all ${
                  type === t ? "bg-accent text-white shadow-sm" : "bg-black/5 text-text hover:bg-black/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={() => onStart({ bow, distance, type })}
            className="w-full py-3 bg-accent text-white font-semibold text-[14px] rounded-lg transition-opacity disabled:opacity-40 hover:bg-accent/90 cursor-pointer"
          >
            Start Shooting
          </button>
        </div>
      </Card>
    </div>
  );
}
