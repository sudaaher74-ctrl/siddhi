"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit3,
  Share2,
  Printer,
  Download,
  Copy,
  Check,
  Award,
  Target,
  ArrowLeft,
  Trash2,
  TrendingUp,
  Flame,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Session } from "@/lib/data";
import { useUser } from "@/hooks/useUser";
import EditScoresModal from "./EditScoresModal";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { exportScorecardPDF, parseArrowDataEnds, getTargetShotCoordinates } from "@/lib/pdfExport";
import Card from "./ui/Card";
import { BOW_OPTIONS, BOW_DISTANCES, BowOption } from "./SessionSetup";

interface ScorecardViewProps {
  session?: Session;
  allSessions?: Session[];
  initialUser?: { name?: string; email?: string; avatar?: string } | null;
  onBack?: () => void;
  onSaveLiveRound?: () => void;
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
  if (score === "X" || score === "10" || score === "9") {
    return "bg-[#FEF08A] text-[#854D0E] border border-amber-400 font-semibold";
  }
  if (score === "8" || score === "7") {
    return "bg-[#FECACA] text-[#991B1B] border border-rose-300 font-semibold";
  }
  if (score === "6" || score === "5") {
    return "bg-[#BAE6FD] text-[#075985] border border-sky-300 font-semibold";
  }
  if (score === "4" || score === "3") {
    return "bg-[#334155] text-white border border-slate-700 font-semibold";
  }
  if (score === "2" || score === "1") {
    return "bg-white text-slate-900 border border-slate-300 font-semibold";
  }
  return "bg-slate-200 text-slate-600 border border-slate-300 font-semibold";
};

