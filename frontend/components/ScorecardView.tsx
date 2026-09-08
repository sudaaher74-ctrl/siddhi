"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Share2,
  Printer,
  Copy,
  Check,
  Award,
  Target,
  ArrowLeft,
  Trash2,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Session } from "@/lib/data";
import { useUser } from "@/hooks/useUser";
import EditScoresModal from "./EditScoresModal";
import { apiDelete } from "@/lib/api";
import Card from "./ui/Card";

interface ScorecardViewProps {
  session?: Session;
  onBack?: () => void;
}

// Fallback demo session
const DEFAULT_DEMO_SESSION: Session = {
  name: "50m Recurve Training",
  type: "Scoring",
  distance: "50m",
  arrows: 36,
  score: 329,
  avg: 9.14,
  tens: 17,
  note: "World Archery Training Log",
  createdAt: "2026-09-07T12:00:00.000Z",
};

// Default ends matching the reference log
const DEFAULT_MOCK_ENDS: string[][] = [
  ["9", "10", "9", "8", "10", "9"],
  ["10", "9", "9", "9", "8", "10"],
  ["9", "9", "10", "8", "9", "9"],
  ["10", "8", "9", "9", "9", "10"],
  ["9", "10", "8", "9", "10", "9"],
  ["10", "9", "9", "10", "8", "9"],
];

