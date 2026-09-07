"use client";

import React, { useState } from "react";
import { apiPost } from "@/lib/api";
import { Session } from "@/lib/data";
import { Award } from "lucide-react";
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

  const currentArrows = ends[currentEndIndex] || [];
  const isSessionComplete = currentEndIndex >= 6;

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

  const calculateValue = (s: ScoreValue): number => {
    if (s === "X") return 10;
    if (s === "M") return 0;
    return parseInt(s, 10);
  };

  const currentEndScore = currentArrows.reduce((sum, arrow) => sum + calculateValue(arrow.score), 0);
  const totalScore = ends.flat().reduce((sum, arrow) => sum + calculateValue(arrow.score), 0);

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      const allArrows = ends.flat();
      const tensCount = allArrows.filter(a => a.score === "10" || a.score === "X").length;
      const average = allArrows.length > 0 ? (totalScore / allArrows.length).toFixed(2) : "0.00";
      
      const distance = setup?.distance || "";
      const payload = {
        name: `${distance ? `${distance} ` : ""}${setup?.type || "Practice"} - ${new Date().toLocaleDateString()}`,
        type: setup?.type || "Practice",
        distance,
        arrows: allArrows.length,
        score: totalScore,
        avg: Number(average),
        tens: tensCount,
        note: `Logged via Interactive Score Pad${distance ? ` at ${distance}` : ""}`,
        arrowData: JSON.stringify(ends)
      };

      const saved = await apiPost<Session>("/api/sessions", payload);

      if (saved && (saved._id || saved.id)) {
        window.location.href = `/scorecard/${saved._id || saved.id}`;
      } else {
        window.location.href = "/practice";
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to save session: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!setup) {
    return <SessionSetup onStart={setSetup} />;
  }

  const liveSessionPreview: Session = {
    name: `${setup?.distance ? `${setup.distance} ` : ""}${setup?.type || "Practice"} - ${new Date().toLocaleDateString()}`,
    type: setup?.type || "Practice",
    distance: setup?.distance || "50m",
    arrows: ends.flat().length || 36,
    score: totalScore,
    avg: Number(ends.flat().length > 0 ? (totalScore / ends.flat().length).toFixed(2) : 0),
    tens: ends.flat().filter(a => a.score === "10" || a.score === "X").length,
    note: `Logged via Interactive Score Pad${setup?.distance ? ` at ${setup.distance}` : ""}`,
    arrowData: JSON.stringify(ends),
  };

  return (
    <>
    <div className="flex items-center gap-3 mt-4">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[13px] font-bold">
        {setup.distance}
      </span>
      <span className="text-[13px] text-text-dim">{setup.type}</span>
      
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowScorecardPreview(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1e38] text-white text-[12px] font-bold shadow-sm hover:bg-[#152e50] transition-all"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>View Scorecard</span>
        </button>
        <button
          type="button"
          onClick={() => setSetup(null)}
          className="text-[12px] text-text-dim underline hover:text-text"
        >
          Change target
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
    />
    </>
  );
}
