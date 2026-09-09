"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Session } from "@/lib/data";
import Card from "@/components/ui/Card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Target,
  Plus,
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  Crosshair,
  Zap,
  Eye,
  EyeOff,
  Flame,
} from "lucide-react";
import { apiFetch, apiPost } from "@/lib/api";

export interface Goal {
  _id?: string;
  id?: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  progress: number;
  completed: boolean;
  metricType?: "avg" | "score" | "tens" | "arrows";
  createdAt?: string;
}

export interface ChartPoint {
  idx: number;
  id: string;
  name: string;
  date: string;
  fullDate: string;
  value: number;
  avg: number;
  score: number;
  tens: number;
  arrows: number;
  tenRate: number;
  distance?: string;
  bow?: string;
  sessionsCount?: number;
}

type MetricType = "avg" | "score" | "tens" | "arrows";
type TimeframeType = "ALL" | "D" | "W" | "M";

const METRIC_CONFIG: Record<
  MetricType,
  { label: string; unit: string; domain: [number | "auto", number | "auto"]; precision: number }
> = {
  avg: {
    label: "Arrow Average",
    unit: "pts/arrow",
    domain: [6, 10.5],
    precision: 2,
  },
  score: {
    label: "Total Score",
    unit: "pts",
    domain: ["auto", "auto"],
    precision: 0,
  },
  tens: {
    label: "10s + Xs Rate",
    unit: "%",
    domain: [0, 100],
    precision: 1,
  },
  arrows: {
    label: "Arrow Volume",
    unit: "arrows",
    domain: [0, "auto"],
    precision: 0,
  },
};

