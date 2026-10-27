import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Trophy, Medal, Award, Star, Calendar, MessageSquare, ChevronRight, Edit } from "lucide-react";

interface MonthlyPerformanceViewProps {
  onOpenProfile: (id: string) => void;
}

export const MonthlyPerformanceView: React.FC<MonthlyPerformanceViewProps> = ({ onOpenProfile }) => {
  const [rankings, setRankings] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  // Edit Manager Notes Modal
  const [notesTarget, setNotesTarget] = useState<any | null>(null);
  const [managerNotes, setManagerNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchRankings = () => {
    setLoading(true);
    api.get(`/reports/monthly?month=${selectedMonth}`)
      .then((res) => setRankings(res.data.rankings || []))
      .catch((err) => console.error("Error fetching monthly rankings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedMonth]);

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesTarget) return;

    setSavingNotes(true);
    try {
      await api.post("/reports/notes", {
        userId: notesTarget.userId,
        monthYear: selectedMonth,
        notes: managerNotes
      });
      setNotesTarget(null);
      fetchRankings();
    } catch (err: any) {
      alert("Failed to save performance notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white font-black text-xs shadow">
          🥉 3
        </span>
      );
    }
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Staff Discipline, Reliability & Monthly Rankings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Objective, policy-based discipline score: 40% Attendance Reliability + 30% Punctuality + 30% Break Compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Transparent Evaluation Formula Explanation Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-teal-400" />
          <span>
            <strong className="text-slate-200">Evaluation Philosophy:</strong> Zero arbitrariness. Staff are never penalized for approved leave, official holidays, or approved breaks.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="rounded bg-teal-500/10 px-2 py-0.5 text-teal-400">40% Attendance</span>
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">30% Punctuality</span>
          <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-400">30% Break Compliance</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Discipline Score</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Punctuality Rate</th>
                <th className="py-3 px-4">Break Compliance</th>
                <th className="py-3 px-4">Total Net Hours</th>
                <th className="py-3 px-4">Manager Review Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankings.length > 0 ? (
                rankings.map((r) => (
                  <tr
                    key={r.userId}
                    onClick={() => onOpenProfile(r.userId)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-4">
                      {getRankBadge(r.rank)}
                    </td>

                    {/* Employee Profile Navigation */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-300">
                          {r.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-teal-400 transition">
                            {r.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            @{r.username} • {r.workstationId || "Suite"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Overall Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-teal-400">{r.disciplineScore}</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="bg-teal-400 h-full" style={{ width: `${Math.min(100, r.disciplineScore)}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Attendance Reliability */}
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {r.attendanceReliability}%
                      <span className="block text-[10px] text-slate-500 font-normal">{r.presentDays} present • {r.approvedLeaveDays} on leave</span>
                    </td>

                    {/* Punctuality Rate */}
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {r.punctualityRate}%
                      <span className="block text-[10px] text-slate-500 font-normal">{r.lateDays} late arrivals</span>
                    </td>

                    {/* Break Compliance */}
                    <td className="py-3 px-4 font-semibold text-indigo-400">
                      {r.breakComplianceRate}%
                    </td>

                    {/* Total Net Hours */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {r.totalWorkHours} hrs
                    </td>

                    {/* Manager Notes & Edit Button */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                          {r.managerNotes ? `"${r.managerNotes}"` : "No review remarks yet."}
                        </span>
                        <button
                          onClick={() => {
                            setNotesTarget(r);
                            setManagerNotes(r.managerNotes || "");
                          }}
                          className="rounded p-1 text-slate-500 hover:text-teal-400 hover:bg-slate-800 transition"
                          title="Add/Edit Manager Evaluation Notes"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No performance records found for {selectedMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Notes Modal */}
      {notesTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Add Performance Evaluation Remarks
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              For <span className="font-bold text-white">{notesTarget.fullName}</span> for month <span className="font-mono text-teal-300">{selectedMonth}</span>.
            </p>

            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Manager Feedback & Context Notes
                </label>
                <textarea
                  rows={4}
                  required
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="e.g. Demonstrated exceptional turnaround time on corporate commercial projects; exemplary punctuality."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNotesTarget(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {savingNotes ? "Saving Notes..." : "Save Notes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
