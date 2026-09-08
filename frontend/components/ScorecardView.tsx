"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Session } from "@/lib/data";
import { useUser } from "@/hooks/useUser";
import EditScoresModal from "./EditScoresModal";
import { apiDelete, apiGet } from "@/lib/api";
import Card from "./ui/Card";
import { BOW_OPTIONS, BOW_DISTANCES, BowOption } from "./SessionSetup";

interface ScorecardViewProps {
  session?: Session;
  allSessions?: Session[];
  onBack?: () => void;
}

export interface BowConfig {
  name: BowOption;
  shortName: string;
  defaultDistance: string;
  distances: string[];
  standardName: string;
  standardShort: string;
  targetFace: string;
  equipmentSummary: string;
  getCoachInsight: (score: number, tens: number, xs: number) => string;
  defaultSession: Session;
  defaultEnds: string[][];
}

export const BOW_CONFIGS: Record<BowOption, BowConfig> = {
  "Recurve Bow": {
    name: "Recurve Bow",
    shortName: "Recurve",
    defaultDistance: "70m",
    distances: ["30m", "40m", "50m", "60m", "70m"],
    standardName: "World Archery Recurve Standard",
    standardShort: "WA Recurve (122cm)",
    targetFace: "122cm Full 10-Ring Face (10-Ring 12.2cm, X-Ring 6.1cm)",
    equipmentSummary: "Olympic Recurve • Carbon Limbs • Clicker • Stabilizers • Finger Tab",
    getCoachInsight: (score, tens) => {
      if (score >= 335)
        return `Elite Olympic recurve grouping with ${tens} tens! Outstanding clicker discipline and continuous expansion.`;
      if (score >= 320)
        return "Consistent recurve form! Keep expanding through the clicker with firm anchor under the jaw.";
      if (score >= 300)
        return "Solid rhythm. Focus on clean finger releases in the middle ends and keeping the bow arm stable.";
      return "Good foundation. Focus on anchor point stability under the jaw and smooth expansion through the clicker.";
    },
    defaultSession: {
      name: "70m Recurve Training",
      type: "Scoring",
      bow: "Recurve Bow",
      distance: "70m",
      arrows: 36,
      score: 329,
      avg: 9.14,
      tens: 17,
      note: "World Archery Recurve Training Log",
      createdAt: "2026-09-07T12:00:00.000Z",
    },
    defaultEnds: [
      ["9", "10", "9", "8", "10", "9"],
      ["10", "9", "9", "9", "8", "10"],
      ["9", "9", "10", "8", "9", "9"],
      ["10", "8", "9", "9", "9", "10"],
      ["9", "10", "8", "9", "10", "9"],
      ["10", "9", "9", "10", "8", "9"],
    ],
  },
  "Compound Bow": {
    name: "Compound Bow",
    shortName: "Compound",
    defaultDistance: "50m",
    distances: ["30m", "40m", "50m"],
    standardName: "World Archery Compound Standard",
    standardShort: "WA Compound (80cm)",
    targetFace: "80cm 6-Ring Face (Inner-10 X-Ring: 4cm, 10-Ring: 8cm)",
    equipmentSummary: "Target Compound 60 lbs • Magnified Scope & Peep • Mechanical Release • Micro-tune Rest",
    getCoachInsight: (score, tens, xs) => {
      if (score >= 345)
        return `Sensational compound round with ${xs} inner-Xs! Dead-center group execution and smooth surprise release.`;
      if (score >= 335)
        return `Strong compound scoring with ${tens} tens! Steady scope bubble alignment and relaxed bow hand.`;
      if (score >= 315)
        return "Good compound hold at 80% let-off. Work on steady peep-to-scope centering and firm back-tension.";
      return "Solid baseline round. Keep your bow hand relaxed, let the sight pin float naturally, and execute with surprise tension.";
    },
    defaultSession: {
      name: "50m Compound Championship",
      type: "Scoring",
      bow: "Compound Bow",
      distance: "50m",
      arrows: 36,
      score: 346,
      avg: 9.61,
      tens: 24,
      note: "World Archery 50m Target Log",
      createdAt: "2026-09-07T12:00:00.000Z",
    },
    defaultEnds: [
      ["10", "X", "10", "9", "10", "X"],
      ["X", "10", "9", "10", "10", "9"],
      ["10", "X", "10", "10", "9", "10"],
      ["X", "10", "X", "9", "10", "10"],
      ["10", "9", "10", "X", "10", "9"],
      ["X", "10", "10", "9", "X", "10"],
    ],
  },
  "Indian Bow": {
    name: "Indian Bow",
    shortName: "Indian",
    defaultDistance: "30m",
    distances: ["20m", "30m", "40m", "50m"],
    standardName: "AAI National Indian Round Standard",
    standardShort: "AAI Indian Round (122cm)",
    targetFace: "122cm Full Face Target (Traditional Bamboo / Wooden Round Rules)",
    equipmentSummary: "Traditional Bamboo / Wood Bow • No Sights / Stabilizers • Bare Shelf • Finger Release",
    getCoachInsight: (score, tens) => {
      if (score >= 325)
        return `Masterful Indian round! Superb instinctive grouping with ${tens} tens and clean bare-shelf clearance.`;
      if (score >= 310)
        return "Exceptional traditional consistency! Clean three-finger release and rock-solid corner-of-mouth anchor.";
      if (score >= 290)
        return "Solid Indian round rhythm. Keep bow cant strictly constant and commit to your instinctive sight picture.";
      return "Great traditional effort! Focus on uniform draw length, constant anchor at the mouth corner, and fluid follow-through.";
    },
    defaultSession: {
      name: "30m Indian Round Practice",
      type: "Scoring",
      bow: "Indian Bow",
      distance: "30m",
      arrows: 36,
      score: 318,
      avg: 8.83,
      tens: 13,
      note: "AAI National Indian Round Log",
      createdAt: "2026-09-07T12:00:00.000Z",
    },
    defaultEnds: [
      ["9", "9", "10", "8", "9", "9"],
      ["10", "8", "9", "9", "8", "9"],
      ["9", "10", "9", "8", "10", "8"],
      ["8", "9", "9", "10", "9", "9"],
      ["10", "9", "8", "9", "9", "9"],
      ["9", "10", "9", "8", "10", "9"],
    ],
  },
};

