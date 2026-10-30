"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Target,
  ChevronRight,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Session } from "@/lib/data";
import ScorecardModal from "./ScorecardModal";
import ManualSessionModal from "./ManualSessionModal";

interface RecentArrowLogProps {
  sessions?: Session[];
}

export type ParsedArrow = {
  score: string;
  cx?: number | null;
  cy?: number | null;
};

export type ParsedEnd = {
  endNumber: number;
  arrows: ParsedArrow[];
  endTotal: number;
};

export function parseSessionEnds(arrowData?: string): ParsedEnd[] {
  if (!arrowData) return [];
  try {
    const raw = JSON.parse(arrowData);
    if (!Array.isArray(raw)) return [];
    return raw.map((endArr, idx) => {
      if (!Array.isArray(endArr)) {
        return { endNumber: idx + 1, arrows: [], endTotal: 0 };
      }
      const arrows: ParsedArrow[] = endArr.map((item) => {
        if (typeof item === "object" && item !== null && "score" in item) {
          return {
            score: String((item as { score: unknown }).score),
            cx: (item as { cx?: number }).cx ?? null,
            cy: (item as { cy?: number }).cy ?? null,
          };
        }
        return { score: String(item) };
      });

      const endTotal = arrows.reduce((sum, a) => {
        const v = a.score.toUpperCase().trim();
        if (v === "X") return sum + 10;
        if (v === "M") return sum;
        const n = parseInt(v, 10);
        return sum + (isNaN(n) ? 0 : n);
      }, 0);

      return {
        endNumber: idx + 1,
        arrows,
        endTotal,
      };
    });
  } catch {
    return [];
  }
}

export function getArrowBadgeStyle(scoreStr: string, mode?: string) {
  const s = String(scoreStr).toUpperCase().trim();

  if (s === "X" || s === "10" || s === "9") {
    return {
      bg: "bg-amber-100 border-amber-400 text-amber-900 shadow-2xs",
      dot: "bg-amber-500",
      label: s,
    };
  }
  if (s === "8" || s === "7") {
    return {
      bg: "bg-rose-100 border-rose-300 text-rose-800 shadow-2xs",
      dot: "bg-rose-500",
      label: s,
    };
  }
  if (s === "6" || s === "5") {
    if (mode === "Field") {
      // In WA Field archery, 6 and 5 are Gold rings
      return {
        bg: "bg-amber-100 border-amber-400 text-amber-900 shadow-2xs",
        dot: "bg-amber-500",
        label: s,
      };
    }
    return {
      bg: "bg-sky-100 border-sky-300 text-sky-800 shadow-2xs",
      dot: "bg-sky-500",
      label: s,
    };
  }
  if (s === "4" || s === "3") {
    return {
      bg: "bg-slate-800 border-slate-700 text-white shadow-2xs",
      dot: "bg-slate-400",
      label: s,
    };
  }
  if (s === "2" || s === "1") {
    return {
      bg: "bg-white border-slate-300 text-slate-800 shadow-2xs",
      dot: "bg-slate-300",
      label: s,
    };
  }
  // Miss (M)
  return {
    bg: "bg-slate-100 border-slate-200 text-slate-400 shadow-2xs",
    dot: "bg-slate-300",
    label: s || "M",
  };
}

