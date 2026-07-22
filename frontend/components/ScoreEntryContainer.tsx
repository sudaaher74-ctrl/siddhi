"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ScorePad from "./ScorePad";
import ArrowPlot from "./ArrowPlot";
import ArcheryTimer from "./ArcheryTimer";

export type ScoreValue = "X" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2" | "1" | "M";

export type ArrowShot = {
  score: ScoreValue;
  cx: number | null;
  cy: number | null;
};

export default function ScoreEntryContainer() {
  const router = useRouter();
  const [ends, setEnds] = useState<ArrowShot[][]>(Array(6).fill([]));
  const [currentEndIndex, setCurrentEndIndex] = useState(0);
  const [timerResetCount, setTimerResetCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

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
      
      const payload = {
        name: `Practice Session - ${new Date().toLocaleDateString()}`,
        type: "Practice",
        arrows: allArrows.length.toString(),
        score: totalScore.toString(),
        avg: average,
        tens: tensCount.toString(),
        note: "Logged via Interactive Score Pad",
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save session");
      
      router.push("/practice");
    } catch (err) {
      console.error(err);
      alert("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[12px] mt-4">
      <div>
        <ScorePad 
          currentArrows={currentArrows}
          currentEndIndex={currentEndIndex}
          isSessionComplete={isSessionComplete}
          handleScoreInput={handleScoreInput}
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
  );
}
