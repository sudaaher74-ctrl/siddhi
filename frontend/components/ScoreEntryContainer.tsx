"use client";

import React, { useState, useEffect } from "react";
import { apiPost } from "@/lib/api";
import { Session } from "@/lib/data";
import { Award, Check } from "lucide-react";
import ScorePad from "./ScorePad";
import ArrowPlot from "./ArrowPlot";
import ArcheryTimer from "./ArcheryTimer";
import SessionSetup, { SessionSetupValues } from "./SessionSetup";
import ScorecardModal from "./ScorecardModal";

export type ScoreValue = "X" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2" | "1" | "M";

export type ArrowShot = {
  score: ScoreValue;
  cx: number | null;
  cy: number | null;
};

export default function ScoreEntryContainer() {
  const [ends, setEnds] = useState<ArrowShot[][]>(Array(6).fill([]));
  const [currentEndIndex, setCurrentEndIndex] = useState(0);
  const [timerResetCount, setTimerResetCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Null until the archer has picked a distance — scoring is blocked before that
  const [setup, setSetup] = useState<SessionSetupValues | null>(null);
  const [showScorecardPreview, setShowScorecardPreview] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("archerx_live_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.ends) && parsed.ends.length > 0) {
          if (parsed.setup) setSetup(parsed.setup);
          setEnds(parsed.ends);
          if (typeof parsed.currentEndIndex === "number") {
            setCurrentEndIndex(parsed.currentEndIndex);
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore draft session", e);
    }
  }, []);

  const currentArrows = ends[currentEndIndex] || [];
  const isSessionComplete = currentEndIndex >= 6;

  const calculateValue = (s: ScoreValue): number => {
    if (s === "X") return 10;
    if (s === "M") return 0;
    return parseInt(s, 10);
  };

  const currentEndScore = currentArrows.reduce((sum, arrow) => sum + calculateValue(arrow.score), 0);
  const totalScore = ends.flat().reduce((sum, arrow) => sum + calculateValue(arrow.score), 0);

  // Save live session draft to localStorage on every change
  useEffect(() => {
    try {
      const allArrowsCount = ends.flat().length;
      if (allArrowsCount > 0 && setup) {
        localStorage.setItem(
          "archerx_live_draft",
          JSON.stringify({
            setup,
            ends,
            currentEndIndex,
            totalScore,
            arrows: allArrowsCount,
            distance: setup.distance,
            bow: setup.bow,
            date: new Date().toLocaleDateString(),
          })
        );
      }
    } catch (e) {
      console.error("Failed to persist draft session", e);
    }
  }, [ends, currentEndIndex, setup, totalScore]);

  const handleScoreInput = (score: ScoreValue, cx: number | null = null, cy: number | null = null) => {
    if (isSessionComplete) return;
    if (currentArrows.length < 6) {
      const newEnds = [...ends];
      newEnds[currentEndIndex] = [...currentArrows, { score, cx, cy }];
      setEnds(newEnds);
    }
  };

  const handleUndo = () => {
    if (isSessionComplete) return;
    if (currentArrows.length > 0) {
      const newEnds = [...ends];
      newEnds[currentEndIndex] = currentArrows.slice(0, -1);
      setEnds(newEnds);
    }
  };

  const handleUpdateArrowScore = (index: number, newScore: ScoreValue) => {
    if (isSessionComplete) return;
    if (index >= 0 && index < currentArrows.length) {
      const newEnds = [...ends];
      const updatedEnd = [...currentArrows];
      updatedEnd[index] = { ...currentArrows[index], score: newScore };
      newEnds[currentEndIndex] = updatedEnd;
      setEnds(newEnds);
    }
  };

  const handleSubmitEnd = () => {
    if (isSessionComplete) return;
    if (currentArrows.length === 6) {
      setCurrentEndIndex((prev) => prev + 1);
      setTimerResetCount((prev) => prev + 1);
    }
  };

  const handleSaveSession = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Build effective ends: all submitted non-empty ends
      const savedEnds: ArrowShot[][] = ends.filter(e => Array.isArray(e) && e.length > 0);
      const allArrows = savedEnds.flat();

      if (allArrows.length === 0) {
        alert("Please enter at least 1 arrow before saving.");
        setIsSaving(false);
        return;
      }

      const tensCount = allArrows.filter(a => a.score === "10" || a.score === "X").length;
      const calculatedTotal = allArrows.reduce((sum, a) => sum + calculateValue(a.score), 0);
      const average = (calculatedTotal / allArrows.length).toFixed(2);
      
      const distance = setup?.distance || "70m";
      const bow = setup?.bow || "Recurve Bow";
      const payload = {
        name: `${bow ? `${bow} ` : ""}${distance ? `${distance} ` : ""}${setup?.type || "Practice"} - ${new Date().toLocaleDateString()}`,
        type: setup?.type || "Practice",
        distance,
        bow,
        arrows: allArrows.length,
        score: calculatedTotal,
        avg: Number(average),
        tens: tensCount,
        note: `Logged via Interactive Score Pad (${bow} at ${distance})`,
        arrowData: JSON.stringify(savedEnds)
      };

      const saved = await apiPost<Session>("/api/sessions", payload);

      try {
        localStorage.removeItem("archerx_live_draft");
      } catch {}

      if (saved && (saved._id || saved.id)) {
        window.location.href = `/scorecard/${saved._id || saved.id}`;
      } else {
        window.location.href = "/scorecard";
      }
    } catch (err) {
      console.error("Failed to save session:", err);
      alert(`Failed to save session: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!setup) {
    return <SessionSetup onStart={setSetup} />;
  }

  const liveSessionPreview: Session = {
    name: `${setup?.bow ? `${setup.bow} ` : ""}${setup?.distance ? `${setup.distance} ` : ""}${setup?.type || "Practice"} - ${new Date().toLocaleDateString()}`,
    type: setup?.type || "Practice",
    distance: setup?.distance || "70m",
    bow: setup?.bow,
    arrows: ends.flat().length,
    score: totalScore,
    avg: Number(ends.flat().length > 0 ? (totalScore / ends.flat().length).toFixed(2) : 0),
    tens: ends.flat().filter(a => a.score === "10" || a.score === "X").length,
    note: `Logged via Interactive Score Pad${setup?.bow ? ` (${setup.bow})` : ""}${setup?.distance ? ` at ${setup.distance}` : ""}`,
    arrowData: JSON.stringify(ends.filter(e => Array.isArray(e) && e.length > 0)),
  };

  return (
    <>
    <div className="flex items-center gap-2 sm:gap-3 mt-4 flex-wrap">
      {setup.bow && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-900 text-white text-[12px] sm:text-[13px] font-semibold">
          {setup.bow}
        </span>
      )}
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[12px] sm:text-[13px] font-bold">
        {setup.distance}
      </span>
      <span className="text-[12px] sm:text-[13px] text-text-dim font-medium">{setup.type}</span>
      
      <div className="ml-auto flex items-center gap-2 flex-wrap">
        {ends.flat().length > 0 && (
          <button
            type="button"
            onClick={handleSaveSession}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Save this round to your official scorecard database"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : `Save Session (${totalScore} pts)`}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowScorecardPreview(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1e38] text-white text-[12px] font-bold shadow-sm hover:bg-[#152e50] transition-all cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>View Scorecard</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (ends.flat().length > 0 && !confirm("Change setup? Unsaved arrows from this round will be cleared.")) return;
            try { localStorage.removeItem("archerx_live_draft"); } catch {}
            setEnds(Array(6).fill([]));
            setCurrentEndIndex(0);
            setSetup(null);
          }}
          className="text-[12px] text-text-dim underline hover:text-text cursor-pointer"
        >
          Change setup
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[12px] mt-4">
      <div>
        <ScorePad 
          currentArrows={currentArrows}
          currentEndIndex={currentEndIndex}
          isSessionComplete={isSessionComplete}
          handleScoreInput={handleScoreInput}
          handleUpdateArrowScore={handleUpdateArrowScore}
          handleUndo={handleUndo}
          handleSubmitEnd={handleSubmitEnd}
          handleSaveSession={handleSaveSession}
          isSaving={isSaving}
          currentEndScore={currentEndScore}
          totalScore={totalScore}
        />
      </div>
      <div>
        <ArrowPlot 
          currentArrows={currentArrows}
          handleScoreInput={handleScoreInput}
          handleUndo={handleUndo}
          isSessionComplete={isSessionComplete}
        />
        <div className="mt-4">
          <ArcheryTimer resetCount={timerResetCount} />
        </div>
      </div>
    </div>

    {/* Live Scorecard Modal */}
    <ScorecardModal
      session={liveSessionPreview}
      isOpen={showScorecardPreview}
      onClose={() => setShowScorecardPreview(false)}
      onSave={handleSaveSession}
      isLivePreview={true}
      isSaving={isSaving}
    />
    </>
  );
}