const parseArrowPoints = (val: string): number => {
  if (val === "X" || val === "10") return 10;
  if (val === "M" || val === "-" || !val) return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

// Target Face color badge styles matching ArcherX design tokens
const getArrowBadgeClass = (score: string) => {
  if (score === "X" || score === "10") {
    return "bg-[#FFD700]/20 text-[#B45309] border border-[#FFD700]/50 font-bold";
  }
  if (score === "9") {
    return "bg-[#FFD700]/15 text-[#B45309] border border-[#FFD700]/30 font-semibold";
  }
  if (score === "8" || score === "7") {
    return "bg-[#E53935]/15 text-[#C62828] border border-[#E53935]/30 font-semibold";
  }
  if (score === "6" || score === "5") {
    return "bg-[#4FC3F7]/20 text-[#0284C7] border border-[#4FC3F7]/30 font-semibold";
  }
  if (score === "4" || score === "3") {
    return "bg-slate-800 text-white font-semibold";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200 font-semibold";
};

export default function ScorecardView({
  session: initialSession,
  onBack,
}: ScorecardViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const [session, setSession] = useState<Session>(initialSession || DEFAULT_DEMO_SESSION);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Parse ends data
  const [ends, setEnds] = useState<string[][]>(() => {
    if (session.arrowData) {
      try {
        const parsed = JSON.parse(session.arrowData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((endItem: unknown) => {
            if (Array.isArray(endItem)) {
              return endItem.map((a: unknown) => {
                if (typeof a === "object" && a !== null && "score" in a) {
                  return String((a as { score: unknown }).score);
                }
                return String(a);
              });
            }
            return [];
          });
        }
      } catch (e) {
        console.warn("Could not parse arrowData, using defaults:", e);
      }
    }
    return DEFAULT_MOCK_ENDS;
  });

  // Calculate totals
  const endTotals = ends.map((end) =>
    end.reduce((sum, arrow) => sum + parseArrowPoints(arrow), 0)
  );

  let runTotal = 0;
  const runningTotals = endTotals.map((tot) => {
    runTotal += tot;
    return runTotal;
  });

  const round1Total = runningTotals[runningTotals.length - 1] || Number(session.score) || 329;
  const allArrows = ends.flat();

  const computedTens = allArrows.filter((a) => a === "10" || a === "X").length;
  const computedXs = allArrows.filter((a) => a === "X").length;
  const tensDisplay = computedTens > 0 ? computedTens : Number(session.tens) || 17;
  const xsDisplay = computedXs > 0 ? computedXs : 2;

  const athleteName = user?.name || "Sudarshan Aher";
  const userInitials = athleteName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const eventDistance = session.distance || "50m";
  const eventBow = session.bow || (session.name?.toLowerCase().includes("compound") ? "Compound Bow" : session.name?.toLowerCase().includes("indian") ? "Indian Bow" : "Recurve Bow");
  const eventName = `${eventDistance} ${eventBow.replace(/ Bow$/, "")}`;

  const sessionDate = session.createdAt ? new Date(session.createdAt) : new Date();
  const formattedDate = sessionDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const venueName = session.note || "World Archery Training Log";

  const getCoachInsight = (score: number, tens: number) => {
    if (score >= 335) return `Exceptional grouping with ${tens} tens! Outstanding round.`;
    if (score >= 320) return "Consistent shooting! Keep up the focus.";
    if (score >= 300) return "Solid rhythm. Work on clean finger releases in the middle ends.";
    return "Great effort! Focus on anchor point stability and follow-through.";
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareText = `🎯 ArcherX Scorecard - ${athleteName} (${eventName})\nDate: ${formattedDate}\nScore: ${round1Total} / 360\n10s: ${tensDisplay} | Xs: ${xsDisplay}\nVenue: ${venueName}`;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athleteName}'s ArcherX Scorecard`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to modal
      }
    }
    setIsShareModalOpen(true);
  };

  const handleCopyLink = () => {
    const shareText = `🎯 ArcherX Scorecard - ${athleteName} (${eventName})\nDate: ${formattedDate}\nScore: ${round1Total} / 360\n10s: ${tensDisplay} | Xs: ${xsDisplay}\n${typeof window !== "undefined" ? window.location.href : ""}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const sessionId = session.id || session._id;
    if (!sessionId) {
      alert("Demo session cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this scorecard session?")) return;

    setIsDeleting(true);
    try {
      await apiDelete(`/api/sessions/${sessionId}`);
      if (onBack) {
        onBack();
      } else {
        router.push("/practice");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete session.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={printRef} className="w-full flex flex-col gap-5 print:p-0">
      {/* 1. ATHLETE & SESSION HERO CARD */}
      <Card className="p-5 sm:p-6 relative overflow-hidden bg-white border border-slate-200/80 shadow-sm print:border-none print:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Athlete Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {athleteName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
                  Official Scorecard
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {session.type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 mt-1 flex-wrap font-medium">
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  {eventName}
                </span>
                <span>•</span>
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="text-slate-500 truncate max-w-[240px]" title={venueName}>
                  {venueName}
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap print:hidden">
            {onBack && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Scores</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {(session.id || session._id) && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                title="Delete Session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 2. KPI SUMMARY METRICS (4 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Score Card */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Round 1 Score</span>
            <span className="text-[10px] text-accent font-bold">360 Max</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {round1Total}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({((round1Total / 360) * 100).toFixed(1)}%)
            </span>
          </div>
        </Card>

        {/* Arrow Average Card */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Average</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {(round1Total / 36).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-medium">pts / arrow</span>
          </div>
        </Card>

        {/* 10s Count Card */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>10s Count</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {tensDisplay}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({((tensDisplay / 36) * 100).toFixed(0)}% gold)
            </span>
          </div>
        </Card>

        {/* Xs Count Card */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Inner-X (Xs)</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight">
              {xsDisplay}
            </span>
            <span className="text-xs text-slate-400 font-medium">bullseyes</span>
          </div>
        </Card>
      </div>

      {/* 3. DETAILED SCORES TABLE CARD */}
      <Card noPadding className="bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Detailed Scores – Round 1
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual arrow records, end subtotals, and progressive running score
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
            {eventDistance} • 6 Ends (36 Arrows)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-xs bg-slate-50/70">
                <th className="py-3 px-3 text-center w-14">End</th>
                <th className="py-3 px-2 text-center">Arrow 1</th>
                <th className="py-3 px-2 text-center">Arrow 2</th>
                <th className="py-3 px-2 text-center">Arrow 3</th>
                <th className="py-3 px-2 text-center">Arrow 4</th>
                <th className="py-3 px-2 text-center">Arrow 5</th>
                <th className="py-3 px-2 text-center">Arrow 6</th>
                <th className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-100/60 w-24">
                  End Total
                </th>
                <th className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-100/60 w-28">
                  Running Total
                </th>
              </tr>
            </thead>
            <tbody>
              {ends.slice(0, 6).map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors h-14"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-700 bg-slate-50/30">
                    {idx + 1}
                  </td>
                  {row.map((arrowVal, arrowIdx) => (
                    <td key={arrowIdx} className="py-2.5 px-1.5">
                      <span
                        className={`inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg text-xs transition-all shadow-2xs ${getArrowBadgeClass(
                          arrowVal
                        )}`}
                      >
                        {arrowVal || "-"}
                      </span>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 font-black text-slate-900 bg-slate-50/40 text-sm">
                    {endTotals[idx] || 0}
                  </td>
                  <td className="py-2.5 px-3 font-black text-slate-900 bg-slate-50/40 text-sm">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-200/60 font-mono">
                      {runningTotals[idx] || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/50 border-t-2 border-amber-200/80 font-bold text-slate-900">
                <td colSpan={7} className="py-3.5 px-5 text-left text-sm font-bold text-slate-900">
                  Round 1 Total
                </td>
                <td className="py-3.5 px-3 text-center text-sm font-black text-amber-900">
                  {round1Total}
                </td>
                <td className="py-3.5 px-3 text-center text-base font-black text-amber-900 font-mono">
                  {round1Total} / 360
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 4. ROUND SUMMARY TABLE & COACH INSIGHT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Round Summary Card */}
        <Card noPadding className="bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Round Summary</h3>
            <span className="text-xs text-slate-500 font-medium">Competition Standard</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3 text-left">Round</th>
                  <th className="py-2.5 px-2 text-center">Distance</th>
                  <th className="py-2.5 px-2 text-center font-bold text-slate-900">Score</th>
                  <th className="py-2.5 px-2 text-center">Max Score</th>
                  <th className="py-2.5 px-2 text-center">10s</th>
                  <th className="py-2.5 px-2 text-center">Xs</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-3 text-left font-bold text-slate-900">Round 1</td>
                  <td className="py-3 px-2 text-slate-600">{eventDistance}</td>
                  <td className="py-3 px-2 font-black text-slate-900 text-sm">{round1Total}</td>
                  <td className="py-3 px-2 text-slate-500">360</td>
                  <td className="py-3 px-2 font-semibold text-slate-700">{tensDisplay}</td>
                  <td className="py-3 px-2 font-semibold text-slate-700">{xsDisplay}</td>
                </tr>
                <tr className="border-b border-slate-100 text-slate-400">
                  <td className="py-3 px-3 text-left font-medium">Round 2</td>
                  <td className="py-3 px-2">{eventDistance}</td>
                  <td className="py-3 px-2 font-medium">-</td>
                  <td className="py-3 px-2 text-slate-500">360</td>
                  <td className="py-3 px-2">-</td>
                  <td className="py-3 px-2">-</td>
                </tr>
                <tr className="border-b border-slate-100 text-slate-400">
                  <td className="py-3 px-3 text-left font-medium">Round 3</td>
                  <td className="py-3 px-2">{eventDistance}</td>
                  <td className="py-3 px-2 font-medium">-</td>
                  <td className="py-3 px-2 text-slate-500">360</td>
                  <td className="py-3 px-2">-</td>
                  <td className="py-3 px-2">-</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td className="py-3 px-3 text-left font-extrabold text-slate-900">Grand Total</td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2 font-black text-slate-900 text-sm">{round1Total}</td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">1080</td>
                  <td className="py-3 px-2 font-black text-slate-900">{tensDisplay}</td>
                  <td className="py-3 px-2 font-black text-slate-900">{xsDisplay}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Coach Insight & Session Notes */}
        <div className="flex flex-col gap-4">
          <Card className="p-5 bg-gradient-to-br from-accent/5 via-panel to-amber-500/5 border border-accent/15 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent flex-shrink-0 mt-0.5">
                <Flame className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold tracking-wider text-accent uppercase">
                  Performance Insight
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1 leading-relaxed">
                  {getCoachInsight(round1Total, tensDisplay)}
                </p>
                <div className="mt-3 pt-3 border-t border-black/5 text-xs text-slate-500 flex items-center gap-2">
                  <span>Accuracy consistency:</span>
                  <span className="font-bold text-slate-700">
                    {((round1Total / 360) * 100).toFixed(1)}% on target
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Session Notes */}
          <Card className="p-4 bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Session Notes</span>
              <p className="text-xs text-slate-500 mt-0.5">
                {session.note || "Logged via ArcherX Interactive Score Pad"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <EditScoresModal
          session={session}
          initialEnds={ends}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={(updatedSession, updatedEnds) => {
            setSession(updatedSession);
            setEnds(updatedEnds);
          }}
        />
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Share Scorecard</h3>
            <p className="text-xs text-slate-500 mb-4">
              Share {athleteName}&apos;s {eventName} scorecard summary.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                {copied ? "Copied to Clipboard!" : "Copy Scorecard Summary"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  handlePrint();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 mt-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
