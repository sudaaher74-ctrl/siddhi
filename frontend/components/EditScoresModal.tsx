"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { apiPut } from "@/lib/api";
import { Session } from "@/lib/data";

interface EditScoresModalProps {
  session: Session;
  initialEnds: string[][];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSession: Session, updatedEnds: string[][]) => void;
}

const SCORE_OPTIONS = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];

const getArrowPoints = (val: string): number => {
  if (val === "X" || val === "10") return 10;
  if (val === "M" || val === "-" || !val) return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

export default function EditScoresModal({
  session,
  initialEnds,
  isOpen,
  onClose,
  onSave,
}: EditScoresModalProps) {
  // Ensure we have 6 ends with 6 arrows
  const [ends, setEnds] = useState<string[][]>(() => {
    const result: string[][] = [];
    for (let e = 0; e < 6; e++) {
      const row = initialEnds[e] || [];
      const endRow: string[] = [];
      for (let a = 0; a < 6; a++) {
        endRow.push(row[a] !== undefined ? String(row[a]) : "9");
      }
      result.push(endRow);
    }
    return result;
  });

  const [selectedCell, setSelectedCell] = useState<{ end: number; arrow: number } | null>({
    end: 0,
    arrow: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate totals
  const endTotals = ends.map((row) =>
    row.reduce((sum, arrow) => sum + getArrowPoints(arrow), 0)
  );

  let run = 0;
  const runningTotals = endTotals.map((tot) => {
    run += tot;
    return run;
  });

  const totalScore = run;
  const allArrows = ends.flat();
  const tensCount = allArrows.filter((a) => a === "10" || a === "X").length;
  const xsCount = allArrows.filter((a) => a === "X").length;
  const totalArrowsCount = allArrows.length;
  const avg = totalArrowsCount > 0 ? (totalScore / totalArrowsCount).toFixed(2) : "0.00";

  const handleArrowChange = (newVal: string) => {
    if (!selectedCell) return;
    const { end, arrow } = selectedCell;
    const newEnds = ends.map((r, eIdx) =>
      eIdx === end
        ? r.map((c, aIdx) => (aIdx === arrow ? newVal : c))
        : [...r]
    );
    setEnds(newEnds);

    // Auto advance to next cell
    if (arrow < 5) {
      setSelectedCell({ end, arrow: arrow + 1 });
    } else if (end < 5) {
      setSelectedCell({ end: end + 1, arrow: 0 });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const sessionId = session.id || session._id;
      // Convert ends to ArrowShot structure for compatibility with ScoreEntry
      const arrowDataStructured = ends.map((row) =>
        row.map((score) => ({ score, cx: null, cy: null }))
      );

      const payload = {
        score: totalScore,
        arrows: totalArrowsCount,
        tens: tensCount,
        avg: Number(avg),
        arrowData: JSON.stringify(arrowDataStructured),
      };

      let updated: Session = { ...session, ...payload };
      if (sessionId) {
        const res = await apiPut<Session>(`/api/sessions/${sessionId}`, payload);
        if (res) {
          updated = { ...updated, ...res };
        }
      }

      onSave(updated, ends);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to update scores:", err);
      setError(err instanceof Error ? err.message : "Could not save updated scores");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 text-slate-900 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Arrow Scores</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tap any cell and choose a score from the keypad below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Scores Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2 px-1 w-10">End</th>
                  <th className="py-2 px-1">A1</th>
                  <th className="py-2 px-1">A2</th>
                  <th className="py-2 px-1">A3</th>
                  <th className="py-2 px-1">A4</th>
                  <th className="py-2 px-1">A5</th>
                  <th className="py-2 px-1">A6</th>
                  <th className="py-2 px-1 font-bold text-slate-900 bg-slate-100/70">Total</th>
                  <th className="py-2 px-1 font-bold text-slate-900 bg-slate-100/70">Run</th>
                </tr>
              </thead>
              <tbody>
                {ends.map((row, eIdx) => (
                  <tr key={eIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="py-2 font-bold text-slate-700 bg-slate-50/70">{eIdx + 1}</td>
                    {row.map((val, aIdx) => {
                      const isSelected =
                        selectedCell?.end === eIdx && selectedCell?.arrow === aIdx;
                      return (
                        <td key={aIdx} className="py-1 px-0.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCell({ end: eIdx, arrow: aIdx })}
                            className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center mx-auto transition-all ${
                              isSelected
                                ? "bg-amber-500 text-white ring-2 ring-amber-400 ring-offset-1 scale-105"
                                : val === "X" || val === "10"
                                ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                                : val === "9" || val === "8"
                                ? "bg-red-50 text-red-900 hover:bg-red-100"
                                : val === "7" || val === "6"
                                ? "bg-sky-50 text-sky-900 hover:bg-sky-100"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                            }`}
                          >
                            {val}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2 font-bold text-slate-900 bg-slate-50/50">
                      {endTotals[eIdx]}
                    </td>
                    <td className="py-2 font-bold text-slate-900 bg-slate-50/50">
                      {runningTotals[eIdx]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Score Keypad */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Select Value for End {(selectedCell?.end ?? 0) + 1}, Arrow {(selectedCell?.arrow ?? 0) + 1}</span>
              <span className="text-amber-600 font-bold">Total: {totalScore} / 360</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {SCORE_OPTIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleArrowChange(val)}
                  className={`h-11 rounded-xl font-bold text-sm border transition-all active:scale-95 shadow-sm ${
                    val === "X" || val === "10"
                      ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                      : val === "9"
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                      : val === "8" || val === "7"
                      ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      : val === "6" || val === "5"
                      ? "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                      : val === "4" || val === "3"
                      ? "bg-slate-700 hover:bg-slate-800 text-white border-slate-700"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Recalculated Summary Stats */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Score</div>
              <div className="text-base font-black text-slate-900">{totalScore}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">10s + Xs</div>
              <div className="text-base font-black text-amber-600">{tensCount} ({xsCount} Xs)</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Average</div>
              <div className="text-base font-black text-emerald-600">{avg}</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-bold text-white bg-accent hover:bg-accent/90 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