export default function AnalyticsGoalChart({
  sessions = [],
  initialGoals = [],
}: {
  sessions?: Session[];
  initialGoals?: Goal[];
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [activeMetric, setActiveMetric] = useState<MetricType>("avg");
  const [timeframe, setTimeframe] = useState<TimeframeType>("ALL");
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [showGoalLine, setShowGoalLine] = useState(true);
  const [showAvgLine, setShowAvgLine] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    metricType: "avg" as MetricType,
    target: "9.80",
    current: "",
    deadline: "End of Month",
    progress: "0",
  });

  // Fetch latest goals from API if needed
  const reloadGoals = async () => {
    try {
      const data = await apiFetch<Goal[]>("/api/goals");
      if (Array.isArray(data)) {
        setGoals(data);
      }
    } catch (err) {
      console.error("Failed to load goals for chart:", err);
    }
  };

  useEffect(() => {
    if (initialGoals.length === 0) {
      reloadGoals();
    }
  }, [initialGoals.length]);

  // Determine active goal or default to the most relevant goal for the active metric
  const selectedGoal = useMemo(() => {
    if (goals.length === 0) return null;
    if (activeGoalId) {
      const found = goals.find((g) => (g._id || g.id) === activeGoalId);
      if (found) return found;
    }
    // Auto-select goal matching active metric or first active goal
    const matched = goals.find((g) => {
      const targetNum = parseFloat(g.target.replace(/[^0-9.]/g, ""));
      if (activeMetric === "avg" && targetNum <= 10.5 && targetNum >= 6) return true;
      if (activeMetric === "score" && targetNum > 50) return true;
      if (activeMetric === "tens" && targetNum <= 100 && targetNum >= 10) return true;
      return false;
    });
    return matched || goals[0];
  }, [goals, activeGoalId, activeMetric]);

  // Extract numeric target from selected goal
  const goalTargetValue = useMemo(() => {
    if (!selectedGoal) return null;
    const cleaned = parseFloat(selectedGoal.target.replace(/[^0-9.]/g, ""));
    return isNaN(cleaned) ? null : cleaned;
  }, [selectedGoal]);

  // Transform and aggregate sessions into chart data based on timeframe & metric
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!sessions || sessions.length === 0) return [];

    // Chronological order: oldest to newest
    const sorted = [...sessions].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    if (timeframe === "ALL") {
      return sorted.map((s, idx): ChartPoint => {
        const avg = Number(s.avg) || 0;
        const score = Number(s.score) || 0;
        const tens = Number(s.tens) || 0;
        const arrows = Number(s.arrows) || 1;
        const tenRate = arrows > 0 ? (tens / arrows) * 100 : 0;

        let val = avg;
        if (activeMetric === "score") val = score;
        if (activeMetric === "tens") val = tenRate;
        if (activeMetric === "arrows") val = arrows;

        const dateObj = s.createdAt ? new Date(s.createdAt) : new Date();
        const formattedDate = dateObj.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

        return {
          idx: idx + 1,
          id: s._id || s.id || `session-${idx}`,
          name: s.name || `Session ${idx + 1}`,
          date: formattedDate,
          fullDate: dateObj.toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          value: Number(val.toFixed(METRIC_CONFIG[activeMetric].precision)),
          avg,
          score,
          tens,
          arrows,
          tenRate: Number(tenRate.toFixed(1)),
          distance: s.distance,
          bow: s.bow,
        };
      });
    }

    // Aggregated grouping (Daily, Weekly, Monthly)
    const groupedMap = new Map<
      string,
      {
        key: string;
        date: string;
        fullDate: string;
        timestamp: number;
        totalScore: number;
        totalAvg: number;
        totalTens: number;
        totalArrows: number;
        count: number;
      }
    >();

    sorted.forEach((s) => {
      if (!s.createdAt) return;
      const d = new Date(s.createdAt);
      let groupKey = "";
      let label = "";

      if (timeframe === "D") {
        groupKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      } else if (timeframe === "W") {
        // Week grouping: determine start of week
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        groupKey = `${startOfWeek.getFullYear()}-W${Math.ceil((d.getDate() + 6) / 7)}`;
        label = `Wk of ${startOfWeek.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
      } else if (timeframe === "M") {
        groupKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
        label = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      }

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          key: groupKey,
          date: label,
          fullDate: label,
          timestamp: d.getTime(),
          totalScore: 0,
          totalAvg: 0,
          totalTens: 0,
          totalArrows: 0,
          count: 0,
        });
      }

      const item = groupedMap.get(groupKey)!;
      item.totalScore += Number(s.score) || 0;
      item.totalAvg += Number(s.avg) || 0;
      item.totalTens += Number(s.tens) || 0;
      item.totalArrows += Number(s.arrows) || 1;
      item.count += 1;
    });

    const aggregated = Array.from(groupedMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );

    return aggregated.map((g, idx): ChartPoint => {
      const avg = g.count > 0 ? g.totalAvg / g.count : 0;
      const score = g.totalScore;
      const tens = g.totalTens;
      const arrows = g.totalArrows;
      const tenRate = arrows > 0 ? (tens / arrows) * 100 : 0;

      let val = avg;
      if (activeMetric === "score") val = score;
      if (activeMetric === "tens") val = tenRate;
      if (activeMetric === "arrows") val = arrows;

      return {
        idx: idx + 1,
        id: g.key,
        name: g.date,
        date: g.date,
        fullDate: g.fullDate,
        value: Number(val.toFixed(METRIC_CONFIG[activeMetric].precision)),
        avg: Number(avg.toFixed(2)),
        score,
        tens,
        arrows,
        tenRate: Number(tenRate.toFixed(1)),
        sessionsCount: g.count,
        distance: undefined,
        bow: undefined,
      };
    });
  }, [sessions, timeframe, activeMetric]);

  // Key Analytics Calculations ("Where We Are Now")
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentValue: 0,
        overallAvg: 0,
        bestValue: 0,
        previousValue: 0,
        trendDelta: 0,
        gapToGoal: null,
        goalPercent: 0,
        totalArrows: 0,
        sessionsCount: 0,
      };
    }

    const currentItem = chartData[chartData.length - 1];
    const prevItem = chartData.length > 1 ? chartData[chartData.length - 2] : null;

    const values = chartData.map((d) => d.value);
    const currentValue = currentItem.value;
    const previousValue = prevItem ? prevItem.value : currentValue;
    const trendDelta = Number((currentValue - previousValue).toFixed(2));
    const bestValue = Math.max(...values);
    const overallAvg = Number(
      (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(
        METRIC_CONFIG[activeMetric].precision
      )
    );

    let gapToGoal: number | null = null;
    let goalPercent = 0;
    if (goalTargetValue !== null && goalTargetValue > 0) {
      gapToGoal = Number((currentValue - goalTargetValue).toFixed(2));
      goalPercent = Math.min(100, Math.max(0, Math.round((currentValue / goalTargetValue) * 100)));
    }

    const totalArrows = sessions.reduce((sum, s) => sum + (Number(s.arrows) || 0), 0);

    return {
      currentValue,
      overallAvg,
      bestValue,
      previousValue,
      trendDelta,
      gapToGoal,
      goalPercent,
      totalArrows,
      sessionsCount: sessions.length,
    };
  }, [chartData, activeMetric, goalTargetValue, sessions]);

  // Open modal with smart default based on current standing
  const handleOpenAddGoal = () => {
    let defaultTarget = "9.80";
    if (activeMetric === "avg") {
      defaultTarget = (stats.currentValue > 0 ? (stats.currentValue + 0.3).toFixed(2) : "9.80");
    } else if (activeMetric === "score") {
      defaultTarget = (stats.currentValue > 0 ? Math.round(stats.currentValue * 1.1).toString() : "350");
    } else if (activeMetric === "tens") {
      defaultTarget = "75%";
    } else if (activeMetric === "arrows") {
      defaultTarget = "1000";
    }

    setFormData({
      title: `Achieve ${defaultTarget} ${METRIC_CONFIG[activeMetric].label}`,
      metricType: activeMetric,
      target: defaultTarget,
      current: stats.currentValue.toString(),
      deadline: "End of Month",
      progress: stats.goalPercent ? stats.goalPercent.toString() : "50",
    });
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const progressNum = parseInt(formData.progress) || 0;
      const payload = {
        title: formData.title,
        target: formData.target,
        current: formData.current || `${stats.currentValue}`,
        deadline: formData.deadline,
        progress: progressNum,
        completed: progressNum >= 100,
      };

      const newGoal = await apiPost<Goal>("/api/goals", payload);
      if (newGoal && (newGoal._id || newGoal.id)) {
        setActiveGoalId(newGoal._id || newGoal.id || null);
      }
      setIsModalOpen(false);
      await reloadGoals();
    } catch (err) {
      console.error("Failed to add goal:", err);
      alert(err instanceof Error ? err.message : "Failed to save goal");
    } finally {
      setIsSaving(false);
    }
  };

  const currentMetricCfg = METRIC_CONFIG[activeMetric];

  return (
    <Card className="p-5 sm:p-7 relative overflow-hidden">
      {/* Decorative subtle background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none -mb-20" />

      {/* Main Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-black/[0.06] relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex p-1.5 rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Performance &amp; Goal Analytics
            </h2>
          </div>
          <p className="text-[12px] text-slate-500 mt-1">
            Track your all-over progress, pinpoint where you stand right now, and benchmark against active targets.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe selector */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-[11px] font-semibold">
            {(["ALL", "D", "W", "M"] as TimeframeType[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === tf
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tf === "ALL" ? "All Over" : tf === "D" ? "Daily" : tf === "W" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>

          {/* Metric Selector Dropdown / Pill Group */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-[11px] font-semibold">
            {(["avg", "score", "tens", "arrows"] as MetricType[]).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeMetric === m
                    ? "bg-accent text-white shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {m === "avg"
                  ? "Avg / Arrow"
                  : m === "score"
                  ? "Total Score"
                  : m === "tens"
                  ? "10+X %"
                  : "Arrows"}
              </button>
            ))}
          </div>

          {/* Add Goal Button */}
          <button
            onClick={handleOpenAddGoal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-semibold transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* "Where We Are Now" HUD Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-5 relative z-10">
        {/* Card 1: Where We Are Now (Current Standing) */}
        <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-accent" />
              Where You Stand
            </span>
            <span className="bg-accent/10 text-accent font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold">
              LATEST
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.currentValue > 0 ? stats.currentValue : "--"}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {currentMetricCfg.unit}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {stats.trendDelta >= 0 ? (
              <span className="text-emerald-600 font-bold flex items-center">
                +{stats.trendDelta} vs last
              </span>
            ) : (
              <span className="text-rose-600 font-bold flex items-center">
                {stats.trendDelta} vs last
              </span>
            )}
            <span className="text-slate-400">• Current pace</span>
          </div>
        </div>

        {/* Card 2: Active Goal Benchmark */}
        <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1 text-slate-700">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              Active Goal
            </span>
            {selectedGoal && (
              <button
                onClick={() => setShowGoalLine(!showGoalLine)}
                className="text-slate-400 hover:text-slate-600"
                title={showGoalLine ? "Hide goal line" : "Show goal line"}
              >
                {showGoalLine ? (
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">
              {selectedGoal ? selectedGoal.target : "No Goal"}
            </span>
            {selectedGoal && (
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-[90px]">
                {selectedGoal.deadline ? `by ${selectedGoal.deadline}` : ""}
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {selectedGoal ? selectedGoal.title : "Click '+ Add Goal' above to set one"}
          </div>
        </div>

        {/* Card 3: Gap to Target / Achievement */}
        <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Goal Status
            </span>
            {stats.gapToGoal !== null && (
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  stats.gapToGoal >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {stats.gapToGoal >= 0 ? "TARGET MET" : "IN PROGRESS"}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {stats.gapToGoal !== null ? (
              <>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    stats.gapToGoal >= 0 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {stats.gapToGoal > 0 ? `+${stats.gapToGoal}` : stats.gapToGoal}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {stats.gapToGoal >= 0 ? "above target" : "to reach goal"}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-slate-400">--</span>
            )}
          </div>
          {/* Mini progress bar */}
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                stats.goalPercent >= 100
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-amber-400 to-accent"
              }`}
              style={{ width: `${Math.min(100, stats.goalPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 4: All-Over Best & Career Average */}
        <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              All-Time Career
            </span>
            <span className="text-slate-400 text-[10px] font-mono">
              {stats.sessionsCount} sessions
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.bestValue > 0 ? stats.bestValue : "--"}
            </span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold">
              PEAK
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              All-Over Avg: <strong className="text-slate-700 font-mono">{stats.overallAvg}</strong>
            </span>
            <span>• {stats.totalArrows} arrows</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      {chartData.length === 0 ? (
        <div className="w-full h-[320px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 my-2">
          <Flame className="w-10 h-10 text-accent/30 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No session data logged yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Log your training rounds in Score Entry or Practice to unlock comprehensive analytics and goal progression charts.
          </p>
        </div>
      ) : (
        <div className="w-full h-[340px] sm:h-[380px] mt-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 16, left: -10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E53935" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="#E53935" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#E53935" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(0, 0, 0, 0.05)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                tickLine={false}
                tick={{
                  fill: "rgba(0,0,0,0.45)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono), monospace",
                }}
              />

              <YAxis
                domain={currentMetricCfg.domain}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "rgba(0,0,0,0.45)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono), monospace",
                }}
                unit={activeMetric === "tens" ? "%" : ""}
              />

              {/* Goal Target Benchmark Line */}
              {showGoalLine && goalTargetValue !== null && (
                <ReferenceLine
                  y={goalTargetValue}
                  stroke="#F59E0B"
                  strokeDasharray="5 4"
                  strokeWidth={2}
                  label={{
                    value: `🎯 Target Goal: ${selectedGoal?.target || goalTargetValue}`,
                    position: "insideTopRight",
                    fill: "#B45309",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              )}

              {/* Overall Average Reference Line */}
              {showAvgLine && stats.overallAvg > 0 && (
                <ReferenceLine
                  y={stats.overallAvg}
                  stroke="rgba(15, 23, 42, 0.3)"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Avg: ${stats.overallAvg}`,
                    position: "insideBottomLeft",
                    fill: "rgba(15, 23, 42, 0.5)",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                />
              )}

              {/* Custom Tooltip */}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  const currentVal = data.value;
                  const diffFromGoal =
                    goalTargetValue !== null ? Number((currentVal - goalTargetValue).toFixed(2)) : null;

                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs min-w-[200px] animate-in fade-in-50 zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-slate-200">{data.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{data.fullDate}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{currentMetricCfg.label}:</span>
                          <span className="font-bold font-mono text-accent text-sm">
                            {data.value} {currentMetricCfg.unit}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Total Score:</span>
                          <span className="font-mono text-slate-200">
                            {data.score} ({data.arrows} arrows)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">10s + Xs:</span>
                          <span className="font-mono text-amber-400">
                            {data.tens} ({data.tenRate}%)
                          </span>
                        </div>

                        {diffFromGoal !== null && (
                          <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Vs Active Goal:</span>
                            <span
                              className={`font-bold font-mono ${
                                diffFromGoal >= 0 ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {diffFromGoal >= 0 ? `+${diffFromGoal} 🎯` : `${diffFromGoal} pts`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Main Area Plot with Accent Curve */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#E53935"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#analyticsGradient)"
                animationDuration={1200}
                animationEasing="ease-out"
                activeDot={{
                  r: 6,
                  fill: "#FFFFFF",
                  stroke: "#E53935",
                  strokeWidth: 3,
                  className: "drop-shadow-[0_2px_8px_rgba(229,57,53,0.5)]",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Goal Selector & Active Goals Strip */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-accent" />
            Your Benchmark Goals:
          </span>

          {goals.length === 0 ? (
            <span className="text-slate-400 italic">
              No custom goals set yet. Click &quot;Add Goal&quot; to project your first target line!
            </span>
          ) : (
            goals.map((g) => {
              const gid = g._id || g.id || g.title;
              const isSelected = selectedGoal && (selectedGoal._id || selectedGoal.id) === gid;
              return (
                <button
                  key={gid}
                  onClick={() => {
                    setActiveGoalId(gid);
                    setShowGoalLine(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-800 font-bold shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {g.completed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Target className="w-3 h-3 text-amber-500" />
                  )}
                  <span>{g.title}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {g.target}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Legend toggles */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 self-end md:self-auto">
          <button
            onClick={() => setShowAvgLine(!showAvgLine)}
            className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer"
          >
            <span className="w-3 h-0.5 bg-slate-400 inline-block border-t border-dashed" />
            <span>{showAvgLine ? "Hide All-Time Avg" : "Show All-Time Avg"}</span>
          </button>
          <button
            onClick={() => setShowGoalLine(!showGoalLine)}
            className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer text-amber-600 font-semibold"
          >
            <span className="w-3 h-0.5 bg-amber-500 inline-block border-t border-dashed" />
            <span>{showGoalLine ? "Active Target Line" : "Hidden Target Line"}</span>
          </button>
        </div>
      </div>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-accent/10 text-accent rounded-lg">
                  <Target className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Performance Goal</h3>
                  <p className="text-xs text-slate-500">Benchmark your progress right on the analytics chart.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Average 9.80 per arrow consistently"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                    Target Metric
                  </label>
                  <select
                    value={formData.metricType}
                    onChange={(e) => {
                      const m = e.target.value as MetricType;
                      setFormData({
                        ...formData,
                        metricType: m,
                        target:
                          m === "avg"
                            ? "9.80"
                            : m === "score"
                            ? "350"
                            : m === "tens"
                            ? "75%"
                            : "1000",
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-accent"
                  >
                    <option value="avg">Arrow Average</option>
                    <option value="score">Total Score</option>
                    <option value="tens">10+X Rate %</option>
                    <option value="arrows">Arrow Volume</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                    Target Value
                  </label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="e.g. 9.80"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                    Current Level
                  </label>
                  <input
                    type="text"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                    placeholder="e.g. 9.20"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                    Target Deadline
                  </label>
                  <input
                    type="text"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    placeholder="e.g. Oct 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                  Initial Progress (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                    className="flex-1 accent-accent"
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 w-10 text-right">
                    {formData.progress}%
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving Goal..." : "Add to Chart"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
