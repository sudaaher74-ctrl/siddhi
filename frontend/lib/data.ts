// Mock data for the Range Command dashboard (design option 1a).
// Replace with real API/DB queries when the backend lands.

export type NavItem = { label: string; href: string; dotShape: "circle" | "square" | "bar" };
export type Kpi = { label: string; value: string; delta: string; deltaColor: string };
export type ArrowTile = { v: string; c: string };
export type Session = {
  name: string;
  type: string;
  arrows: string;
  score: string;
  avg: string;
  tens: string;
  note: string;
};

const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Practice", href: "/practice" },
  { label: "Score Entry", href: "/score-entry" },
  { label: "Analytics", href: "/analytics" },
  { label: "AI Coach", href: "/ai-coach" },
  { label: "Equipment", href: "/equipment" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Goals", href: "/goals" },
];

export const navItems: NavItem[] = navLinks.map((item, i) => ({
  ...item,
  dotShape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "square" : "bar",
}));

export const kpis: Kpi[] = [
  { label: "Arrows today", value: "0", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Today's score", value: "0", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Average", value: "0.00", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Accuracy", value: "0%", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "10 + X rate", value: "0%", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Consistency", value: "0", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Practice time", value: "0:00", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Streak", value: "0d", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
];

export const arrowTimeline: ArrowTile[] = [];

export const heatmap: string[] = Array.from({ length: 98 }, () => "rgba(0,0,0,0.02)");

export const sessions: Session[] = [];

// Arrow impact points on the target face (viewBox 0 0 230 230).
export const arrowPlotPoints: Array<[number, number]> = [];

export const scoreTrendData: Array<{session: number, score: number}> = [];
