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

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 28;
  const contentWidth = pageWidth - margin * 2; // 539.28 pt

  // Analyze arrow values across all ends for Ring Distribution
  let totalArrows = 0;
  let goldHits = 0; // 10, X, 9
  let redHits = 0; // 8, 7
  let blueHits = 0; // 6, 5
  let blackHits = 0; // 4, 3
  let whiteHits = 0; // 2, 1
  let missHits = 0; // M, 0

  params.ends.slice(0, 6).forEach((end) => {
    end.forEach((val) => {
      const v = String(val || "").toUpperCase().trim();
      if (!v || v === "-") return;
      totalArrows++;
      if (v === "10" || v === "X" || v === "9") goldHits++;
      else if (v === "8" || v === "7") redHits++;
      else if (v === "6" || v === "5") blueHits++;
      else if (v === "4" || v === "3") blackHits++;
      else if (v === "2" || v === "1") whiteHits++;
      else if (v === "M" || v === "0") missHits++;
    });
  });

  if (totalArrows === 0) totalArrows = params.totalArrowsCount || 36;

  // 1. Top Header Banner (slate-900 with red/gold accents)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 66, "F");

  // Accent Line (Target Red)
  doc.setFillColor(229, 57, 53); // target-red
  doc.rect(0, 66, pageWidth, 4, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ARCHERX AI  |  OFFICIAL SCORECARD", margin, 29);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("WORLD ARCHERY RECOGNIZED ROUND RECORD & CERTIFICATION", margin, 47);

  // Top Right Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`DATE: ${params.formattedDate.toUpperCase()}`, pageWidth - margin, 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`${params.selectedBow}  •  ${params.distance}`, pageWidth - margin, 46, { align: "right" });

  let y = 82;

  // 2. Athlete Information Box with World Archery Olympic Target Face
  const athleteBoxHeight = 62;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.9);
  doc.roundedRect(margin, y, contentWidth, athleteBoxHeight, 5, 5, "FD");

  // Athlete name and classification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(15, 23, 42);
  doc.text(params.athleteName, margin + 14, y + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("CERTIFIED COMPETITOR  •  OFFICIAL COMPETITION RECORD", margin + 14, y + 35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const detailsLine = `Event: ${params.eventName}    |    Standard: ${params.standardName || "World Archery Target"}    |    Venue: ${params.venueName || "Outdoor Range"}`;
  doc.text(detailsLine, margin + 14, y + 50);

  // World Archery Official 5-Zone Concentric Target Graphic
  const targetX = margin + contentWidth - 36;
  const targetY = y + 31;
  // White Ring 1-2
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.circle(targetX, targetY, 21, "FD");
  // Black Ring 3-4
  doc.setFillColor(30, 41, 59);
  doc.circle(targetX, targetY, 16.8, "F");
  // Blue Ring 5-6
  doc.setFillColor(2, 132, 199);
  doc.circle(targetX, targetY, 12.6, "F");
  // Red Ring 7-8
  doc.setFillColor(225, 29, 72);
  doc.circle(targetX, targetY, 8.4, "F");
  // Gold Ring 9-10
  doc.setFillColor(250, 204, 21);
  doc.circle(targetX, targetY, 4.2, "F");
  // Inner X Crosshair
  doc.setDrawColor(161, 98, 7);
  doc.setLineWidth(0.4);
  doc.line(targetX - 2, targetY, targetX + 2, targetY);
  doc.line(targetX, targetY - 2, targetX, targetY + 2);

  y += athleteBoxHeight + 12;

  // 3. Four Executive KPI Metric Cards
  const kpiCardHeight = 70;
  const kpiGap = 9;
  const kpiWidth = (contentWidth - 3 * kpiGap) / 4;

  const kpis = [
    {
      label: "ROUND 1 SCORE",
      val: `${params.round1Total} / ${params.maxPossibleScore}`,
      sub: `${params.scorePercentage}% of Maximum`,
      color: [15, 23, 42],
      accent: [229, 57, 53],
    },
    {
      label: "ARROW AVERAGE",
      val: params.averagePerArrow,
      sub: "points / arrow",
      color: [5, 150, 105],
      accent: [16, 185, 129],
    },
    {
      label: "10s COUNT (GOLDS)",
      val: `${params.tensDisplay}`,
      sub: "Inner Gold Hits",
      color: [180, 83, 9],
      accent: [245, 158, 11],
    },
    {
      label: params.selectedBow === "Compound Bow" ? "COMPOUND X-RING" : "INNER-X (Xs)",
      val: `${params.xsDisplay}`,
      sub: "Dead-Center Bullseyes",
      color: [194, 65, 12],
      accent: [249, 115, 22],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.9);
    doc.roundedRect(cardX, y, kpiWidth, kpiCardHeight, 5, 5, "FD");

    // Top Accent Line
    doc.setFillColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.roundedRect(cardX + 3, y, kpiWidth - 6, 3.5, 1, 1, "F");

    // Top Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + kpiWidth / 2, y + 18, { align: "center" });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, cardX + kpiWidth / 2, y + 42, { align: "center" });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + kpiWidth / 2, y + 58, { align: "center" });
  });

  y += kpiCardHeight + 14;

  // 4. Detailed End-by-End Scores Table (Sized to fill gracefully)
  const tableHeaders = [
    ["End", "Arrow 1", "Arrow 2", "Arrow 3", "Arrow 4", "Arrow 5", "Arrow 6", "End Total", "Running Total"],
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
    pageBreak: "avoid",
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9.5,
      halign: "center",
      cellPadding: 6.2,
    },
    bodyStyles: {
      fontSize: 11.5,
      cellPadding: 7.2,
      halign: "center",
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.6,
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", fillColor: [248, 250, 252] },
      7: { fontStyle: "bold", halign: "center", fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      8: { fontStyle: "bold", halign: "center", fillColor: [226, 232, 240], textColor: [15, 23, 42] },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const isFooterRow = data.row.index === tableRows.length - 1;
        if (isFooterRow) {
          data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          data.cell.styles.textColor = [146, 64, 14]; // amber-800
          data.cell.styles.fontSize = 12;
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

  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 450;
  y = finalTableY + 12;

  // 5. Shot Dispersion & Ring Distribution Analytics Strip
  const distStripHeight = 48;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.9);
  doc.roundedRect(margin, y, contentWidth, distStripHeight, 5, 5, "FD");

  // Title on left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("TARGET ZONE & SHOT DISPERSION", margin + 12, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("World Archery official scoring rings breakdown", margin + 12, y + 31);

  // 4 Zone Pills on the right
  const zonePillWidth = 84;
  const zonePillHeight = 32;
  const zonePillGap = 6;
  const zoneStartX = margin + contentWidth - 4 * (zonePillWidth + zonePillGap) - 4;
  const zoneY = y + 8;

  const zones = [
    {
      label: "GOLD (10, X, 9)",
      count: goldHits,
      pct: totalArrows > 0 ? Math.round((goldHits / totalArrows) * 100) : 0,
      bg: [254, 240, 138],
      border: [234, 179, 8],
      text: [113, 63, 18],
    },
    {
      label: "RED (8, 7)",
      count: redHits,
      pct: totalArrows > 0 ? Math.round((redHits / totalArrows) * 100) : 0,
      bg: [254, 202, 202],
      border: [239, 68, 68],
      text: [153, 27, 27],
    },
    {
      label: "BLUE (6, 5)",
      count: blueHits,
      pct: totalArrows > 0 ? Math.round((blueHits / totalArrows) * 100) : 0,
      bg: [186, 230, 253],
      border: [14, 165, 233],
      text: [7, 89, 133],
    },
    {
      label: "OUTER / MISS",
      count: blackHits + whiteHits + missHits,
      pct: totalArrows > 0 ? Math.round(((blackHits + whiteHits + missHits) / totalArrows) * 100) : 0,
      bg: [241, 245, 249],
      border: [203, 213, 225],
      text: [71, 85, 105],
    },
  ];

  zones.forEach((zone, zIdx) => {
    const pX = zoneStartX + zIdx * (zonePillWidth + zonePillGap);
    doc.setFillColor(zone.bg[0], zone.bg[1], zone.bg[2]);
    doc.setDrawColor(zone.border[0], zone.border[1], zone.border[2]);
    doc.setLineWidth(0.7);
    doc.roundedRect(pX, zoneY, zonePillWidth, zonePillHeight, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(zone.text[0], zone.text[1], zone.text[2]);
    doc.text(zone.label, pX + zonePillWidth / 2, zoneY + 11, { align: "center" });

    doc.setFontSize(9.5);
    doc.text(`${zone.count} hits (${zone.pct}%)`, pX + zonePillWidth / 2, zoneY + 24, { align: "center" });
  });

  y += distStripHeight + 12;

  // 6. Round Summary (Left) + Performance Analysis & Coach Insight Box (Right)
  const leftColWidth = 265;
  const rightColWidth = contentWidth - leftColWidth - 12;
  const rightColX = margin + leftColWidth + 12;
  const summaryBoxHeight = 110;

  // Left Column: Round Summary Table
  autoTable(doc, {
    startY: y,
    head: [["Round", "Distance", "Score", "Max", "Xs", "10s", "9s"]],
    body: [
      ["Round 1", params.distance, params.round1Total, params.maxPossibleScore, params.xsDisplay, params.tensDisplay, params.ninesDisplay],
      ["Total", "", params.round1Total, params.maxPossibleScore, params.xsDisplay, params.tensDisplay, params.ninesDisplay],
    ],
    theme: "grid",
    pageBreak: "avoid",
    tableWidth: leftColWidth,
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 4.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 4.2,
      halign: "center",
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.6,
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "left", fillColor: [248, 250, 252] },
      2: { fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    margin: { left: margin },
  });

  // Under summary table: quick specs
  const subSummaryY = y + 66;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Discipline: Target Archery   •   Total Ends: 6   •   Arrows: ${totalArrows}`, margin + 2, subSummaryY);
  doc.text(`Timing: 30s Lead-In • World Archery Recognized Standard`, margin + 2, subSummaryY + 12);
  if (params.sessionNote && params.sessionNote.trim()) {
    doc.setFont("helvetica", "italic");
    doc.text(`Note: "${params.sessionNote.trim().slice(0, 48)}"`, margin + 2, subSummaryY + 24);
  }

  // Right Column: Performance Insight & Technical Analysis Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.9);
  doc.roundedRect(rightColX, y, rightColWidth, summaryBoxHeight, 5, 5, "FD");

  // Top Red Accent Line
  doc.setFillColor(229, 57, 53);
  doc.roundedRect(rightColX + 4, y, rightColWidth - 8, 3, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(229, 57, 53);
  doc.text("PERFORMANCE ANALYSIS & TECHNICAL INSIGHT", rightColX + 12, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const insightLines = doc.splitTextToSize(
    params.coachInsight || "Consistent arrow grouping and solid follow-through observed across round ends.",
    rightColWidth - 24
  );
  doc.text(insightLines.slice(0, 4), rightColX + 12, y + 34);

  // Bottom stats row in Insight Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX + 8, y + summaryBoxHeight - 26, rightColWidth - 16, 20, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Target Accuracy: ${params.scorePercentage}%`, rightColX + 14, y + summaryBoxHeight - 13);
  doc.setTextColor(5, 150, 105);
  doc.text(`Average: ${params.averagePerArrow} pts/arr`, rightColX + rightColWidth - 88, y + summaryBoxHeight - 13);

  y += summaryBoxHeight + 12;

  // 7. Official World Archery Signatures & Certified Seal Block
  const sigBoxHeight = 135;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.9);
  doc.roundedRect(margin, y, contentWidth, sigBoxHeight, 5, 5, "FD");

  // Header inside signature box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 1, y + 1, contentWidth - 2, 24, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("OFFICIAL WORLD ARCHERY ROUND VERIFICATION & CERTIFICATION", margin + 12, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("World Archery Rulebook Book 3 (Target Archery) • Rule 14.1 & 14.2", margin + contentWidth - 12, y + 16, { align: "right" });

  // 3 Columns: Archer Signature, Scorer / Judge Signature, Certified Seal & Date
  const sigColWidth = (contentWidth - 24) / 3;
  const sigContentY = y + 28;

  // Column 1: Archer Verification
  const col1X = margin + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("ARCHER VERIFICATION", col1X, sigContentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("I certify that these scores and values are correct.", col1X, sigContentY + 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(params.athleteName, col1X, sigContentY + 52);

  // Line for signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.8);
  doc.line(col1X, sigContentY + 74, col1X + sigColWidth - 16, sigContentY + 74);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Archer's Signature", col1X, sigContentY + 86);

  // Column 2: Official Scorer / Judge
  const col2X = margin + 12 + sigColWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("OFFICIAL SCORER / JUDGE", col2X, sigContentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Recorded and verified against official target face.", col2X, sigContentY + 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Accredited Judge / Scorer", col2X, sigContentY + 52);

  // Line for signature
  doc.line(col2X, sigContentY + 74, col2X + sigColWidth - 16, sigContentY + 74);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Scorer / Judge Signature", col2X, sigContentY + 86);

  // Column 3: Certified Seal & Verification Date
  const col3X = margin + 12 + sigColWidth * 2;
  const sealCenterX = col3X + sigColWidth / 2 - 4;
  const sealCenterY = sigContentY + 38;

  // Double-Ring Red Tournament Seal
  doc.setDrawColor(229, 57, 53); // target red
  doc.setLineWidth(1.2);
  doc.circle(sealCenterX, sealCenterY, 23, "S");
  doc.setLineWidth(0.5);
  doc.circle(sealCenterX, sealCenterY, 20.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(229, 57, 53);
  doc.text("ARCHERX AI", sealCenterX, sealCenterY - 9, { align: "center" });
  doc.setFontSize(7);
  doc.text("VERIFIED", sealCenterX, sealCenterY - 1, { align: "center" });
  doc.setFontSize(5.5);
  doc.text("RECORD", sealCenterX, sealCenterY + 7, { align: "center" });
  doc.setFontSize(4.5);
  doc.text("WA 14.1 CERTIFIED", sealCenterX, sealCenterY + 13.5, { align: "center" });

  // Date line under seal
  doc.line(col3X + 12, sigContentY + 74, col3X + sigColWidth - 16, sigContentY + 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${params.formattedDate}`, col3X + sigColWidth / 2 - 2, sigContentY + 86, { align: "center" });

  // 8. Security & Compliance Footer (Bottom of Page 1)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.8);
  doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Page 1 of 1  •  ArcherX AI Certified Scorecard  •  World Archery Standard  •  Session: ${params.session?._id || params.session?.id || "ARCHERX"}  •  Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  // Trigger download
  const cleanName = params.athleteName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Athlete";
  const filename = `Scorecard_${cleanName}_${params.round1Total}pts.pdf`;
  doc.save(filename);
}
