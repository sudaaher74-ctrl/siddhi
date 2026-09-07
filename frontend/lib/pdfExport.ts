import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Session } from "./data";

export interface ArcherProfile {
  name?: string;
  email?: string;
  phone?: string;
}

export interface DayAggregate {
  dateKey: string; // YYYY-MM-DD
  dateLabel: string; // e.g., "Mon, 07 Sep 2026"
  dayOfWeek: string;
  arrows: number;
  score: number;
  avg: number;
  tens: number;
  sessionsCount: number;
  notes: string[];
  distances: string[];
  sessions: Session[];
}

/**
 * Groups sessions by day (YYYY-MM-DD)
 */
export function aggregateSessionsByDay(sessions: Session[]): DayAggregate[] {
  const map = new Map<string, DayAggregate>();

  for (const session of sessions) {
    const rawDate = session.createdAt ? new Date(session.createdAt) : new Date();
    const dateKey = rawDate.toISOString().split("T")[0]; // YYYY-MM-DD

    const arrows = Number(session.arrows) || 0;
    const score = Number(session.score) || 0;
    const tens = Number(session.tens) || 0;

    let day = map.get(dateKey);
    if (!day) {
      const dateLabel = rawDate.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const dayOfWeek = rawDate.toLocaleDateString("en-US", { weekday: "long" });

      day = {
        dateKey,
        dateLabel,
        dayOfWeek,
        arrows: 0,
        score: 0,
        avg: 0,
        tens: 0,
        sessionsCount: 0,
        notes: [],
        distances: [],
        sessions: [],
      };
      map.set(dateKey, day);
    }

    day.arrows += arrows;
    day.score += score;
    day.tens += tens;
    day.sessionsCount += 1;
    day.sessions.push(session);

    if (session.note && session.note.trim() && !day.notes.includes(session.note.trim())) {
      day.notes.push(session.note.trim());
    }
    if (session.distance && session.distance.trim() && !day.distances.includes(session.distance.trim())) {
      day.distances.push(session.distance.trim());
    }
  }

  // Calculate averages & sort by date descending
  const result: DayAggregate[] = [];
  for (const day of map.values()) {
    day.avg = day.arrows > 0 ? Number((day.score / day.arrows).toFixed(2)) : 0;
    result.push(day);
  }

  return result.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

/**
 * Filter sessions for a specific Month (year, monthIndex 0-11)
 */
export function filterSessionsByMonth(sessions: Session[], year: number, monthIndex: number): Session[] {
  return sessions.filter((s) => {
    const d = s.createdAt ? new Date(s.createdAt) : new Date();
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
}

/**
 * Filter sessions for a specific date range [startDate, endDate]
 */
export function filterSessionsByRange(sessions: Session[], startDate: Date, endDate: Date): Session[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return sessions.filter((s) => {
    const d = s.createdAt ? new Date(s.createdAt) : new Date();
    return d >= start && d <= end;
  });
}

/**
 * Generates and downloads a Monthly Archery Performance Report in PDF
 */
export function exportMonthlyReportPDF(
  sessions: Session[],
  user: ArcherProfile | null,
  year: number,
  monthIndex: number
) {
  const monthSessions = filterSessionsByMonth(sessions, year, monthIndex);
  const monthName = new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "long" });
  const titlePeriod = `${monthName} ${year}`;
  const filename = `Archery_Monthly_Log_${monthName}_${year}.pdf`;

  generatePDFReport({
    reportTitle: `Monthly Performance & Scoring Log`,
    reportSubtitle: `Training Record for ${titlePeriod}`,
    periodLabel: titlePeriod,
    sessions: monthSessions,
    user,
    filename,
  });
}

/**
 * Generates and downloads a Weekly Archery Performance Report in PDF
 */
export function exportWeeklyReportPDF(
  sessions: Session[],
  user: ArcherProfile | null,
  startDate: Date,
  endDate: Date,
  weekLabel?: string
) {
  const weekSessions = filterSessionsByRange(sessions, startDate, endDate);
  const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const period = `${startStr} – ${endStr}`;
  const label = weekLabel ? `${weekLabel} (${period})` : `Weekly Log (${period})`;
  const filename = `Archery_Weekly_Log_${startDate.toISOString().split("T")[0]}_to_${endDate.toISOString().split("T")[0]}.pdf`;

  generatePDFReport({
    reportTitle: `Weekly Archery Training Log`,
    reportSubtitle: label,
    periodLabel: period,
    sessions: weekSessions,
    user,
    filename,
  });
}

interface GeneratePDFParams {
  reportTitle: string;
  reportSubtitle: string;
  periodLabel: string;
  sessions: Session[];
  user: ArcherProfile | null;
  filename: string;
}

function generatePDFReport({
  reportTitle,
  reportSubtitle,
  periodLabel,
  sessions,
  user,
  filename,
}: GeneratePDFParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 75, "F");

  // Accent Line (Target Gold)
  doc.setFillColor(234, 179, 8); // yellow-500
  doc.rect(0, 75, pageWidth, 4, "F");

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(reportTitle.toUpperCase(), margin, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(reportSubtitle.toUpperCase(), margin, 54);

  // Metadata Right Aligned
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`, pageWidth - margin, 34, { align: "right" });
  doc.text(`World Archery Training Log`, pageWidth - margin, 54, { align: "right" });

  let y = 100;

  // Archer Information
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("ATHLETE PROFILE", margin, y);

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  const archerName = user?.name || "Athlete / Archer";
  const archerEmail = user?.email || "N/A";
  doc.text(`Archer: ${archerName}   |   Email: ${archerEmail}   |   Period: ${periodLabel}`, margin, y);

  y += 18;

  // Compute Overall KPI Aggregates
  const totalArrows = sessions.reduce((sum, s) => sum + (Number(s.arrows) || 0), 0);
  const totalScore = sessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
  const totalTens = sessions.reduce((sum, s) => sum + (Number(s.tens) || 0), 0);
  const overallAvg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";
  const tenRate = totalArrows > 0 ? ((totalTens / totalArrows) * 100).toFixed(1) + "%" : "0%";

  const dayAggregates = aggregateSessionsByDay(sessions);
  const activeDaysCount = dayAggregates.length;

  // KPI Summary Cards
  const kpis = [
    { label: "TOTAL ARROWS", val: totalArrows.toLocaleString() },
    { label: "TOTAL SCORE", val: totalScore.toLocaleString() },
    { label: "AVG / ARROW", val: overallAvg },
    { label: "10s + Xs", val: `${totalTens} (${tenRate})` },
    { label: "ACTIVE DAYS", val: `${activeDaysCount} Days` },
  ];

  const cardWidth = (pageWidth - margin * 2 - (kpis.length - 1) * 8) / kpis.length;
  kpis.forEach((kpi, index) => {
    const x = margin + index * (cardWidth + 8);
    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, y, cardWidth, 42, 4, 4, "FD");

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + cardWidth / 2, y + 18, { align: "center" });

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.label, x + cardWidth / 2, y + 33, { align: "center" });
  });

  y += 56;

  // Day-by-Day Aggregation Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DAY-TO-DAY PERFORMANCE BREAKDOWN", margin, y);
  y += 8;

  const dayRows = dayAggregates.map((day) => [
    day.dateLabel,
    String(day.sessionsCount),
    day.arrows.toLocaleString(),
    day.score.toLocaleString(),
    day.avg.toFixed(2),
    `${day.tens} (${day.arrows > 0 ? ((day.tens / day.arrows) * 100).toFixed(0) : 0}%)`,
    [day.distances.join(", "), day.notes.join("; ")].filter(Boolean).join(" — ") || "-",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Date", "Sessions", "Arrows", "Score", "Avg", "10s+Xs", "Distances & Notes"]],
    body: dayRows.length > 0 ? dayRows : [["No sessions recorded in this period", "-", "-", "-", "-", "-", "-"]],
    foot: dayRows.length > 0 ? [
      [
        `Totals (${activeDaysCount} Days)`,
        String(sessions.length),
        totalArrows.toLocaleString(),
        totalScore.toLocaleString(),
        overallAvg,
        `${totalTens} (${tenRate})`,
        "-",
      ],
    ] : undefined,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 95 },
      1: { halign: "center", cellWidth: 48 },
      2: { halign: "center", cellWidth: 50 },
      3: { halign: "center", cellWidth: 50 },
      4: { halign: "center", cellWidth: 42 },
      5: { halign: "center", cellWidth: 65 },
      6: { halign: "left" },
    },
    margin: { left: margin, right: margin },
  });

  // Next: Individual Sessions Log
  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ||
    y + 100;
  let sessionsTableY = finalY + 25;

  if (sessionsTableY > pageHeight - 120) {
    doc.addPage();
    sessionsTableY = 45;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DETAILED SESSION LOG", margin, sessionsTableY);
  sessionsTableY += 8;

  const sessionRows = sessions.map((s) => {
    const d = s.createdAt ? new Date(s.createdAt) : new Date();
    const timeStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return [
      timeStr,
      s.name || "Session",
      s.type || "Practice",
      s.distance || "-",
      String(s.arrows || 0),
      String(s.score || 0),
      Number(s.avg || 0).toFixed(2),
      String(s.tens || 0),
      s.note || "-",
    ];
  });

  autoTable(doc, {
    startY: sessionsTableY,
    head: [["Date & Time", "Name", "Type", "Dist", "Arrows", "Score", "Avg", "10s", "Notes"]],
    body: sessionRows.length > 0 ? sessionRows : [["No sessions recorded", "-", "-", "-", "-", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 85, fontStyle: "bold" },
      1: { cellWidth: 90 },
      2: { cellWidth: 52, halign: "center" },
      3: { cellWidth: 38, halign: "center" },
      4: { cellWidth: 38, halign: "center" },
      5: { cellWidth: 38, halign: "center" },
      6: { cellWidth: 35, halign: "center" },
      7: { cellWidth: 32, halign: "center" },
      8: { halign: "left" },
    },
    margin: { left: margin, right: margin },
  });

  // Page Numbers on All Pages
  const totalPages = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Page ${i} of ${totalPages}  |  ARCHERX AI Journal Log  |  Confidential & Personal Record`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
  }

  // Trigger browser download
  doc.save(filename);
}
