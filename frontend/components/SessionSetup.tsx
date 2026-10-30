"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import { Target, Calendar, Clock, Sun, Building2, Trophy } from "lucide-react";

export const BOW_OPTIONS = ["Recurve Bow", "Compound Bow", "Indian Bow"] as const;
export type BowOption = (typeof BOW_OPTIONS)[number];

export const MODE_OPTIONS = ["Outdoor", "Indoor"] as const;
export type ModeOption = (typeof MODE_OPTIONS)[number];

export const TITLE_PRESETS = [
  "Practice",
  "State Championship",
  "National Championship",
  "Club Tournament",
  "Selection Trials",
] as const;

export const MODE_BOW_DISTANCES: Record<ModeOption, Record<BowOption, string[]>> = {
  Outdoor: {
    "Recurve Bow": ["30m", "40m", "50m", "60m", "70m"],
    "Compound Bow": ["30m", "40m", "50m"],
    "Indian Bow": ["20m", "30m", "40m", "50m"],
  },
  Indoor: {
    "Recurve Bow": ["18m", "25m", "30m"],
    "Compound Bow": ["18m", "25m"],
    "Indian Bow": ["18m", "20m", "25m"],
  },
};

// Default fallback for outdoor (backwards compatibility)
export const BOW_DISTANCES: Record<BowOption, string[]> = MODE_BOW_DISTANCES.Outdoor;

export const DISTANCE_OPTIONS = ["18m", "20m", "25m", "30m", "40m", "50m", "60m", "70m"];
export const SESSION_TYPES = ["Practice", "Match"];

export const getDefaultDistance = (selectedMode: ModeOption, selectedBow: BowOption): string => {
  if (selectedMode === "Indoor") {
    return "18m";
  }
  if (selectedBow === "Compound Bow") return "50m";
  if (selectedBow === "Indian Bow") return "30m";
  return "70m";
};

export const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeStr = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const formatReadableDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = (timeStr || "12:00").split(":").map(Number);
    const d = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
    const dateFormatted = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return `${dateStr} ${timeStr || ""}`;
  }
};

export type SessionSetupValues = {
  title: string;
  mode: ModeOption;
  bow: string;
  distance: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
};

interface SessionSetupProps {
  onStart: (values: SessionSetupValues) => void;
  initialValues?: Partial<SessionSetupValues>;
}

