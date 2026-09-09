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

export interface ExportScorecardParams {
  athleteName: string;
  selectedBow: string;
  distance: string;
  formattedDate: string;
  eventName: string;
  venueName?: string;
  standardName?: string;
  round1Total: number;
  maxPossibleScore: number;
  scorePercentage: string;
  averagePerArrow: string;
  tensDisplay: number;
  xsDisplay: number;
  ninesDisplay: number;
  totalArrowsCount: number;
  ends: string[][];
  endTotals: number[];
  runningTotals: number[];
  coachInsight?: string;
  sessionNote?: string;
  session?: Session;
}

/**
 * Generates and downloads an Official Archery Scorecard guaranteed to fit on EXACTLY ONE A4 PAGE.
 */
export function exportScorecardPDF(params: ExportScorecardParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Header Banner (slate-900 with red/gold accents)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 58, "F");

  // Accent Line (Target Red)
  doc.setFillColor(229, 57, 53); // target-red
  doc.rect(0, 58, pageWidth, 3.5, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("ARCHERX AI  |  OFFICIAL SCORECARD", margin, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("WORLD ARCHERY RECOGNIZED ROUND RECORD", margin, 42);

  // Top Right Info
  doc.setFontSize(8.5);
  doc.text(`Date: ${params.formattedDate}`, pageWidth - margin, 26, { align: "right" });
  doc.text(`${params.selectedBow} • ${params.distance}`, pageWidth - margin, 42, { align: "right" });

  let y = 74;

  // 2. Athlete Information Box with Olympic Target Face
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, 38, 4, 4, "FD");

  // World Archery Official 5-Zone Concentric Target Graphic (Right of athlete box)
  const targetX = margin + contentWidth - 25;
  const targetY = y + 19;
  // White Ring 1-2
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.circle(targetX, targetY, 13, "FD");
  // Black Ring 3-4
  doc.setFillColor(30, 41, 59);
  doc.circle(targetX, targetY, 10.4, "F");
  // Blue Ring 5-6
  doc.setFillColor(2, 132, 199);
  doc.circle(targetX, targetY, 7.8, "F");
  // Red Ring 7-8
  doc.setFillColor(225, 29, 72);
  doc.circle(targetX, targetY, 5.2, "F");
  // Gold Ring 9-10
  doc.setFillColor(250, 204, 21);
  doc.circle(targetX, targetY, 2.6, "F");
  // Inner X crosshair
  doc.setDrawColor(161, 98, 7);
  doc.setLineWidth(0.3);
  doc.line(targetX - 1.2, targetY, targetX + 1.2, targetY);
  doc.line(targetX, targetY - 1.2, targetX, targetY + 1.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(params.athleteName, margin + 12, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Event: ${params.eventName}   |   Standard: ${params.standardName || "World Archery Target"}   |   Venue: ${params.venueName || "Outdoor Range"}`,
    margin + 12,
    y + 30
  );

  y += 46;

  // 3. Four KPI Metric Cards (With color-coded top accent stripes)
  const kpis = [
    { label: "ROUND 1 SCORE", val: `${params.round1Total} / ${params.maxPossibleScore}`, sub: `(${params.scorePercentage}%)`, color: [15, 23, 42], accent: [229, 57, 53] },
    { label: "ARROW AVERAGE", val: params.averagePerArrow, sub: "pts / arrow", color: [5, 150, 105], accent: [16, 185, 129] }, // emerald
    { label: "10s COUNT", val: `${params.tensDisplay}`, sub: "Gold Hits", color: [217, 119, 6], accent: [245, 158, 11] }, // amber
    { label: params.selectedBow === "Compound Bow" ? "COMPOUND X-RING" : "INNER-X (Xs)", val: `${params.xsDisplay}`, sub: "Bullseyes", color: [234, 88, 12], accent: [249, 115, 22] }, // orange
  ];

  const cardWidth = (contentWidth - 3 * 8) / 4;
  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 8);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.roundedRect(cardX, y, cardWidth, 42, 4, 4, "FD");

    // Top Color Stripe
    doc.setFillColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.rect(cardX + 4, y, cardWidth - 8, 2.5, "F");

    // Top Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + cardWidth / 2, y + 13, { align: "center" });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, cardX + cardWidth / 2, y + 27, { align: "center" });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, cardX + cardWidth / 2, y + 37, { align: "center" });
  });

  y += 50;

  // 4. Detailed Scores Table (autoTable)
  const tableHeaders = [
    ["End", "Arrow 1", "Arrow 2", "Arrow 3", "Arrow 4", "Arrow 5", "Arrow 6", "End Total", "Running Total"]
  ];

  const tableRows: (string | number)[][] = [];
  const safeEnds = params.ends.slice(0, 6);

  safeEnds.forEach((endRow, endIdx) => {
    const row: (string | number)[] = [endIdx + 1];
    for (let a = 0; a < 6; a++) {
      row.push(endRow[a] || "-");
    }
    row.push(params.endTotals[endIdx] || 0);
    row.push(params.runningTotals[endIdx] || 0);
    tableRows.push(row);
  });

  // Total footer row
  tableRows.push([
    "Total",
    "",
    "",
    "",
    "",
    "",
    "",
    params.round1Total,
    params.round1Total,
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 3.2,
      halign: "center",
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] },
      1: { cellWidth: 46 },
      2: { cellWidth: 46 },
      3: { cellWidth: 46 },
      4: { cellWidth: 46 },
      5: { cellWidth: 46 },
      6: { cellWidth: 46 },
      7: { cellWidth: 54, fontStyle: "bold", halign: "center", fillColor: [241, 245, 249] },
      8: { cellWidth: 65, fontStyle: "bold", halign: "center", fillColor: [241, 245, 249] },
    },
    didParseCell: (data) => {
      // Color arrow cells based on archery zones
      if (data.section === "body") {
        const isFooterRow = data.row.index === tableRows.length - 1;
        if (isFooterRow) {
          data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          data.cell.styles.textColor = [146, 64, 14]; // amber-800
          data.cell.styles.fontStyle = "bold";
          if (data.column.index === 0) {
            data.cell.styles.halign = "left";
          }
          return;
        }

        const col = data.column.index;
        if (col >= 1 && col <= 6) {
          const val = String(data.cell.raw).toUpperCase().trim();
          if (val === "X" || val === "10") {
            data.cell.styles.fillColor = [254, 240, 138]; // Gold-200
            data.cell.styles.textColor = [113, 63, 18]; // Gold-900
            data.cell.styles.fontStyle = "bold";
          } else if (val === "9") {
            data.cell.styles.fillColor = [254, 249, 195]; // Gold-100
            data.cell.styles.textColor = [133, 77, 14]; // Gold-800
            data.cell.styles.fontStyle = "bold";
          } else if (val === "8" || val === "7") {
            data.cell.styles.fillColor = [254, 202, 202]; // Red-200
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "6" || val === "5") {
            data.cell.styles.fillColor = [186, 230, 253]; // Blue-200
            data.cell.styles.textColor = [7, 89, 133];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "4" || val === "3") {
            data.cell.styles.fillColor = [51, 65, 85]; // Dark Slate
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "2" || val === "1") {
            data.cell.styles.fillColor = [248, 250, 252]; // White
            data.cell.styles.textColor = [15, 23, 42];
          } else if (val === "M" || val === "0") {
            data.cell.styles.fillColor = [241, 245, 249]; // Muted Slate
            data.cell.styles.textColor = [100, 116, 139];
          }
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 360;
  y = finalTableY + 12;

  // 5. Bottom Section: Round Summary (Left) + Performance Insight (Right)
  const leftColWidth = 270;
  const rightColWidth = contentWidth - leftColWidth - 12;
  const rightColX = margin + leftColWidth + 12;

  // Left Column: Round Summary Table
  autoTable(doc, {
    startY: y,
    head: [["Round", "Distance", "Score", "Max", "Xs", "10s", "9s"]],
    body: [
      ["Round 1", params.distance, params.round1Total, params.maxPossibleScore, params.xsDisplay, params.tensDisplay, params.ninesDisplay],
      ["Total", "", params.round1Total, params.maxPossibleScore, params.xsDisplay, params.tensDisplay, params.ninesDisplay],
    ],
    theme: "grid",
    tableWidth: leftColWidth,
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.8,
      halign: "center",
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold", halign: "left" },
      1: { cellWidth: 42 },
      2: { cellWidth: 38, fontStyle: "bold" },
      3: { cellWidth: 38 },
      4: { cellWidth: 34 },
      5: { cellWidth: 34 },
      6: { cellWidth: 34 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    margin: { left: margin },
  });

  // Right Column: Performance Insight Box
  const boxHeight = 65;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, y, rightColWidth, boxHeight, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(229, 57, 53);
  doc.text("PERFORMANCE INSIGHT", rightColX + 10, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const insightLines = doc.splitTextToSize(
    params.coachInsight || "Consistent arrow grouping observed across round ends.",
    rightColWidth - 20
  );
  doc.text(insightLines.slice(0, 3), rightColX + 10, y + 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Consistency: ${params.scorePercentage}% on target`, rightColX + 10, y + boxHeight - 8);

  y += boxHeight + 14;

  // 6. Official Signatures & Certified Seal Block (WA Official Tournament format)
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.8);

  // Archer Signature Line
  const sigWidth = 125;
  doc.line(margin + 6, y + 24, margin + 6 + sigWidth, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Archer's Signature", margin + 6, y + 35);

  // Scorer / Judge Signature Line
  const sig2X = margin + 150;
  doc.line(sig2X, y + 24, sig2X + sigWidth, y + 24);
  doc.text("Scorer / Judge Signature", sig2X, y + 35);

  // Official Verified Stamp (Round Double-Ring Seal) between Scorer and Date
  const sealX = margin + 340;
  const sealY = y + 20;
  doc.setDrawColor(229, 57, 53); // target red
  doc.setLineWidth(0.9);
  doc.circle(sealX, sealY, 15, "S");
  doc.setLineWidth(0.4);
  doc.circle(sealX, sealY, 13, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(229, 57, 53);
  doc.text("ARCHERX", sealX, sealY - 5.5, { align: "center" });
  doc.setFontSize(5.5);
  doc.text("VERIFIED", sealX, sealY, { align: "center" });
  doc.setFontSize(4);
  doc.text("RECORD", sealX, sealY + 5.5, { align: "center" });

  // Date Line
  const dateX = pageWidth - margin - 85;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(dateX, y + 24, pageWidth - margin, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Verification Date", dateX, y + 35);

  // 7. Security / Verification Footer (Bottom of Page 1)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Page 1 of 1  •  ArcherX AI Certified Scorecard  •  World Archery Standard  •  ID: ${params.session?._id || params.session?.id || "ARCHERX"}`,
    pageWidth / 2,
    pageHeight - 14,
    { align: "center" }
  );

  // Trigger download
  const cleanName = params.athleteName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Athlete";
  const filename = `Scorecard_${cleanName}_${params.round1Total}pts.pdf`;
  doc.save(filename);
}
