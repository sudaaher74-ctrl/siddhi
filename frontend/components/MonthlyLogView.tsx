"use client";

import React, { useState, useMemo } from "react";
import { Session } from "@/lib/data";
import { useUser } from "@/hooks/useUser";
import {
  aggregateSessionsByDay,
  filterSessionsByMonth,
  filterSessionsByRange,
  exportMonthlyReportPDF,
  exportWeeklyReportPDF,
  DayAggregate,
} from "@/lib/pdfExport";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Calendar as CalendarIcon,
  List,
  Target,
  Award,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ManualSessionModal from "./ManualSessionModal";

interface MonthlyLogViewProps {
  initialSessions: Session[];
}

export default function MonthlyLogView({ initialSessions }: MonthlyLogViewProps) {
  const { user } = useUser();
  const [sessions] = useState<Session[]>(initialSessions);

  // Month & Year state (defaults to current date)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11

  // View mode: 'list' (day-by-day cards) or 'calendar' (monthly matrix)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [showWeekExportModal, setShowWeekExportModal] = useState<boolean>(false);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Filter sessions for currently selected month
  const monthSessions = useMemo(() => {
    return filterSessionsByMonth(sessions, currentYear, currentMonth);
  }, [sessions, currentYear, currentMonth]);

  // Aggregate day-by-day for current month
  const dayAggregates = useMemo(() => {
    return aggregateSessionsByDay(monthSessions);
  }, [monthSessions]);

  // Quick lookup map: dateKey -> DayAggregate
  const dayMap = useMemo(() => {
    const map = new Map<string, DayAggregate>();
    dayAggregates.forEach((d) => map.set(d.dateKey, d));
    return map;
  }, [dayAggregates]);

  // Monthly Overview KPIs
  const monthlyTotals = useMemo(() => {
    const totalArrows = monthSessions.reduce((sum, s) => sum + (Number(s.arrows) || 0), 0);
    const totalScore = monthSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
    const totalTens = monthSessions.reduce((sum, s) => sum + (Number(s.tens) || 0), 0);
    const avg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";
    const tenRate = totalArrows > 0 ? ((totalTens / totalArrows) * 100).toFixed(1) + "%" : "0%";
    const activeDays = dayAggregates.length;

    return {
      totalArrows,
      totalScore,
      avg,
      totalTens,
      tenRate,
      activeDays,
    };
  }, [monthSessions, dayAggregates]);

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("en-US", {
    month: "long",
  });

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // Calendar matrix calculations
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dayNum: number | null;
      dateKey: string | null;
      aggregate?: DayAggregate;
    }> = [];

    // Leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNum: null, dateKey: null });
    }

    // Days of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      const aggregate = dayMap.get(dateKey);

      days.push({
        dayNum: day,
        dateKey,
        aggregate,
      });
    }

    return days;
  }, [currentYear, currentMonth, dayMap]);

  // Weeks for Weekly PDF selector
  const monthWeeks = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeks: Array<{ weekNum: number; start: Date; end: Date; label: string }> = [];

    let currentDay = 1;
    let weekNum = 1;

    while (currentDay <= totalDaysInMonth) {
      const start = new Date(currentYear, currentMonth, currentDay);
      const endDay = Math.min(currentDay + 6, totalDaysInMonth);
      const end = new Date(currentYear, currentMonth, endDay);

      weeks.push({
        weekNum,
        start,
        end,
        label: `Week ${weekNum} (${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
      });

      currentDay += 7;
      weekNum++;
    }

    return weeks;
  }, [currentYear, currentMonth]);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Archery Logbook</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
              Day-to-Day Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track daily aggregated scores, arrows, accuracy, and export weekly/monthly PDF reports.
          </p>
        </div>

        {/* Month Picker Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-800 min-w-[140px] text-center">
              {monthName} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Action Bar: PDF Export Buttons & Views */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Monthly PDF Export Button */}
          <button
            onClick={() => exportMonthlyReportPDF(sessions, user, currentYear, currentMonth)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-soft text-black font-semibold text-xs transition-all shadow-sm active:scale-95"
          >
            <FileDown className="w-4 h-4 text-black" />
            Download Monthly PDF ({monthName})
          </button>

          {/* Weekly PDF Export Button */}
          <button
            onClick={() => setShowWeekExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs transition-all border border-slate-700 active:scale-95"
          >
            <CalendarIcon className="w-4 h-4 text-accent" />
            Download Weekly PDF...
          </button>
        </div>

        {/* View Switcher & Log button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "list" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Day-by-Day List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "calendar" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar Grid
            </button>
          </div>

          <ManualSessionModal />
        </div>
      </div>

      {/* Monthly KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Arrows</span>
            <Target className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold text-slate-900">{monthlyTotals.totalArrows.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{monthSessions.length} total sessions shot</div>
        </div>

        <div className="bg-white border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Score</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{monthlyTotals.totalScore.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Accumulated points</div>
        </div>

        <div className="bg-white border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg / Arrow</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{monthlyTotals.avg}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Average score per arrow</div>
        </div>

        <div className="bg-white border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">10s & Xs</span>
            <div className="w-4 h-4 rounded-full bg-yellow-400/20 border border-yellow-500 flex items-center justify-center text-[9px] font-bold text-yellow-700">
              X
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{monthlyTotals.totalTens}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{monthlyTotals.tenRate} 10+X rate</div>
        </div>

        <div className="bg-white border border-border p-4 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Days</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{monthlyTotals.activeDays} Days</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Training consistency</div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        /* DAY-BY-DAY LIST VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Day-to-Day Training Timeline ({dayAggregates.length} Days Recorded)
            </h2>
            <span className="text-xs text-slate-500">Showing {monthName} {currentYear}</span>
          </div>

          {dayAggregates.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No sessions recorded in {monthName} {currentYear}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Log your practice sessions or scoring rounds to track your day-to-day progress and download PDF reports.
              </p>
              <ManualSessionModal />
            </div>
          ) : (
            dayAggregates.map((day) => {
              const isExpanded = expandedDays[day.dateKey] ?? true; // default expanded

              return (
                <div
                  key={day.dateKey}
                  className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs transition-all hover:border-slate-300"
                >
                  {/* Day Aggregate Summary Header */}
                  <div
                    onClick={() => toggleDayExpanded(day.dateKey)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 cursor-pointer bg-slate-50/70 hover:bg-slate-50 border-b border-border transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                          {new Date(day.dateKey).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-base font-black leading-none">
                          {day.dateKey.split("-")[2]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">{day.dateLabel}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {day.sessionsCount} {day.sessionsCount === 1 ? "Session" : "Sessions"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {day.distances.length > 0 ? `Distances: ${day.distances.join(", ")}` : "All day shooting record"}
                        </div>
                      </div>
                    </div>

                    {/* Day Score Totals Pill */}
                    <div className="flex items-center gap-3 sm:gap-6 ml-auto">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">All Day Score</div>
                        <div className="text-base font-extrabold text-slate-900">
                          {day.score} <span className="text-xs text-slate-400 font-normal">pts</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Arrows</div>
                        <div className="text-base font-extrabold text-slate-900">{day.arrows}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Avg/Arrow</div>
                        <div className="text-base font-extrabold text-emerald-600">{day.avg.toFixed(2)}</div>
                      </div>

                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-400 font-medium">10s & Xs</div>
                        <div className="text-base font-extrabold text-amber-600">{day.tens}</div>
                      </div>

                      <div className="p-1 rounded-lg bg-slate-200/60 text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Individual Sessions Breakdown inside this day */}
                  {isExpanded && (
                    <div className="divide-y divide-border">
                      {day.sessions.map((session, idx) => {
                        const sessDate = session.createdAt ? new Date(session.createdAt) : null;
                        const timeString = sessDate
                          ? sessDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                          : "Logged";

                        return (
                          <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-slate-900">{session.name || "Training End"}</h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                    {session.type}
                                  </span>
                                  {session.distance && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                      {session.distance}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                  <span>Time: {timeString}</span>
                                  {session.note && (
                                    <span className="italic text-slate-600">&ldquo;{session.note}&rdquo;</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-center">
                                <span className="text-slate-400 block text-[10px]">Score</span>
                                <span className="font-bold text-slate-900">{session.score}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-center">
                                <span className="text-slate-400 block text-[10px]">Arrows</span>
                                <span className="font-bold text-slate-900">{session.arrows}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-center">
                                <span className="text-slate-400 block text-[10px]">Avg</span>
                                <span className="font-bold text-emerald-600">{Number(session.avg).toFixed(2)}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-center">
                                <span className="text-slate-400 block text-[10px]">10s</span>
                                <span className="font-bold text-amber-600">{session.tens}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CALENDAR GRID VIEW */
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.dayNum || !cell.dateKey) {
                return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 rounded-xl border border-transparent" />;
              }

              const hasShooting = Boolean(cell.aggregate);
              const isSelected = selectedDayKey === cell.dateKey;
              const isCurrentDay = cell.dateKey === today.toISOString().split("T")[0];

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => {
                    setSelectedDayKey(cell.dateKey === selectedDayKey ? null : cell.dateKey);
                  }}
                  className={`h-24 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                      : hasShooting
                      ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300"
                      : "bg-slate-50/40 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isCurrentDay
                          ? "bg-slate-900 text-white"
                          : hasShooting
                          ? "text-emerald-900 font-extrabold"
                          : "text-slate-600"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {hasShooting && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {hasShooting ? (
                    <div className="mt-auto">
                      <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                        {cell.aggregate?.score} <span className="text-[9px] font-normal text-slate-500">pts</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                        <span>{cell.aggregate?.arrows} arr</span>
                        <span className="font-semibold text-emerald-700">{cell.aggregate?.avg.toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 italic mt-auto">Rest</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* If a day is selected in calendar, show its sessions */}
          {selectedDayKey && (
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Selected Day: {dayMap.get(selectedDayKey)?.dateLabel || selectedDayKey}
                </h3>
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear Selection
                </button>
              </div>

              {dayMap.get(selectedDayKey) ? (
                <div className="space-y-2">
                  {dayMap.get(selectedDayKey)?.sessions.map((s, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{s.name || "Session"}</span>
                        <span className="text-slate-500">({s.type} - {s.distance || "Standard"})</span>
                        {s.note && <span className="text-slate-600 block text-[11px] mt-0.5">Note: {s.note}</span>}
                      </div>
                      <div className="flex gap-3 font-semibold text-slate-800">
                        <span>{s.arrows} Arrows</span>
                        <span>{s.score} Score</span>
                        <span className="text-emerald-600">Avg: {Number(s.avg).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No sessions recorded on this day.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Weekly Export Modal */}
      {showWeekExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Download Weekly PDF Report</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a week from {monthName} {currentYear} to generate an official weekly performance log.
            </p>

            <div className="space-y-2 mb-6">
              {monthWeeks.map((week) => {
                const weekSessions = filterSessionsByRange(sessions, week.start, week.end);
                const arrows = weekSessions.reduce((sum, s) => sum + (Number(s.arrows) || 0), 0);
                const score = weekSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0);

                return (
                  <button
                    key={week.weekNum}
                    onClick={() => {
                      exportWeeklyReportPDF(sessions, user, week.start, week.end, `Week ${week.weekNum}`);
                      setShowWeekExportModal(false);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-accent hover:bg-accent/5 text-left transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{week.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {weekSessions.length} sessions · {arrows} arrows · {score} pts
                      </div>
                    </div>
                    <FileDown className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowWeekExportModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