export default function SessionSetup({ onStart, initialValues }: SessionSetupProps) {
  const [title, setTitle] = useState<string>(initialValues?.title || "Practice");
  const [mode, setMode] = useState<ModeOption>((initialValues?.mode as ModeOption) || "Outdoor");
  const [bow, setBow] = useState<BowOption>((initialValues?.bow as BowOption) || "Recurve Bow");
  const [distance, setDistance] = useState<string>(
    initialValues?.distance || getDefaultDistance(mode, bow)
  );
  const [type, setType] = useState(initialValues?.type || "Practice");
  const [date, setDate] = useState<string>(initialValues?.date || getTodayDateStr());
  const [time, setTime] = useState<string>(initialValues?.time || getCurrentTimeStr());

  const availableDistances =
    MODE_BOW_DISTANCES[mode]?.[bow] ||
    BOW_DISTANCES[bow] ||
    DISTANCE_OPTIONS;

  const handleModeSelect = (selectedMode: ModeOption) => {
    setMode(selectedMode);
    const validDistances = MODE_BOW_DISTANCES[selectedMode]?.[bow] || [];
    if (!validDistances.includes(distance)) {
      setDistance(getDefaultDistance(selectedMode, bow));
    }
  };

  const handleBowSelect = (selectedBow: BowOption) => {
    setBow(selectedBow);
    const validDistances = MODE_BOW_DISTANCES[mode]?.[selectedBow] || [];
    if (!validDistances.includes(distance)) {
      setDistance(getDefaultDistance(mode, selectedBow));
    }
  };

  const handlePresetTitleClick = (preset: string) => {
    setTitle(preset);
    if (preset.toLowerCase().includes("practice")) {
      setType("Practice");
    } else {
      setType("Match");
    }
  };

  const handleSetToNow = () => {
    setDate(getTodayDateStr());
    setTime(getCurrentTimeStr());
  };

  const getDistanceGridClass = (count: number) => {
    if (count <= 2) return "grid grid-cols-2 gap-2 mb-3";
    if (count === 3) return "grid grid-cols-3 gap-2 mb-3";
    if (count === 4) return "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3";
    return "grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3";
  };

  const effectiveTitle = title.trim() || "Practice";
  const canStart = bow.length > 0 && distance.length > 0 && date.length > 0 && time.length > 0;

  return (
    <div className="max-w-lg mx-auto mt-4 sm:mt-6">
      <Card>
        <div className="p-2 sm:p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-accent" />
            <h2 className="text-[16px] font-bold text-text">Before you shoot</h2>
          </div>
          <p className="text-[13px] text-text-dim mb-5">
            Select your session title, mode, bow, distance, date and timing. This is saved with your official session and PDF scorecard.
          </p>

          {/* Session Title / Event */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span>Session Title / Event</span>
              </label>
              <span className="text-[11px] text-text-dim font-medium">
                Custom or Preset
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Practice, State Championship, National Championship..."
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-black/5 hover:bg-black/10 focus:bg-white border border-black/10 focus:border-accent rounded-lg text-[13px] font-semibold text-text outline-none transition-all placeholder:text-text-dim/60 placeholder:font-normal"
            />
            {/* Quick Title Presets */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {TITLE_PRESETS.map((p) => {
                const isActive = title.trim().toLowerCase() === p.toLowerCase();
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetTitleClick(p)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                      isActive
                        ? "bg-accent/15 text-accent border-accent/40 font-bold shadow-2xs"
                        : "bg-black/5 text-text-dim border-transparent hover:bg-black/10 hover:text-text"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selection (Outdoor / Indoor) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold">
                Mode
              </label>
              <span className="text-[11px] text-text-dim font-medium">
                {mode === "Outdoor" ? "Outdoor Field (World Archery)" : "Indoor Hall (18m / 25m WA)"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODE_OPTIONS.map((m) => {
                const isSelected = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeSelect(m)}
                    className={`py-3 px-3 rounded-lg text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-accent text-white shadow-sm"
                        : "bg-black/5 text-text hover:bg-black/10"
                    }`}
                  >
                    {m === "Outdoor" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
                className={`py-3 px-2 rounded-lg text-[13px] font-semibold transition-all text-center cursor-pointer ${
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
              Available for {bow} ({mode})
            </span>
          </div>
          <div className={getDistanceGridClass(availableDistances.length)}>
            {availableDistances.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDistance(d)}
                className={`py-3 rounded-lg text-[14px] font-semibold transition-all text-center cursor-pointer ${
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
          <div className="grid grid-cols-2 gap-2 mb-4">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-3 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  type === t ? "bg-accent text-white shadow-sm" : "bg-black/5 text-text hover:bg-black/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Date & Timing Section */}
          <div className="mb-6 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>Date & Timing</span>
              </label>
              <button
                type="button"
                onClick={handleSetToNow}
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                title="Reset to current local date and time"
              >
                <Clock className="w-3 h-3" />
                <span>Set to Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Date Input */}
              <div>
                <label className="block text-[10px] text-text-dim font-medium mb-1">
                  Session Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/5 hover:bg-black/10 focus:bg-white border border-black/10 focus:border-accent rounded-lg text-[13px] font-medium text-text outline-none transition-all cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-[10px] text-text-dim font-medium mb-1">
                  Session Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/5 hover:bg-black/10 focus:bg-white border border-black/10 focus:border-accent rounded-lg text-[13px] font-medium text-text outline-none transition-all cursor-pointer"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Formatted Preview Summary Badge */}
            {date && time && (
              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <Target className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span>{effectiveTitle}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {mode}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>{bow} at {distance}</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold whitespace-nowrap">
                    Official Round
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] flex-wrap gap-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatReadableDateTime(date, time)}</span>
                  </span>
                  <span className="text-emerald-700 font-medium">Included on Scorecard & PDF</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={() =>
              onStart({
                title: effectiveTitle,
                mode,
                bow,
                distance,
                type,
                date,
                time,
              })
            }
            className="w-full py-3 bg-accent text-white font-semibold text-[14px] rounded-lg transition-opacity disabled:opacity-40 hover:bg-accent/90 cursor-pointer shadow-sm active:scale-98"
          >
            Start Shooting
          </button>
        </div>
      </Card>
    </div>
  );
}