export default function RecentArrowLog({ sessions = [] }: RecentArrowLogProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Filter sessions by discipline if selected
  const filteredSessions = useMemo(() => {
    if (selectedDiscipline === "All") return sessions;
    return sessions.filter((s) => {
      const mode = s.mode || s.environment || "Outdoor";
      return mode.toLowerCase() === selectedDiscipline.toLowerCase();
    });
  }, [sessions, selectedDiscipline]);

  // Take the 5 most recent sessions
  const displaySessions = useMemo(() => {
    return filteredSessions.slice(0, 5);
  }, [filteredSessions]);

  // Aggregate recent arrows stream (up to last 24 arrows)
  const recentArrowsStream = useMemo(() => {
    const list: Array<{
      score: string;
      sessionName: string;
      endNum: number;
      mode?: string;
    }> = [];

    for (const s of filteredSessions) {
      const ends = parseSessionEnds(s.arrowData);
      for (const end of ends) {
        for (const a of end.arrows) {
          list.push({
            score: a.score,
            sessionName: s.name,
            endNum: end.endNumber,
            mode: s.mode || s.environment,
          });
          if (list.length >= 24) break;
        }
        if (list.length >= 24) break;
      }
      if (list.length >= 24) break;
    }
    return list;
  }, [filteredSessions]);

  const formatSessionDate = (dateStr?: string) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      if (isToday) return `Today at ${timeStr}`;
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      }) + ` • ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const getDisciplineBadgeClass = (mode?: string) => {
    const m = (mode || "Outdoor").toLowerCase();
    if (m === "indoor") return "bg-sky-100 text-sky-800 border-sky-200";
    if (m === "field") return "bg-amber-100 text-amber-900 border-amber-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-black tracking-tight text-slate-900">
                  Recent Arrow Log
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  {sessions.length} {sessions.length === 1 ? "round" : "rounds"}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 font-medium">
                Latest arrow scores, end breakdowns, and target plots
              </p>
            </div>
          </div>

          {/* Quick Actions & Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Discipline Filter */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold">
              {["All", "Outdoor", "Indoor", "Field"].map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedDiscipline === disc
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>

            {/* Shoot Action Button */}
            <Link
              href="/score-entry"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-[12px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Shoot</span>
            </Link>
          </div>
        </div>

        {/* Live Arrow Stream (Horizontal Shot Sequence) */}
        {recentArrowsStream.length > 0 && (
          <div className="pt-3.5 pb-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Latest Arrow Stream ({recentArrowsStream.length} shots)
              </span>
              <span className="text-[10px] lowercase tracking-normal text-slate-400 font-medium">
                ordered latest first
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {recentArrowsStream.map((item, idx) => {
                const style = getArrowBadgeStyle(item.score, item.mode);
                return (
                  <div
                    key={idx}
                    title={`${item.sessionName} • End ${item.endNum} • Arrow Score: ${item.score}`}
                    className={`min-w-[34px] h-[34px] sm:min-w-[38px] sm:h-[38px] rounded-lg sm:rounded-xl border flex flex-col items-center justify-center font-mono font-bold text-[13px] sm:text-[14px] cursor-pointer hover:scale-110 transition-transform ${style.bg}`}
                  >
                    <span>{item.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State when no sessions logged yet */}
        {displaySessions.length === 0 ? (
          <div className="py-8 sm:py-10 px-4 text-center flex flex-col items-center justify-center">
            {/* Visual target graphic */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center relative mb-4 shadow-inner">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-bold text-[9px]">
                    X
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 mb-1">
              No arrows logged yet
            </h3>
            <p className="text-[13px] text-slate-500 max-w-md mb-5 leading-relaxed">
              Every archer&apos;s journey starts with arrow #1. Hit the range with the live interactive plot, or log a practice round to see your recent arrow scores and end breakdowns here.
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              <Link
                href="/score-entry"
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-[13px] shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>Shoot & Plot Arrows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <ManualSessionModal />
            </div>

            {/* Sample End Preview Teaser */}
            <div className="mt-6 pt-5 border-t border-slate-100 max-w-sm w-full">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sample Arrow End Breakdown
              </span>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-500 mr-1">End 1:</span>
                {["X", "10", "9", "9", "8", "8"].map((s, i) => {
                  const style = getArrowBadgeStyle(s);
                  return (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center font-mono font-bold text-[11px] ${style.bg}`}
                    >
                      {s}
                    </span>
                  );
                })}
                <span className="text-[12px] font-extrabold text-slate-800 ml-1.5">
                  54 pts
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Recent Sessions List */
          <div className="divide-y divide-slate-100 mt-2">
            {displaySessions.map((session, sIdx) => {
              const ends = parseSessionEnds(session.arrowData);
              const scoreVal = Number(session.score) || 0;
              const arrowsVal = Number(session.arrows) || 0;
              const avgVal = session.avg
                ? String(session.avg)
                : arrowsVal > 0
                ? (scoreVal / arrowsVal).toFixed(2)
                : "0.00";
              const tensVal = session.tens ?? 0;
              const mode = session.mode || session.environment || "Outdoor";

              return (
                <div
                  key={session._id || session.id || sIdx}
                  onClick={() => setSelectedSession(session)}
                  className="py-3.5 sm:py-4 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-xl hover:bg-slate-50/80 active:bg-slate-100/80 transition-colors cursor-pointer group"
                >
                  {/* Top Metadata Row */}
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-bold text-[14px] sm:text-[15px] text-slate-900 group-hover:text-accent transition-colors truncate">
                        {session.name || "Archery Session"}
                      </span>

                      {/* Discipline Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getDisciplineBadgeClass(
                          mode
                        )}`}
                      >
                        {mode}
                      </span>

                      {/* Bow & Distance */}
                      {(session.bow || session.distance) && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {session.bow ? `${session.bow} ` : ""}
                          {session.distance ? `• ${session.distance}` : ""}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatSessionDate(session.createdAt)}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 group-hover:text-accent group-hover:bg-accent/10 transition-colors"
                        title="View Scorecard"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="flex items-center gap-3 sm:gap-6 text-xs text-slate-600 mb-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                      <span className="text-[16px] font-black text-slate-900 font-mono">
                        {scoreVal}
                      </span>
                    </div>
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Avg</span>
                      <span className="text-[13px] font-bold text-slate-700 font-mono">
                        {avgVal}
                      </span>
                    </div>
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Arrows</span>
                      <span className="text-[13px] font-bold text-slate-700 font-mono">
                        {arrowsVal}
                      </span>
                    </div>
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] uppercase font-bold text-amber-600">10+X</span>
                      <span className="text-[13px] font-bold text-amber-600 font-mono">
                        {tensVal}
                      </span>
                    </div>
                  </div>

                  {/* Ends Breakdown Pills */}
                  {ends.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {ends.slice(0, 2).map((end) => (
                        <div
                          key={end.endNumber}
                          className="flex items-center gap-1.5 flex-wrap"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-11 shrink-0">
                            End {end.endNumber}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {end.arrows.map((a, aIdx) => {
                              const style = getArrowBadgeStyle(a.score, mode);
                              return (
                                <span
                                  key={aIdx}
                                  className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-md border flex items-center justify-center font-mono font-bold text-[11px] ${style.bg}`}
                                >
                                  {a.score}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 font-mono ml-1">
                            = {end.endTotal} pts
                          </span>
                        </div>
                      ))}

                      {ends.length > 2 && (
                        <div className="text-[11px] text-accent font-semibold flex items-center gap-1 pt-0.5">
                          <span>+{ends.length - 2} more ends in full scorecard</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    session.note && (
                      <p className="text-[11px] text-slate-500 italic truncate">{session.note}</p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Link to Monthly Log */}
        {sessions.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500 font-medium">
              Showing {displaySessions.length} of {sessions.length} recorded rounds
            </span>
            <Link
              href="/monthly-log"
              className="text-accent hover:text-accent/80 font-bold flex items-center gap-1 transition-colors"
            >
              <span>View Full Monthly Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Scorecard Modal on Click */}
      <ScorecardModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </>
  );
}
