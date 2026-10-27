import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  Coffee,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  MessageSquare,
  AlertTriangle,
  History,
  Timer,
  PlayCircle,
  StopCircle,
  Filter,
  Search,
  Sparkles
} from "lucide-react";

export const BreakRequestsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE" | "HISTORY">("PENDING");
  const [pendingBreaks, setPendingBreaks] = useState<any[]>([]);
  const [activeBreaks, setActiveBreaks] = useState<any[]>([]);
  const [historyBreaks, setHistoryBreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [selectedBreak, setSelectedBreak] = useState<any | null>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvedMinutes, setApprovedMinutes] = useState<number>(15);
  const [decisionReason, setDecisionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBreaks = () => {
    setLoading(true);
    Promise.all([
      api.get("/breaks/pending"),
      api.get("/breaks/active"),
      api.get("/breaks/history")
    ])
      .then(([pendingRes, activeRes, historyRes]) => {
        setPendingBreaks(pendingRes.data || []);
        setActiveBreaks(activeRes.data || []);
        setHistoryBreaks(historyRes.data || []);
      })
      .catch((err) => console.error("Error fetching breaks:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBreaks();
    const interval = setInterval(fetchBreaks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBreak) return;

    setSubmitting(true);
    try {
      await api.put(`/breaks/${selectedBreak.id}/decision`, {
        status: decisionType,
        approvedMinutes: decisionType === "APPROVED" ? approvedMinutes : undefined,
        decisionReason
      });
      setSelectedBreak(null);
      fetchBreaks();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process break decision");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceEnd = async (breakId: string) => {
    if (!confirm("Are you sure you want to force-end this active break?")) return;
    try {
      await api.post(`/breaks/${breakId}/force-end`);
      fetchBreaks();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to end break");
    }
  };

  // Helper to calculate minutes remaining or overdue
  const getBreakTimer = (startTime: string, approvedMins: number) => {
    const elapsedMins = Math.floor((Date.now() - new Date(startTime).getTime()) / (1000 * 60));
    const remaining = approvedMins - elapsedMins;
    const isOverdue = remaining < 0;
    return {
      elapsedMins,
      remaining: Math.abs(remaining),
      isOverdue
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Coffee className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Break Management & Live Dispatch</h2>
              <p className="text-xs text-slate-400">
                Authorize editor pauses, track live ongoing timers, and audit daily allowance limits.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchBreaks}
          className="text-xs text-teal-400 font-semibold hover:underline"
        >
          Refresh All Queues
        </button>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Approvals</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{pendingBreaks.length}</span>
            <span className="text-xs text-slate-500">awaiting supervisor</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 font-medium">
            {pendingBreaks.length > 0 ? "Requires authorization" : "All queues cleared"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Ongoing Breaks</span>
            <PlayCircle className="h-4 w-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-teal-400">{activeBreaks.length}</span>
            <span className="text-xs text-slate-500">editors on break</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Live timer ticking on desktop
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Daily Allowance Limit</span>
            <Timer className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-indigo-400">60</span>
            <span className="text-xs text-slate-500">mins / day cap</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Standard studio policy
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Audit Logged</span>
            <History className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{historyBreaks.length}</span>
            <span className="text-xs text-slate-500">recorded sessions</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 font-medium">
            Auto deducted from attendance
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "PENDING"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Pending Queue</span>
          {pendingBreaks.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              {pendingBreaks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "ACTIVE"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <PlayCircle className="h-4 w-4 text-teal-400" />
          <span>Active Ongoing ({activeBreaks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "HISTORY"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <History className="h-4 w-4 text-indigo-400" />
          <span>Break History & Audits</span>
        </button>
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === "PENDING" && (
        <div className="space-y-4">
          {pendingBreaks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBreaks.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3.5 relative flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{b.user.fullName}</div>
                        <div className="text-[11px] text-slate-400">
                          @{b.user.username} • {b.user.workstationId || "Suite"}
                        </div>
                      </div>
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20">
                        {b.breakType.name}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Requested Duration:
                      </span>
                      <span className="font-mono text-white font-bold">{b.requestedMinutes} mins</span>
                    </div>

                    {b.notes && (
                      <div className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/60">
                        "{b.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        setSelectedBreak(b);
                        setDecisionType("APPROVED");
                        setApprovedMinutes(b.requestedMinutes);
                        setDecisionReason("");
                      }}
                      className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-emerald-600/90 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition active:scale-95"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBreak(b);
                        setDecisionType("REJECTED");
                        setDecisionReason("");
                      }}
                      className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-rose-600/20 py-1.5 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
              No break requests currently pending authorization.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE ONGOING BREAKS */}
      {activeTab === "ACTIVE" && (
        <div className="space-y-4">
          {activeBreaks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBreaks.map((b) => {
                const timer = getBreakTimer(b.startTime, b.approvedMinutes || b.requestedMinutes);

                return (
                  <div
                    key={b.id}
                    className={`rounded-xl border p-5 space-y-3.5 relative flex flex-col justify-between transition ${
                      timer.isOverdue
                        ? "bg-rose-950/20 border-rose-500/40"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{b.user.fullName}</div>
                          <div className="text-[11px] text-slate-400">
                            @{b.user.username} • {b.user.workstationId || "Suite"}
                          </div>
                        </div>
                        <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/20">
                          {b.breakType.name}
                        </span>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Started:</span>
                          <span className="font-mono text-white">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Approved Duration:</span>
                          <span className="font-mono text-white">{b.approvedMinutes || b.requestedMinutes} mins</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <span className="font-semibold text-slate-300">Elapsed:</span>
                          <span className="font-mono font-bold text-teal-300">{timer.elapsedMins} mins</span>
                        </div>
                      </div>

                      {timer.isOverdue ? (
                        <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 p-2 text-[11px] text-rose-300 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                          <span>Overdue by {timer.remaining} mins</span>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-2 text-[11px] text-teal-300 font-semibold flex items-center justify-between">
                          <span>Time Remaining:</span>
                          <span className="font-mono font-bold">{timer.remaining} mins</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleForceEnd(b.id)}
                        className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/30 border border-slate-700 transition"
                      >
                        <StopCircle className="h-3.5 w-3.5" />
                        <span>Force End Break</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
              No staff currently away on break. All editors active in studio suites.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BREAK HISTORY & AUDITS */}
      {activeTab === "HISTORY" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Break Type</th>
                  <th className="py-3 px-4">Approved Duration</th>
                  <th className="py-3 px-4">Actual Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Decided By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {historyBreaks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono">
                      {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {b.user.fullName}
                      <span className="block text-[10px] text-slate-500 font-normal">@{b.user.username}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                        {b.breakType.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.approvedMinutes || b.requestedMinutes} mins</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-300">{b.actualDurationMins} mins</td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          b.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : b.status === "OVERDUE"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{b.decidedBy || "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white mb-1">
              {decisionType === "APPROVED" ? "Approve Break Request" : "Reject Break Request"}
            </h3>
            <p className="text-xs text-slate-400">
              For <span className="font-bold text-white">{selectedBreak.user?.fullName}</span> ({selectedBreak.breakType?.name}).
            </p>

            <form onSubmit={handleDecision} className="space-y-4">
              {decisionType === "APPROVED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Approved Duration (Minutes)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setApprovedMinutes(mins)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                          approvedMinutes === mins
                            ? "bg-indigo-600 text-white border-indigo-500 shadow"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={approvedMinutes}
                    onChange={(e) => setApprovedMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason / Notes {decisionType === "REJECTED" && "(Required)"}
                </label>
                <textarea
                  rows={2}
                  required={decisionType === "REJECTED"}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={decisionType === "APPROVED" ? "Optional approval remarks..." : "State reason for rejection..."}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBreak(null)}
                  className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white ${
                    decisionType === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  } disabled:opacity-50`}
                >
                  {submitting ? "Processing..." : `Confirm ${decisionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