export default function ScorecardView({
  session: initialSession,
  allSessions,
  initialUser,
  onBack,
  onSaveLiveRound,
}: ScorecardViewProps) {
  const router = useRouter();
  const { user } = useUser();

  const [sessionsList, setSessionsList] = useState<Session[]>(allSessions || []);
  const [unsavedDraft, setUnsavedDraft] = useState<{
    score: number;
    arrows: number;
    bow: string;
    distance: string;
    date: string;
  } | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingLive, setIsSavingLive] = useState(false);

  // Check localStorage for any unsaved draft from score-entry
  useEffect(() => {
    try {
      const raw = localStorage.getItem("archerx_live_draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.totalScore > 0 || (parsed.ends && parsed.ends.flat().length > 0))) {
          setUnsavedDraft({
            score: parsed.totalScore || 0,
            arrows: parsed.arrows || (parsed.ends ? parsed.ends.flat().length : 0),
            bow: parsed.bow || parsed.setup?.bow || "Recurve Bow",
            distance: parsed.distance || parsed.setup?.distance || "70m",
            date: parsed.date || new Date().toLocaleDateString(),
          });
        }
      }
    } catch {}
  }, []);

  const [session, setSession] = useState<Session | null>(() => {
    if (initialSession) return initialSession;
    if (allSessions && allSessions.length > 0) return allSessions[0];
    return null;
  });

  const [selectedBow, setSelectedBow] = useState<BowOption>(() => {
    return getBowFromSession(initialSession || (allSessions && allSessions[0]));
  });

  const [selectedDistance, setSelectedDistance] = useState<string>(() => {
    const s = initialSession || (allSessions && allSessions[0]);
    const bow = getBowFromSession(s);
    if (s?.distance && BOW_DISTANCES[bow]?.includes(s.distance)) {
      return s.distance;
    }
    return BOW_CONFIGS[bow].defaultDistance;
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
          if (Array.isArray(data)) {
            setSessionsList(data);
            if (!session && data.length > 0) {
              const first = data[0];
              setSession(first);
              const bow = getBowFromSession(first);
              setSelectedBow(bow);
              if (first.distance && BOW_DISTANCES[bow]?.includes(first.distance)) {
                setSelectedDistance(first.distance);
              } else {
                setSelectedDistance(BOW_CONFIGS[bow].defaultDistance);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [allSessions, session]);

  // Parse ends data
  const [ends, setEnds] = useState<string[][]>([]);

  useEffect(() => {
    if (session?.arrowData) {
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
    setEnds([]);
  }, [session]);

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
      setSession(null);
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
      setSession(null);
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

  const round1Total =
    runningTotals[runningTotals.length - 1] || (session ? Number(session.score) || 0 : 0);
  const allArrows = ends.flat();

  const computedTens = allArrows.filter((a) => a === "10" || a === "X").length;
  const computedXs = allArrows.filter((a) => a === "X").length;
  const computedNines = allArrows.filter((a) => a === "9").length;

  const isRealSavedSession = Boolean(session && (session._id || session.id));
  const tensDisplay: number = session
    ? computedTens > 0
      ? computedTens
      : Number(session.tens) || 0
    : 0;
  const xsDisplay: number = computedXs;
  const ninesDisplay: number = computedNines;

  const athleteName = user?.name || initialUser?.name || "Athlete";
  const userInitials =
    athleteName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AT";

  const eventDistance = selectedDistance || session?.distance || currentBowConfig.defaultDistance;
  const eventName = `${eventDistance} ${currentBowConfig.shortName}`;

  const sessionDate = session?.createdAt ? new Date(session.createdAt) : new Date();
  const formattedDate = sessionDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const venueName = session?.note || currentBowConfig.standardName;

  const totalArrowsCount = session
    ? Number(session.arrows) || (allArrows.length > 0 ? allArrows.length : 36)
    : 36;
  const maxPossibleScore = totalArrowsCount * 10;
  const scorePercentage = maxPossibleScore > 0 ? ((round1Total / maxPossibleScore) * 100).toFixed(1) : "0.0";
  const averagePerArrow = totalArrowsCount > 0 ? (round1Total / totalArrowsCount).toFixed(2) : "0.00";

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

  const handleDownloadPDF = () => {
    exportScorecardPDF({
      athleteName,
      selectedBow,
      distance: eventDistance,
      formattedDate,
      eventName,
      venueName,
      standardName: currentBowConfig.standardName,
      round1Total,
      maxPossibleScore,
      scorePercentage,
      averagePerArrow,
      tensDisplay,
      xsDisplay,
      ninesDisplay,
      totalArrowsCount,
      ends,
      endTotals,
      runningTotals,
      coachInsight: currentBowConfig.getCoachInsight(round1Total, tensDisplay, xsDisplay),
      sessionNote: session?.note,
      session: session || undefined,
    });
  };

  const handleShare = async () => {
    if (!session) return;
    const shareText = `🎯 ArcherX Scorecard - ${athleteName} (${eventName})\nBow: ${selectedBow}\nDistance: ${eventDistance}\nDate: ${formattedDate}\nScore: ${round1Total} / ${maxPossibleScore}\nXs: ${xsDisplay} | 10s: ${tensDisplay} | 9s: ${ninesDisplay}\nStandard: ${currentBowConfig.standardName}`;
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
    if (!session) return;
    const shareText = `🎯 ArcherX Scorecard - ${athleteName} (${eventName})\nBow: ${selectedBow}\nDistance: ${eventDistance}\nDate: ${formattedDate}\nScore: ${round1Total} / ${maxPossibleScore}\nXs: ${xsDisplay} | 10s: ${tensDisplay} | 9s: ${ninesDisplay}\n${typeof window !== "undefined" ? window.location.href : ""}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!session) return;
    const sessionId = session.id || session._id;
    if (!sessionId) return;
    if (!confirm("Are you sure you want to delete this scorecard session?")) return;

    setIsDeleting(true);
    try {
      await apiDelete(`/api/sessions/${sessionId}`);
      const updated = sessionsList.filter((s) => (s.id || s._id) !== sessionId);
      setSessionsList(updated);
      if (updated.length > 0) {
        const next = updated[0];
        setSession(next);
        const bow = getBowFromSession(next);
        setSelectedBow(bow);
        setSelectedDistance(
          next.distance && BOW_DISTANCES[bow]?.includes(next.distance)
            ? next.distance
            : BOW_CONFIGS[bow].defaultDistance
        );
      } else {
        setSession(null);
      }
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete session.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDraftFromLocalStorage = async () => {
    setIsSavingDraft(true);
    try {
      const raw = localStorage.getItem("archerx_live_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const endsData = parsed.ends || [];
      const allArrowsData = endsData.flat();
      if (allArrowsData.length === 0) {
        alert("No arrows found in draft.");
        setIsSavingDraft(false);
        return;
      }
      const tensCount = allArrowsData.filter((a: { score: string }) => a.score === "10" || a.score === "X").length;
      const calcTotal = Number(parsed.totalScore) || allArrowsData.reduce((sum: number, a: { score: string }) => {
        const val = a.score === "X" ? 10 : a.score === "M" ? 0 : parseInt(a.score, 10);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      const avg = allArrowsData.length > 0 ? (calcTotal / allArrowsData.length).toFixed(2) : "0.00";
      const distance = parsed.distance || parsed.setup?.distance || "70m";
      const bow = parsed.bow || parsed.setup?.bow || "Recurve Bow";

      const payload = {
        name: `${bow} ${distance} Practice - ${new Date().toLocaleDateString()}`,
        type: parsed.setup?.type || "Practice",
        distance,
        bow,
        arrows: allArrowsData.length,
        score: calcTotal,
        avg: Number(avg),
        tens: tensCount,
        note: `Logged via Interactive Score Pad (${bow} at ${distance})`,
        arrowData: JSON.stringify(endsData),
      };

      const saved = await apiPost<Session>("/api/sessions", payload);
      try {
        localStorage.removeItem("archerx_live_draft");
      } catch {}
      setUnsavedDraft(null);

      if (saved && (saved._id || saved.id)) {
        window.location.href = `/scorecard/${saved._id || saved.id}`;
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save draft session: " + (err instanceof Error ? err.message : "unknown error"));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveLiveRound = async () => {
    if (onSaveLiveRound) {
      onSaveLiveRound();
      return;
    }
    if (!session) return;
    setIsSavingLive(true);
    try {
      const payload = {
        name: session.name || `${selectedBow} ${eventDistance} Practice - ${new Date().toLocaleDateString()}`,
        type: session.type || "Practice",
        distance: eventDistance,
        bow: selectedBow,
        arrows: session.arrows || allArrows.length,
        score: session.score || round1Total,
        avg: Number(session.avg || averagePerArrow),
        tens: Number(session.tens || tensDisplay),
        note: session.note || `Logged via Interactive Score Pad (${selectedBow})`,
        arrowData: session.arrowData || JSON.stringify(ends),
      };
      const saved = await apiPost<Session>("/api/sessions", payload);
      try {
        localStorage.removeItem("archerx_live_draft");
      } catch {}
      if (saved && (saved._id || saved.id)) {
        window.location.href = `/scorecard/${saved._id || saved.id}`;
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save session: " + (err instanceof Error ? err.message : "unknown error"));
    } finally {
      setIsSavingLive(false);
    }
  };

  // 1. Overall Empty State when the athlete has zero sessions saved
  if (sessionsList.length === 0 && !session) {
    return (
      <div className="w-full flex flex-col items-center justify-center my-6 p-4">
        {unsavedDraft && (
          <div className="w-full max-w-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 text-left shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider">
                Unsaved Round Detected
              </span>
              <span className="text-xs font-semibold text-amber-800">from Score Entry</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              You scored {unsavedDraft.score} pts ({unsavedDraft.arrows} arrows) in {unsavedDraft.bow} at {unsavedDraft.distance}!
            </h4>
            <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
              This session has not been saved to your permanent scorecard database yet. Save it now to generate your official scorecard and career stats.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveDraftFromLocalStorage}
                disabled={isSavingDraft}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingDraft ? "Saving to Official Records..." : "Save This Round to Scorecard"}</span>
              </button>
              <Link
                href="/score-entry"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                <span>Resume in Score Entry</span>
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-lg w-full">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Scorecards Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
            You haven&apos;t recorded any scoring sessions yet. Head over to Score Entry to log your live arrows, and your official scorecard will automatically appear here.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/score-entry"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Record Live Session</span>
            </Link>
            <Link
              href="/practice"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>Practice Logs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={printRef} className="w-full flex flex-col gap-5 print:gap-2 print:p-0 print:m-0">
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

      {/* When no session exists for the selected bow / distance */}
      {!session ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center my-4 max-w-xl mx-auto w-full">
          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-3">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No {selectedBow} Sessions at {selectedDistance}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
            You haven&apos;t recorded any {selectedBow} rounds at {selectedDistance} yet. Select another bow or distance above, or start a new round.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/score-entry?bow=${encodeURIComponent(selectedBow)}&distance=${encodeURIComponent(selectedDistance)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record {selectedBow} Round</span>
            </Link>
            {sessionsList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const first = sessionsList[0];
                  const bow = getBowFromSession(first);
                  setSelectedBow(bow);
                  setSelectedDistance(
                    first.distance && BOW_DISTANCES[bow]?.includes(first.distance)
                      ? first.distance
                      : BOW_CONFIGS[bow].defaultDistance
                  );
                  setSession(first);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                View Latest Session ({getBowFromSession(sessionsList[0])})
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Live Draft Alert Banner */}
          {!isRealSavedSession && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden mb-1">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>This round is currently an unsaved live draft. Click &quot;Save to Scorecards&quot; to store it permanently in your official records.</span>
              </div>
              <button
                type="button"
                onClick={handleSaveLiveRound}
                disabled={isSavingLive}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingLive ? "Saving..." : "Save to Scorecards"}</span>
              </button>
            </div>
          )}

          {/* 1. ATHLETE & SESSION HERO CARD */}
          <Card className="p-5 sm:p-6 relative overflow-hidden bg-white border border-slate-200/80 shadow-xs print:border print:border-slate-200 print:shadow-none print:p-2.5 print:mb-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 print:gap-2">
              {/* Athlete Info */}
              <div className="flex items-center gap-4 print:gap-2.5">
                <div className="w-14 h-14 print:w-9 print:h-9 rounded-2xl print:rounded-lg bg-gradient-to-br from-accent to-red-600 flex items-center justify-center text-white font-bold text-lg print:text-xs shadow-md flex-shrink-0">
                  {userInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 print:gap-1.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl print:text-base font-bold text-slate-900 tracking-tight">
                      {athleteName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs print:text-[9.5px] font-bold uppercase tracking-wider">
                      Official Scorecard
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs print:text-[9.5px] font-bold">
                      {selectedBow}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs print:text-[9.5px] font-semibold">
                      {session.type || "Scoring"}
                    </span>
                    {isRealSavedSession ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs print:text-[9.5px] font-semibold border border-emerald-200/60">
                        Saved Round
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs print:text-[9.5px] font-bold border border-amber-300">
                        Live Draft • Unsaved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 print:gap-2 text-xs sm:text-sm print:text-[10px] text-slate-500 mt-1 print:mt-0.5 flex-wrap font-medium">
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Target className="w-3.5 h-3.5 print:w-3 print:h-3 text-accent" />
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
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto print:hidden">
            {!isRealSavedSession && (
              <button
                type="button"
                onClick={handleSaveLiveRound}
                disabled={isSavingLive}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[42px]"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingLive ? "Saving..." : "Save to Official Records"}</span>
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
              title="Download 1-page Official PDF Scorecard"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
              title="Share Scorecard"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {isRealSavedSession && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
                title="Delete Session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Technical Specs Bar dependent on Bow */}
        <div className="mt-4 pt-3.5 print:mt-1.5 print:pt-1 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-3 print:gap-1 text-xs print:text-[9.5px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] print:text-[8.5px] tracking-wider">Standard:</span>
            <span className="font-semibold text-slate-800 truncate">{currentBowConfig.standardName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] print:text-[8.5px] tracking-wider">Target Face:</span>
            <span className="font-semibold text-slate-800 truncate">{currentBowConfig.targetFace}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] print:text-[8.5px] tracking-wider">Equipment:</span>
            <span className="font-semibold text-slate-800 truncate">{currentBowConfig.equipmentSummary}</span>
          </div>
        </div>
      </Card>

      {/* 2. KPI SUMMARY METRICS (4 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3.5 print:gap-1.5">
        {/* Total Score Card */}
        <Card className="p-4 print:p-1.5 bg-white border border-slate-200/80 shadow-xs print:shadow-none">
          <div className="text-[11px] print:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 print:mb-0 flex items-center justify-between">
            <span>Round 1 Score</span>
            <span className="text-[10px] print:text-[8px] text-accent font-bold">{maxPossibleScore} Max</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl print:text-lg font-black text-slate-900 tracking-tight">
              {round1Total}
            </span>
            <span className="text-xs print:text-[9px] text-slate-400 font-medium">
              ({scorePercentage}%)
            </span>
          </div>
        </Card>

        {/* Arrow Average Card */}
        <Card className="p-4 print:p-1.5 bg-white border border-slate-200/80 shadow-xs print:shadow-none">
          <div className="text-[11px] print:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 print:mb-0 flex items-center justify-between">
            <span>Average</span>
            <TrendingUp className="w-3.5 h-3.5 print:w-3 print:h-3 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl print:text-lg font-black text-emerald-600 tracking-tight">
              {averagePerArrow}
            </span>
            <span className="text-xs print:text-[9px] text-slate-400 font-medium">pts / arrow</span>
          </div>
        </Card>

        {/* 10s Count Card */}
        <Card className="p-4 print:p-1.5 bg-white border border-slate-200/80 shadow-xs print:shadow-none">
          <div className="text-[11px] print:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 print:mb-0 flex items-center justify-between">
            <span>10s Count</span>
            <Award className="w-3.5 h-3.5 print:w-3 print:h-3 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl print:text-lg font-black text-amber-600 tracking-tight">
              {tensDisplay}
            </span>
            <span className="text-xs print:text-[9px] text-slate-400 font-medium">
              ({totalArrowsCount > 0 ? ((tensDisplay / totalArrowsCount) * 100).toFixed(0) : 0}% gold)
            </span>
          </div>
        </Card>

        {/* Xs Count Card */}
        <Card className="p-4 print:p-1.5 bg-white border border-slate-200/80 shadow-xs print:shadow-none">
          <div className="text-[11px] print:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 print:mb-0 flex items-center justify-between">
            <span>
              {selectedBow === "Compound Bow" ? "Compound X-Ring" : "Inner-X (Xs)"}
            </span>
            <Flame className="w-3.5 h-3.5 print:w-3 print:h-3 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl print:text-lg font-black text-orange-600 tracking-tight">
              {xsDisplay}
            </span>
            <span className="text-xs print:text-[9px] text-slate-400 font-medium">
              {selectedBow === "Compound Bow" ? "inner-10s" : "bullseyes"}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. DETAILED SCORES TABLE CARD */}
      <Card noPadding className="bg-white border border-slate-200/80 shadow-xs overflow-hidden print:border print:border-slate-300 print:shadow-none">
        <div className="p-4 sm:p-5 print:py-1.5 print:px-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base print:text-xs font-bold text-slate-900">
              Detailed Scores – Round 1 ({currentBowConfig.shortName})
            </h3>
            <p className="text-xs print:text-[9.5px] text-slate-500 mt-0.5 print:mt-0">
              Individual arrow records, end subtotals, and progressive running score
            </p>
            <div className="sm:hidden text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1 print:hidden">
              <span>👉 Swipe table to view all 6 arrows &amp; totals</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 print:py-0.5 print:px-2 rounded-full bg-accent/10 text-accent text-xs print:text-[9.5px] font-bold">
            <span>{eventDistance}</span>
            <span>•</span>
            <span>{currentBowConfig.shortName}</span>
            <span>•</span>
            <span>{ends.length > 0 ? `${ends.length} Ends (${allArrows.length} Arrows)` : `${totalArrowsCount} Arrows`}</span>
          </div>
        </div>

        {ends.length > 0 ? (
          <div className="overflow-x-auto p-3 sm:p-5 print:p-1.5 overscroll-x-contain [webkit-overflow-scrolling:touch]">
            <table className="w-full text-center border-collapse border border-slate-300 min-w-[640px] print:min-w-0 shadow-2xs rounded-xl overflow-hidden print:text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700 font-bold text-xs print:text-[10px] bg-slate-100/90">
                  <th className="py-3 px-3 print:py-1.5 print:px-1 text-center border-r border-slate-300 w-16 uppercase tracking-wider bg-slate-200/90 sticky left-0 z-10">
                    End
                  </th>
                  <th className="py-3 px-2 print:py-1.5 print:px-1 text-center border-r border-slate-300 uppercase tracking-wider">
                    Arrow 1
                  </th>
                  <th className="py-3 px-2 print:py-1.5 print:px-1 text-center border-r border-slate-300 uppercase tracking-wider">
                    Arrow 2
                  </th>
                  <th className="py-3 px-2 print:py-1.5 print:px-1 text-center border-r border-slate-300 uppercase tracking-wider">
                    Arrow 3
                  </th>
                  <th className="py-3 px-2 print:py-1.5 print:px-1 text-center border-r border-slate-300 uppercase tracking-wider">
                    Arrow 4
                  </th>
                  <th className="py-3 px-2 print:py-1.5 print:px-1 text-center border-r border-slate-300 uppercase tracking-wider">
                    Arrow 5
                  </th>
                  <th className="py-3 px-2 print:py-1.5 print:px-1 text-center border-r border-slate-300 uppercase tracking-wider">
                    Arrow 6
                  </th>
                  <th className="py-3 px-3 print:py-1.5 print:px-1 text-center font-black text-slate-900 border-r border-slate-300 bg-slate-200/80 w-24 uppercase tracking-wider">
                    End Total
                  </th>
                  <th className="py-3 px-3 print:py-1.5 print:px-1 text-center font-black text-slate-900 bg-slate-200/80 w-28 uppercase tracking-wider">
                    Running Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {ends.slice(0, 6).map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-200 hover:bg-slate-50/70 transition-colors h-14 print:h-6"
                  >
                    <td className="py-2.5 px-3 print:py-0.5 print:px-1 font-extrabold text-slate-800 border-r border-slate-300 bg-slate-100/95 sticky left-0 z-10 text-center shadow-[1px_0_0_0_#cbd5e1]">
                      {idx + 1}
                    </td>
                    {row.map((arrowVal, arrowIdx) => (
                      <td
                        key={arrowIdx}
                        className="py-2.5 px-2 print:py-0.5 print:px-1 border-r border-slate-200 text-center"
                      >
                        <div className="flex items-center justify-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[34px] print:min-w-[22px] h-8 print:h-5 px-2 print:px-1 rounded-md text-xs print:text-[10px] font-bold transition-all shadow-2xs ${getArrowBadgeClass(
                              arrowVal
                            )}`}
                          >
                            {arrowVal || "-"}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="py-2.5 px-3 print:py-0.5 print:px-1 font-black text-slate-900 border-r border-slate-300 bg-slate-50/70 text-sm print:text-xs text-center">
                      {endTotals[idx] || 0}
                    </td>
                    <td className="py-2.5 px-3 print:py-0.5 print:px-1 font-black text-slate-900 bg-slate-50/70 text-sm print:text-xs text-center">
                      <span className="inline-block px-2.5 py-0.5 print:px-1.5 print:py-0 rounded bg-slate-200/80 font-mono font-bold text-slate-900">
                        {runningTotals[idx] || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50/90 border-t-2 border-amber-300 font-bold text-slate-900">
                  <td
                    colSpan={7}
                    className="py-3.5 px-5 print:py-1 print:px-2 text-left text-sm print:text-xs font-extrabold text-slate-900 border-r border-amber-200/90"
                  >
                    Round 1 Total
                  </td>
                  <td className="py-3.5 px-3 print:py-1 print:px-1 font-black text-slate-900 border-r border-amber-200/90 bg-amber-100/70 text-base print:text-xs text-center">
                    {round1Total}
                  </td>
                  <td className="py-3.5 px-3 print:py-1 print:px-1 font-black text-slate-900 bg-amber-100/70 text-base print:text-xs text-center">
                    {round1Total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-700 font-bold">
              Session Summary: {totalArrowsCount} arrows • {round1Total} pts ({averagePerArrow} avg)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              End-by-end arrow matrix is recorded when logging ends through Score Entry.
            </p>
          </div>
        )}
      </Card>

      {/* 4. ROUND SUMMARY TABLE & COACH INSIGHT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] print:grid-cols-2 gap-5 print:gap-2">
        {/* Round Summary Card */}
        <Card noPadding className="bg-white border border-slate-200/80 shadow-xs overflow-hidden print:border print:border-slate-300 print:shadow-none">
          <div className="p-4 print:py-1.5 print:px-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm print:text-xs font-bold text-slate-900">Round Summary</h3>
            <span className="text-[11px] print:text-[8.5px] font-semibold text-slate-500">Official WA Record</span>
          </div>
          <div className="overflow-x-auto p-4 print:p-1.5">
            <table className="w-full text-center border-collapse border border-slate-300 text-xs print:text-[9px] shadow-2xs rounded-xl overflow-hidden">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700 font-bold bg-slate-100/90">
                  <th className="py-2.5 px-3 print:py-1 print:px-1 text-left border-r border-slate-300">Round</th>
                  <th className="py-2.5 px-2 print:py-1 print:px-1 text-center border-r border-slate-300">Distance</th>
                  <th className="py-2.5 px-2 print:py-1 print:px-1 text-center font-black text-slate-900 border-r border-slate-300">Score</th>
                  <th className="py-2.5 px-2 print:py-1 print:px-1 text-center border-r border-slate-300">Max Score</th>
                  <th className="py-2.5 px-2 print:py-1 print:px-1 text-center border-r border-slate-300">Xs</th>
                  <th className="py-2.5 px-2 print:py-1 print:px-1 text-center border-r border-slate-300">10s</th>
                  <th className="py-2.5 px-2 print:py-1 print:px-1 text-center">9s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr className="border-b border-slate-200 hover:bg-slate-50/50">
                  <td className="py-3 px-3 print:py-0.5 print:px-1 text-left font-bold text-slate-900 border-r border-slate-300 bg-slate-50/50">Round 1</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 text-slate-700 font-semibold border-r border-slate-200">{eventDistance}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-black text-slate-900 text-sm print:text-xs border-r border-slate-200">{round1Total}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 text-slate-500 border-r border-slate-200">{maxPossibleScore}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-bold text-slate-700 border-r border-slate-200">{xsDisplay}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-bold text-slate-700 border-r border-slate-200">{tensDisplay}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-bold text-slate-700">{ninesDisplay}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-3 print:py-0.5 print:px-1 text-left font-extrabold text-slate-900 border-r border-slate-300">Total</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 border-r border-slate-200"></td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-black text-slate-900 text-sm print:text-xs border-r border-slate-200">{round1Total}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 text-slate-700 font-bold border-r border-slate-200">{maxPossibleScore}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-black text-slate-900 border-r border-slate-200">{xsDisplay}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-black text-slate-900 border-r border-slate-200">{tensDisplay}</td>
                  <td className="py-3 px-2 print:py-0.5 print:px-1 font-black text-slate-900">{ninesDisplay}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Coach Insight & Session Notes */}
        <div className="flex flex-col gap-4 print:gap-1.5">
          {/* Performance Progression Line Chart (50-300 X-axis, Round 1-6 Y-axis) */}
          <Card noPadding className="bg-white border border-slate-200/80 shadow-xs overflow-hidden print:border print:border-slate-300 print:shadow-none">
            <div className="p-4 print:py-1.5 print:px-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent print:w-3 print:h-3" />
                <h3 className="text-sm print:text-xs font-bold text-slate-900">
                  Performance Progression
                </h3>
              </div>
              <span className="text-[11px] print:text-[8.5px] font-semibold text-slate-500">
                Score Curve (50 – 300)
              </span>
            </div>

            <div className="p-4 print:p-2">
              {/* Responsive SVG Line Chart */}
              <div className="relative w-full h-[140px] print:h-[95px]">
                <svg viewBox="0 0 340 140" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="scoreLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Vertical grid lines & ticks: 50, 100, 150, 200, 250, 300 */}
                  {[50, 100, 150, 200, 250, 300].map((tick) => {
                    const x = 55 + ((tick - 50) / 250) * 265;
                    return (
                      <g key={tick}>
                        <line x1={x} y1="12" x2={x} y2="114" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                        <text x={x} y="128" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  {/* Horizontal grid lines & Y-axis labels: Round 1 (bottom) to Round 6 (top) */}
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const y = 114 - (idx / 5) * 102;
                    return (
                      <g key={idx}>
                        <line x1="55" y1={y} x2="320" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="48" y={y + 3} fontSize="8.5" fill="#64748b" textAnchor="end" fontWeight="bold">
                          Round {idx + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline axes */}
                  <line x1="55" y1="114" x2="320" y2="114" stroke="#e2e8f0" strokeWidth="1.2" />
                  <line x1="55" y1="12" x2="55" y2="114" stroke="#e2e8f0" strokeWidth="1.2" />

                  {/* Data Points calculation */}
                  {(() => {
                    const points = [0, 1, 2, 3, 4, 5].map((idx) => {
                      const running = runningTotals[idx] ?? (endTotals.slice(0, idx + 1).reduce((a, b) => a + b, 0));
                      const clamped = Math.max(50, Math.min(300, running));
                      const x = 55 + ((clamped - 50) / 250) * 265;
                      const y = 114 - (idx / 5) * 102;
                      return { x, y, score: running, delta: endTotals[idx] ?? 0 };
                    });

                    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
                    const areaPoints = `55,114 ${polylinePoints} 55,${points[points.length - 1].y}`;

                    return (
                      <>
                        {/* Area gradient under line */}
                        <polygon points={areaPoints} fill="url(#scoreAreaGrad)" />

                        {/* Connecting Line */}
                        <polyline
                          fill="none"
                          stroke="url(#scoreLineGrad)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />

                        {/* Point Circles & Labels */}
                        {points.map((pt, pIdx) => {
                          const isNearRight = pt.x > 285;
                          return (
                            <g key={pIdx}>
                              <circle cx={pt.x} cy={pt.y} r="5" fill="#fee2e2" />
                              <circle cx={pt.x} cy={pt.y} r="3" fill="#ef4444" />
                              <circle cx={pt.x} cy={pt.y} r="1.2" fill="#ffffff" />
                              <text
                                x={isNearRight ? pt.x - 7 : pt.x + 7}
                                y={pt.y + 3}
                                fontSize="8.5"
                                fontWeight="bold"
                                fill="#0f172a"
                                textAnchor={isNearRight ? "end" : "start"}
                              >
                                {pt.score}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] print:text-[8px] text-slate-500">
                <span>Cumulative progression: <strong className="text-slate-700">50 to 300 pts</strong></span>
                <span className="font-bold text-emerald-600">
                  Total: {round1Total} / {maxPossibleScore}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Session Notes */}
          <Card className="p-4 print:p-1.5 bg-white border border-slate-200/80 shadow-xs print:shadow-none flex items-start gap-3 print:gap-2">
            <div className="p-2 print:p-1 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
              <Target className="w-4 h-4 print:w-3 print:h-3" />
            </div>
            <div>
              <span className="text-xs print:text-[9px] font-bold text-slate-900">Session Notes</span>
              <p className="text-xs print:text-[8.5px] text-slate-500 mt-0.5 print:mt-0">
                {session.note || `${currentBowConfig.standardName} session`}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. ROUND-BY-ROUND TARGET HEATMAPS (ENDS 1 – 6) */}
      <Card noPadding className="mt-5 print:mt-2 bg-white border border-slate-200/80 shadow-xs overflow-hidden print:border print:border-slate-300 print:shadow-none">
        <div className="p-4 print:py-1.5 print:px-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent print:w-3 print:h-3" />
            <h3 className="text-sm print:text-xs font-bold text-slate-900">
              Round-by-Round Target Heatmaps (Ends 1 – 6)
            </h3>
          </div>
          <span className="text-[11px] print:text-[8.5px] font-semibold text-slate-500">
            Shot dispersion & grouping analysis
          </span>
        </div>

        <div className="p-4 print:p-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-6 gap-3 print:gap-1.5">
          {Array.from({ length: 6 }).map((_, endIdx) => {
            const structuredEnds = parseArrowDataEnds(session?.arrowData, ends);
            const endArrows = structuredEnds[endIdx] || [];
            const endScore = endTotals[endIdx] ?? 0;
            const endAvg = endArrows.length > 0 ? (endScore / endArrows.length).toFixed(1) : "0.0";

            return (
              <div
                key={endIdx}
                className="bg-slate-50/80 rounded-xl p-3 print:p-1 border border-slate-200/80 flex flex-col items-center text-center shadow-2xs"
              >
                <div className="flex items-center justify-between w-full mb-2 print:mb-1 px-1">
                  <span className="text-xs print:text-[9px] font-bold text-slate-800">
                    End {endIdx + 1}
                  </span>
                  <span className="text-xs print:text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    {endScore} pts
                  </span>
                </div>

                {/* SVG Target Face */}
                <div className="relative w-full aspect-square max-w-[130px] my-1 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                    {/* White (1 & 2) */}
                    <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
                    <circle cx="50" cy="50" r="41.4" fill="none" stroke="#E2E8F0" strokeWidth="0.6" />

                    {/* Black (3 & 4) */}
                    <circle cx="50" cy="50" r="36.8" fill="#1E293B" />
                    <circle cx="50" cy="50" r="32.2" fill="none" stroke="#475569" strokeWidth="0.5" />

                    {/* Blue (5 & 6) */}
                    <circle cx="50" cy="50" r="27.6" fill="#38BDF8" />
                    <circle cx="50" cy="50" r="23" fill="none" stroke="#0284C7" strokeWidth="0.5" />

                    {/* Red (7 & 8) */}
                    <circle cx="50" cy="50" r="18.4" fill="#EF4444" />
                    <circle cx="50" cy="50" r="13.8" fill="none" stroke="#B91C1C" strokeWidth="0.5" />

                    {/* Gold (9 & 10) */}
                    <circle cx="50" cy="50" r="9.2" fill="#FACC15" />
                    <circle cx="50" cy="50" r="4.6" fill="none" stroke="#A16207" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="2.3" fill="none" stroke="#A16207" strokeWidth="0.4" />

                    {/* Crosshair */}
                    <line x1="48" y1="50" x2="52" y2="50" stroke="#000" strokeWidth="0.5" />
                    <line x1="50" y1="48" x2="50" y2="52" stroke="#000" strokeWidth="0.5" />

                    {/* Arrows */}
                    {endArrows.slice(0, 6).map((arrow, aIdx) => {
                      const coords = getTargetShotCoordinates(arrow, aIdx, endIdx, 50, 50, 46);
                      return (
                        <g key={aIdx}>
                          <circle cx={coords.x} cy={coords.y} r="4" fill="#F97316" fillOpacity="0.4" />
                          <circle cx={coords.x} cy={coords.y} r="2.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.8" />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Arrow score chips */}
                <div className="grid grid-cols-6 gap-1 w-full mt-2 print:mt-1">
                  {endArrows.slice(0, 6).map((arrow, aIdx) => (
                    <span
                      key={aIdx}
                      className={`h-5 print:h-4 flex items-center justify-center rounded text-[10px] print:text-[8px] font-bold shadow-2xs ${getArrowBadgeClass(arrow.score)}`}
                    >
                      {arrow.score}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] print:text-[7.5px] text-slate-400 font-medium mt-1.5">
                  Avg: {endAvg} / arr
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  )}

      {/* Edit Modal */}
      {isEditOpen && session && (
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
              {athleteName} • {eventName} ({round1Total}/{maxPossibleScore}) • {selectedBow}
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