const getBowFromSession = (s?: Session | null): BowOption => {
  if (!s) return "Recurve Bow";
  if (s.bow && s.bow in BOW_CONFIGS) return s.bow as BowOption;
  const nameLower = (s.name || "").toLowerCase();
  const noteLower = (s.note || "").toLowerCase();
  if (nameLower.includes("compound") || noteLower.includes("compound")) return "Compound Bow";
  if (nameLower.includes("indian") || noteLower.includes("indian")) return "Indian Bow";
  return "Recurve Bow";
};

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
  allSessions,
  onBack,
}: ScorecardViewProps) {
  const router = useRouter();
  const { user } = useUser();

  const [selectedBow, setSelectedBow] = useState<BowOption>(() => {
    return getBowFromSession(initialSession);
  });

  const [selectedDistance, setSelectedDistance] = useState<string>(() => {
    const bow = getBowFromSession(initialSession);
    if (initialSession?.distance && BOW_DISTANCES[bow]?.includes(initialSession.distance)) {
      return initialSession.distance;
    }
    return BOW_CONFIGS[bow].defaultDistance;
  });

  const [sessionsList, setSessionsList] = useState<Session[]>(allSessions || []);

  const [session, setSession] = useState<Session>(() => {
    if (initialSession) return initialSession;
    return BOW_CONFIGS["Recurve Bow"].defaultSession;
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const currentBowConfig = BOW_CONFIGS[selectedBow];

  // Fetch all sessions client-side if not provided
  useEffect(() => {
    if (!allSessions || allSessions.length === 0) {
      apiGet<Session[]>("/api/sessions")
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSessionsList(data);
          }
        })
        .catch(() => {});
    }
  }, [allSessions]);

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
        console.warn("Could not parse arrowData:", e);
      }
    }
    return currentBowConfig.defaultEnds;
  });

  // Re-sync ends when session or bow changes
  useEffect(() => {
    if (session.arrowData) {
      try {
        const parsed = JSON.parse(session.arrowData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnds(
            parsed.map((endItem: unknown) => {
              if (Array.isArray(endItem)) {
                return endItem.map((a: unknown) => {
                  if (typeof a === "object" && a !== null && "score" in a) {
                    return String((a as { score: unknown }).score);
                  }
                  return String(a);
                });
              }
              return [];
            })
          );
          return;
        }
      } catch (e) {
        console.warn("Could not parse arrowData:", e);
      }
    }
    setEnds(BOW_CONFIGS[selectedBow].defaultEnds);
  }, [session, selectedBow]);

  // Handle switching bows
  const handleSelectBow = (bow: BowOption) => {
    setSelectedBow(bow);
    const validDistances = BOW_DISTANCES[bow];
    const nextDistance = validDistances.includes(selectedDistance)
      ? selectedDistance
      : BOW_CONFIGS[bow].defaultDistance;
    setSelectedDistance(nextDistance);

    // Look for an existing user session matching this bow & distance
    const matching =
      sessionsList.find(
        (s) =>
          getBowFromSession(s) === bow &&
          s.distance &&
          s.distance.trim().toLowerCase() === nextDistance.toLowerCase()
      ) ||
      sessionsList.find((s) => getBowFromSession(s) === bow);

    if (matching) {
      setSession(matching);
      if (matching.distance && validDistances.includes(matching.distance)) {
        setSelectedDistance(matching.distance);
      }
    } else {
      setSession({
        ...BOW_CONFIGS[bow].defaultSession,
        distance: nextDistance,
        name: `${nextDistance} ${BOW_CONFIGS[bow].shortName} Round`,
      });
    }
  };

  // Handle switching distance within current bow
  const handleSelectDistance = (dist: string) => {
    setSelectedDistance(dist);
    const matching = sessionsList.find(
      (s) =>
        getBowFromSession(s) === selectedBow &&
        s.distance &&
        s.distance.trim().toLowerCase() === dist.toLowerCase()
    );

    if (matching) {
      setSession(matching);
    } else {
      setSession((prev) => ({
        ...prev,
        distance: dist,
        name: `${dist} ${currentBowConfig.shortName} Round`,
      }));
    }
  };

  // Calculate totals
  const endTotals = ends.map((end) =>
    end.reduce((sum, arrow) => sum + parseArrowPoints(arrow), 0)
  );

  let runTotal = 0;
  const runningTotals = endTotals.map((tot) => {
    runTotal += tot;
    return runTotal;
  });

  const round1Total = runningTotals[runningTotals.length - 1] || Number(session.score) || 0;
  const allArrows = ends.flat();

  const computedTens = allArrows.filter((a) => a === "10" || a === "X").length;
  const computedXs = allArrows.filter((a) => a === "X").length;
  const computedNines = allArrows.filter((a) => a === "9").length;

  const isRealSavedSession = Boolean(session._id || session.id);
  const tensDisplay: number = Number(
    isRealSavedSession
      ? computedTens > 0
        ? computedTens
        : Number(session.tens) || 0
      : computedTens || currentBowConfig.defaultSession.tens || 0
  );
  const xsDisplay: number = Number(
    isRealSavedSession ? computedXs : computedXs || (selectedBow === "Compound Bow" ? 11 : 2)
  );
  const ninesDisplay: number = computedNines;

  const athleteName = user?.name || "Sudarshan Aher";
  const userInitials = athleteName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const eventDistance = selectedDistance || session.distance || currentBowConfig.defaultDistance;
  const eventName = `${eventDistance} ${currentBowConfig.shortName}`;

  const sessionDate = session.createdAt ? new Date(session.createdAt) : new Date();
  const formattedDate = sessionDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const venueName = session.note || currentBowConfig.standardName;

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
    const shareText = `🎯 ArcherX Scorecard - ${athleteName} (${eventName})\nBow: ${selectedBow}\nDistance: ${eventDistance}\nDate: ${formattedDate}\nScore: ${round1Total} / 360\nXs: ${xsDisplay} | 10s: ${tensDisplay} | 9s: ${ninesDisplay}\nStandard: ${currentBowConfig.standardName}`;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athleteName}'s ArcherX Scorecard (${selectedBow})`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    setIsShareModalOpen(true);
  };

  const handleCopyLink = () => {
    const shareText = `🎯 ArcherX Scorecard - ${athleteName} (${eventName})\nBow: ${selectedBow}\nDistance: ${eventDistance}\nDate: ${formattedDate}\nScore: ${round1Total} / 360\nXs: ${xsDisplay} | 10s: ${tensDisplay} | 9s: ${ninesDisplay}\n${typeof window !== "undefined" ? window.location.href : ""}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const sessionId = session.id || session._id;
    if (!sessionId) {
      alert("Template demo session cannot be deleted.");
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
      {/* 0. BOW & DISTANCE SELECTION CONTROL */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        {/* Bow Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {BOW_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => handleSelectBow(b)}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedBow === b
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{b}</span>
            </button>
          ))}
        </div>

        {/* Distance Selector Pills for Current Bow */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Distance:
          </span>
          {currentBowConfig.distances.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSelectDistance(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDistance === d
                  ? "bg-accent text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Helper Banner when viewing a template vs saved session */}
      {!isRealSavedSession && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Viewing <strong>{selectedBow}</strong> competition template ({eventDistance}). Ready to record your live score?
            </span>
          </div>
          <Link
            href="/score-entry"
            className="inline-flex items-center gap-1 font-bold text-accent hover:underline flex-shrink-0"
          >
            <span>Score Entry</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 1. ATHLETE & SESSION HERO CARD */}
      <Card className="p-5 sm:p-6 relative overflow-hidden bg-white border border-slate-200/80 shadow-xs print:border-none print:shadow-none">
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
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                  {selectedBow}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {session.type || "Scoring"}
                </span>
                {isRealSavedSession ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                    Saved Round
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">
                    Template
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 mt-1 flex-wrap font-medium">
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  {eventName}
                </span>
                <span>•</span>
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="text-slate-500 truncate max-w-[280px]" title={venueName}>
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
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Scores</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {isRealSavedSession && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Delete Session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Technical Specs Bar dependent on Bow */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Standard:</span>
            <span className="font-semibold text-slate-800 truncate">{currentBowConfig.standardName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Target Face:</span>
            <span className="font-semibold text-slate-800 truncate">{currentBowConfig.targetFace}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Equipment:</span>
            <span className="font-semibold text-slate-800 truncate">{currentBowConfig.equipmentSummary}</span>
          </div>
        </div>
      </Card>

      {/* 2. KPI SUMMARY METRICS (4 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Score Card */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
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
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
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
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
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
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>
              {selectedBow === "Compound Bow" ? "Compound X-Ring" : "Inner-X (Xs)"}
            </span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight">
              {xsDisplay}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {selectedBow === "Compound Bow" ? "inner-10s" : "bullseyes"}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. DETAILED SCORES TABLE CARD */}
      <Card noPadding className="bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Detailed Scores – Round 1 ({currentBowConfig.shortName})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual arrow records, end subtotals, and progressive running score
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
            <span>{eventDistance}</span>
            <span>•</span>
            <span>{currentBowConfig.shortName}</span>
            <span>•</span>
            <span>6 Ends (36 Arrows)</span>
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
                  Round 1 Total ({eventName})
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
        <Card noPadding className="bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Round Summary</h3>
            <span className="text-xs text-slate-500 font-medium">{currentBowConfig.standardShort}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3 text-left">Round</th>
                  <th className="py-2.5 px-2 text-center">Distance</th>
                  <th className="py-2.5 px-2 text-center font-bold text-slate-900">Score</th>
                  <th className="py-2.5 px-2 text-center">Max Score</th>
                  <th className="py-2.5 px-2 text-center">Xs</th>
                  <th className="py-2.5 px-2 text-center">10s</th>
                  <th className="py-2.5 px-2 text-center">9s</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-3 text-left font-bold text-slate-900">Round 1</td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">{eventDistance}</td>
                  <td className="py-3 px-2 font-black text-slate-900 text-sm">{round1Total}</td>
                  <td className="py-3 px-2 text-slate-500">360</td>
                  <td className="py-3 px-2 font-semibold text-slate-700">{xsDisplay}</td>
                  <td className="py-3 px-2 font-semibold text-slate-700">{tensDisplay}</td>
                  <td className="py-3 px-2 font-semibold text-slate-700">{ninesDisplay}</td>
                </tr>
                <tr className="border-b border-slate-100 text-slate-400">
                  <td className="py-3 px-3 text-left font-medium">Round 2</td>
                  <td className="py-3 px-2">{eventDistance}</td>
                  <td className="py-3 px-2 font-medium">-</td>
                  <td className="py-3 px-2 text-slate-500">360</td>
                  <td className="py-3 px-2">-</td>
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
                  <td className="py-3 px-2">-</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td className="py-3 px-3 text-left font-extrabold text-slate-900">Grand Total</td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2 font-black text-slate-900 text-sm">{round1Total}</td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">1080</td>
                  <td className="py-3 px-2 font-black text-slate-900">{xsDisplay}</td>
                  <td className="py-3 px-2 font-black text-slate-900">{tensDisplay}</td>
                  <td className="py-3 px-2 font-black text-slate-900">{ninesDisplay}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Coach Insight & Session Notes */}
        <div className="flex flex-col gap-4">
          <Card className="p-5 bg-gradient-to-br from-accent/5 via-panel to-amber-500/5 border border-accent/15 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent flex-shrink-0 mt-0.5">
                <Flame className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold tracking-wider text-accent uppercase">
                    Performance Insight
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 font-bold text-accent">
                    {selectedBow}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mt-1.5 leading-relaxed">
                  {currentBowConfig.getCoachInsight(round1Total, tensDisplay, xsDisplay)}
                </p>
                <div className="mt-3 pt-3 border-t border-black/5 text-xs text-slate-500 flex items-center justify-between">
                  <span>Accuracy consistency:</span>
                  <span className="font-bold text-slate-700">
                    {((round1Total / 360) * 100).toFixed(1)}% on target
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Session Notes */}
          <Card className="p-4 bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Session Notes</span>
              <p className="text-xs text-slate-500 mt-0.5">
                {session.note || `${currentBowConfig.standardName} session`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 mb-2">Share Scorecard</h3>
            <p className="text-xs text-slate-500 mb-4">
              Copy your official scorecard link or copy score summary to clipboard.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-mono mb-4 break-all">
              {athleteName} • {eventName} ({round1Total}/360) • {selectedBow}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-accent text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Summary"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
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
