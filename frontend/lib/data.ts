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
  { label: "Arrows today", value: "84", delta: "▲ 12 vs avg", deltaColor: "var(--target-blue)" },
  { label: "Today's score", value: "661", delta: "PB pace +6", deltaColor: "var(--target-gold)" },
  { label: "Average", value: "9.18", delta: "▲ 0.21", deltaColor: "var(--target-blue)" },
  { label: "Accuracy", value: "87.3%", delta: "▲ 1.4%", deltaColor: "var(--target-blue)" },
  { label: "10 + X rate", value: "38%", delta: "▲ 3%", deltaColor: "var(--target-blue)" },
  { label: "Consistency", value: "91", delta: "— steady", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Practice time", value: "2:41", delta: "of 3:30 plan", deltaColor: "rgba(0,0,0,.4)" },
  { label: "Streak", value: "17d", delta: "🔥 best 23", deltaColor: "var(--accent-soft)" },
];

// Same seeded LCG as the design prototype so generated values match it exactly.
function makeRng(seed = 42) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

const rnd = makeRng();

export const arrowTimeline: ArrowTile[] = Array.from({ length: 36 }, () => {
  const r = rnd();
  const v = r < 0.16 ? 10 : r < 0.52 ? 9 : r < 0.8 ? 8 : r < 0.94 ? 7 : 6;
  const isX = v === 10 && rnd() < 0.35;
  return { v: isX ? "X" : String(v), c: v >= 9 ? "var(--target-gold)" : v >= 7 ? "var(--target-red)" : v >= 5 ? "var(--target-blue)" : v >= 3 ? "var(--target-black)" : "var(--target-white)" };
});

const HEAT_COLORS = [
  "rgba(0,0,0,0.045)",
  "rgba(229, 57, 53, 0.22)",
  "rgba(229, 57, 53, 0.42)",
  "rgba(229, 57, 53, 0.68)",
  "var(--accent)",
];

export const heatmap: string[] = Array.from({ length: 98 }, () => {
  const r = rnd();
  const lv = r < 0.2 ? 0 : r < 0.45 ? 1 : r < 0.72 ? 2 : r < 0.92 ? 3 : 4;
  return HEAT_COLORS[lv];
});

export const sessions: Session[] = [
  {
    name: "70m ranking round",
    type: "Outdoor",
    arrows: "84/108",
    score: "661",
    avg: "9.18",
    tens: "43",
    note: "Grouping tightened after end 8",
  },
  {
    name: "Morning volume block",
    type: "Blank bale",
    arrows: "120",
    score: "—",
    avg: "—",
    tens: "—",
    note: "Release timing +40ms consistent",
  },
  {
    name: "70m ranking round",
    type: "Outdoor",
    arrows: "72",
    score: "648",
    avg: "9.00",
    tens: "36",
    note: "Left drift in gusts > 4 m/s",
  },
  {
    name: "State trials — Q2",
    type: "Tournament",
    arrows: "72",
    score: "672",
    avg: "9.33",
    tens: "48",
    note: "Season best · qualified 3rd",
  },
];

// Arrow impact points on the target face (viewBox 0 0 230 230).
export const arrowPlotPoints: Array<[number, number]> = [
  [108, 104], [122, 112], [99, 118], [116, 99], [127, 121], [104, 127],
  [133, 96], [94, 99], [121, 132], [138, 118], [88, 130], [112, 86],
];

export const scoreTrendData = [
  { session: 1, score: 8.52 },
  { session: 2, score: 8.63 },
  { session: 3, score: 8.56 },
  { session: 4, score: 8.82 },
  { session: 5, score: 8.74 },
  { session: 6, score: 8.92 },
  { session: 7, score: 8.86 },
  { session: 8, score: 9.12 },
  { session: 9, score: 9.03 },
  { session: 10, score: 9.24 },
  { session: 11, score: 9.16 },
  { session: 12, score: 9.33 },
  { session: 13, score: 9.26 },
  { session: 14, score: 9.47 },
  { session: 15, score: 9.41 },
];
