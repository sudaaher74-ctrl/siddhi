"use client";

import React, { useState, useEffect } from "react";
import { apiPost } from "@/lib/api";
import { Session } from "@/lib/data";
import { Award, Check, Undo2, ChevronRight, Target, Hash, Clock, Calendar, Download } from "lucide-react";
import ScorePad from "./ScorePad";
import ArrowPlot from "./ArrowPlot";
import ArcheryTimer from "./ArcheryTimer";
import SessionSetup, {
  SessionSetupValues,
  formatReadableDateTime,
  getTodayDateStr,
  getCurrentTimeStr,
} from "./SessionSetup";
import ScorecardModal from "./ScorecardModal";
import { exportScorecardPDF } from "@/lib/pdfExport";

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
  const [previousSetup, setPreviousSetup] = useState<SessionSetupValues | null>(null);
  const [showScorecardPreview, setShowScorecardPreview] = useState(false);

  const getSessionDateTime = (setupVals: SessionSetupValues | null): Date => {
    if (!setupVals?.date) return new Date();
    try {
      const [year, month, day] = setupVals.date.split("-").map(Number);
      const [hours, minutes] = (setupVals.time || "12:00").split(":").map(Number);
      return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);
    } catch {
      return new Date();
    }
  };

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("archerx_live_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.ends) && parsed.ends.length > 0) {
          if (parsed.setup) {
            const restoredSetup: SessionSetupValues = {
              ...parsed.setup,
              title: parsed.setup.title || parsed.title || "Practice",
              mode: parsed.setup.mode || parsed.mode || "Outdoor",
              date: parsed.setup.date || parsed.date || getTodayDateStr(),
              time: parsed.setup.time || parsed.time || getCurrentTimeStr(),
            };
            setSetup(restoredSetup);
            setPreviousSetup(restoredSetup);
          }
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
            title: setup.title,
            mode: setup.mode,
            distance: setup.distance,
            bow: setup.bow,
            date: setup.date || getTodayDateStr(),
            time: setup.time || getCurrentTimeStr(),
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
      
      const sessionDate = getSessionDateTime(setup);
      const sessionIsoString = sessionDate.toISOString();
      const formattedDateForName = sessionDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const distance = setup?.distance || "70m";
      const bow = setup?.bow || "Recurve Bow";
      const sessionTitle = setup?.title?.trim() || `${bow ? `${bow} ` : ""}${distance ? `${distance} ` : ""}${setup?.type || "Practice"} - ${formattedDateForName}`;
      const payload = {
        name: sessionTitle,
        type: setup?.type || "Practice",
        distance,
        bow,
        mode: setup?.mode || "Outdoor",
        environment: setup?.mode || "Outdoor",
        arrows: allArrows.length,
        score: calculatedTotal,
        avg: Number(average),
        tens: tensCount,
        note: `Logged via Interactive Score Pad (${setup?.mode || "Outdoor"} • ${bow} at ${distance})`,
        arrowData: JSON.stringify(savedEnds),
        createdAt: sessionIsoString,
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

  const handleDownloadPDFDirect = () => {
    const sessionDate = getSessionDateTime(setup);
    const formattedDate = sessionDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = sessionDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const safeEnds = ends.slice(0, 6);
    const endTotals = safeEnds.map(end => end.reduce((sum, a) => sum + calculateValue(a.score), 0));
    const runningTotals: number[] = [];
    let rSum = 0;
    endTotals.forEach(t => {
      rSum += t;
      runningTotals.push(rSum);
    });

    const flatArrows = ends.flat();
    const tensCount = flatArrows.filter(a => a.score === "10" || a.score === "X").length;
    const xsCount = flatArrows.filter(a => a.score === "X").length;
    const ninesCount = flatArrows.filter(a => a.score === "9").length;
    const totalArrowsCount = flatArrows.length > 0 ? flatArrows.length : 36;
    const maxScore = totalArrowsCount * 10;

    exportScorecardPDF({
      athleteName: "Athlete",
      selectedBow: setup?.bow || "Recurve Bow",
      distance: setup?.distance || "70m",
      formattedDate,
      formattedTime,
      eventName: setup?.title?.trim() || `${setup?.distance || "70m"} ${setup?.bow || "Recurve"}`,
      venueName: `${setup?.mode || "Outdoor"} Range (${setup?.bow} at ${setup?.distance})`,
      standardName: setup?.mode === "Indoor" ? "World Archery Indoor Standard" : "World Archery Recognized Standard",
      round1Total: totalScore,
      maxPossibleScore: maxScore,
      scorePercentage: maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : "0.0",
      averagePerArrow: flatArrows.length > 0 ? (totalScore / flatArrows.length).toFixed(2) : "0.00",
      tensDisplay: tensCount,
      xsDisplay: xsCount,
      ninesDisplay: ninesCount,
      totalArrowsCount,
      ends: safeEnds.map(end => end.map(a => a.score)),
      endTotals,
      runningTotals,
      sessionNote: `Logged via Score Entry (${setup?.mode || "Outdoor"} • ${setup?.bow} at ${setup?.distance}): ${formattedDate} at ${formattedTime}`,
      session: liveSessionPreview,
    });
  };

  const [mobileMode, setMobileMode] = useState<"target" | "keypad" | "timer">("target");

  if (!setup) {
    return (
      <SessionSetup
        onStart={(values) => {
          setSetup(values);
          setPreviousSetup(values);
        }}
        initialValues={previousSetup || undefined}
      />
    );
  }

  const sessionDate = getSessionDateTime(setup);
  const sessionIsoString = sessionDate.toISOString();

  const liveSessionPreview: Session = {
    name: setup?.title?.trim() || `${setup?.bow ? `${setup.bow} ` : ""}${setup?.distance ? `${setup.distance} ` : ""}${setup?.type || "Practice"} - ${sessionDate.toLocaleDateString()}`,
    type: setup?.type || "Practice",
    distance: setup?.distance || "70m",
    bow: setup?.bow,
    mode: setup?.mode || "Outdoor",
    environment: setup?.mode || "Outdoor",
    arrows: ends.flat().length,
    score: totalScore,
    avg: Number(ends.flat().length > 0 ? (totalScore / ends.flat().length).toFixed(2) : 0),
    tens: ends.flat().filter(a => a.score === "10" || a.score === "X").length,
    note: `Logged via Interactive Score Pad (${setup?.mode || "Outdoor"} • ${setup?.bow || "Recurve"} at ${setup?.distance || "70m"})`,
    arrowData: JSON.stringify(ends.filter(e => Array.isArray(e) && e.length > 0)),
    createdAt: sessionIsoString,
  };

  // Helper for arrow zone styling in Mobile HUD
  const getArrowBadgeClass = (score: ScoreValue) => {
    if (score === "X" || score === "10" || score === "9") return "bg-[#FEF08A] text-[#854D0E] border-amber-400 shadow-xs";
    if (score === "8" || score === "7") return "bg-[#FECACA] text-[#991B1B] border-rose-300 shadow-xs";
    if (score === "6" || score === "5") return "bg-[#BAE6FD] text-[#075985] border-sky-300 shadow-xs";
    if (score === "4" || score === "3") return "bg-[#334155] text-white border-slate-700 shadow-xs";
    if (score === "2" || score === "1") return "bg-white text-slate-900 border-slate-300 shadow-xs";
    return "bg-slate-200 text-slate-600 border-slate-300 shadow-xs";
  };

  return (
    <>
    {/* Setup Tags & Action Bar */}
    <div className="flex items-center gap-1.5 sm:gap-2.5 mt-1 sm:mt-4 flex-wrap">
      {setup.title && (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent text-white text-[11px] sm:text-[13px] font-bold shadow-2xs">
          {setup.title}
        </span>
      )}
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] sm:text-[13px] font-semibold">
        {setup.mode || "Outdoor"}
      </span>
      {setup.bow && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] sm:text-[13px] font-semibold border border-slate-200">
          {setup.bow}
        </span>
      )}
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] sm:text-[13px] font-bold">
        {setup.distance}
      </span>
      <span className="text-[11px] sm:text-[13px] text-text-dim font-medium">{setup.type}</span>
      
      {/* Session Date & Time Tag */}
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] sm:text-[13px] font-medium border border-slate-200">
        <Calendar className="w-3 h-3 text-slate-400" />
        <span>{formatReadableDateTime(setup.date, setup.time)}</span>
      </span>
      
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {ends.flat().length > 0 && (
          <button
            type="button"
            onClick={handleSaveSession}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-[12px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Save this round to your official scorecard database"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : `Save (${totalScore} pts)`}</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleDownloadPDFDirect}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-[12px] font-bold shadow-xs border border-slate-200 transition-all cursor-pointer"
          title="Download PDF Scorecard with chosen date and timing"
        >
          <Download className="w-3.5 h-3.5 text-accent" />
          <span className="hidden xs:inline">PDF</span>
        </button>
        <button
          type="button"
          onClick={() => setShowScorecardPreview(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0c1e38] text-white text-[11px] sm:text-[12px] font-bold shadow-xs hover:bg-[#152e50] transition-all cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xs:inline">Scorecard</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (ends.flat().length > 0 && !confirm("Change setup? Unsaved arrows from this round will be cleared.")) return;
            try { localStorage.removeItem("archerx_live_draft"); } catch {}
            setEnds(Array(6).fill([]));
            setCurrentEndIndex(0);
            setPreviousSetup(setup);
            setSetup(null);
          }}
          className="text-[11px] sm:text-[12px] text-text-dim underline hover:text-text cursor-pointer"
        >
          Setup
        </button>
      </div>
    </div>

    {/* Round Complete Banner */}
    {isSessionComplete && (
      <div className="mt-3 p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-950">
              {setup.title ? `${setup.title} Completed!` : "Session Completed!"} (6 Ends • {totalScore} pts)
            </div>
            <div className="text-xs text-emerald-700 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="font-semibold">{setup.mode || "Outdoor"}</span>
              <span>•</span>
              <span>{setup.bow} at {setup.distance}</span>
              <span>•</span>
              <Calendar className="w-3 h-3 text-emerald-600" />
              <span>{formatReadableDateTime(setup.date, setup.time)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadPDFDirect}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0c1e38] hover:bg-[#152e50] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSession}
            disabled={isSaving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Session"}</span>
          </button>
        </div>
      </div>
    )}

    {/* MOBILE-ONLY: Sticky Live Scoring HUD & Mode Tabs */}
    <div className="lg:hidden flex flex-col gap-2 mt-2">
      {/* Sticky Live HUD */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
              {isSessionComplete ? "Complete" : `End ${currentEndIndex + 1} / 6`}
            </span>
            <span className="text-[12px] font-bold text-slate-700">
              {currentEndScore} <span className="text-[10px] text-slate-400 font-normal">pts</span>
            </span>
          </div>
          <div className="text-[13px] font-bold font-mono text-accent">
            Total: {totalScore} <span className="text-[10px] text-slate-400 font-sans font-normal">pts</span>
          </div>
        </div>

        {/* 6 Arrow Pills (Always Visible, One-Tap Edit) */}
        <div className="flex items-center justify-between gap-1 mb-2.5">
          {Array.from({ length: 6 }).map((_, i) => {
            const arrow = currentArrows[i];
            const isTenOrX = arrow && (arrow.score === "10" || arrow.score === "X");
            return (
              <button
                key={i}
                type="button"
                disabled={!arrow}
                onClick={() => {
                  if (arrow && isTenOrX) {
                    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
                    handleUpdateArrowScore(i, arrow.score === "10" ? "X" : "10");
                  }
                }}
                className={`flex-1 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm border transition-all ${
                  arrow
                    ? `${getArrowBadgeClass(arrow.score)} ${isTenOrX ? "cursor-pointer ring-1 ring-amber-400" : ""}`
                    : "border-dashed border-slate-300 text-slate-300 bg-slate-50"
                }`}
              >
                {arrow ? arrow.score : "-"}
              </button>
            );
          })}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={currentArrows.length === 0 || isSessionComplete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Undo last arrow"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({currentArrows.length}/6)</span>
          </button>

          {!isSessionComplete && (
            <button
              type="button"
              onClick={handleSubmitEnd}
              disabled={currentArrows.length < 6}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                currentArrows.length === 6
                  ? "bg-slate-900 text-white shadow-sm active:scale-95"
                  : "bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed"
              }`}
            >
              <span>{currentArrows.length === 6 ? `Submit End ${currentEndIndex + 1}` : `Shoot ${6 - currentArrows.length} more`}</span>
              {currentArrows.length === 6 && <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {isSessionComplete && (
            <button
              type="button"
              onClick={handleSaveSession}
              disabled={isSaving}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm active:scale-95"
            >
              {isSaving ? "Saving..." : "Save Round to Scorecard"}
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Segmented Control */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            setMobileMode("target");
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
            mobileMode === "target"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Target className="w-3.5 h-3.5 text-accent" />
          <span>Target Face</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileMode("keypad");
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
            mobileMode === "keypad"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-amber-500" />
          <span>Keypad</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileMode("timer");
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
            mobileMode === "timer"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span>Timer</span>
        </button>
      </div>

      {/* Mobile Active Mode Content */}
      <div className="mt-1">
        {mobileMode === "target" && (
          <ArrowPlot 
            currentArrows={currentArrows}
            handleScoreInput={handleScoreInput}
            handleUndo={handleUndo}
            isSessionComplete={isSessionComplete}
            bowType={setup?.bow}
          />
        )}
        {mobileMode === "keypad" && (
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
            bowType={setup?.bow}
          />
        )}
        {mobileMode === "timer" && (
          <ArcheryTimer resetCount={timerResetCount} />
        )}
      </div>
    </div>

    {/* DESKTOP-ONLY Layout (Side-by-side on lg: screens) */}
    <div className="hidden lg:grid lg:grid-cols-[1fr_1.5fr] gap-[14px] mt-4">
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
          bowType={setup?.bow}
        />
      </div>
      <div>
        <ArrowPlot 
          currentArrows={currentArrows}
          handleScoreInput={handleScoreInput}
          handleUndo={handleUndo}
          isSessionComplete={isSessionComplete}
          bowType={setup?.bow}
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
