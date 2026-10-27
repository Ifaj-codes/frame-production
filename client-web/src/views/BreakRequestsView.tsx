import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Coffee, CheckCircle2, XCircle, Clock, Check, X, MessageSquare } from "lucide-react";

export const BreakRequestsView: React.FC = () => {
  const [pendingBreaks, setPendingBreaks] = useState<any[]>([]);
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
      api.get("/attendance/search?status=ALL") // can fetch recent sessions or breaks
    ])
      .then(([pendingRes]) => {
        setPendingBreaks(pendingRes.data);
      })
      .catch((err) => console.error("Error fetching breaks:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBreaks();
    const interval = setInterval(fetchBreaks, 10000); // 10s auto refresh
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Coffee className="h-5 w-5 text-indigo-400" />
          <span>Break Management & Real-Time Approvals</span>
        </h2>
        <p className="text-xs text-slate-400">
          Decide pending break requests and monitor live break timers.
        </p>
      </div>

      {/* Pending Breaks Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Pending Approvals Queue</span>
            {pendingBreaks.length > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-amber-500/20 px-2 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                {pendingBreaks.length} pending
              </span>
            )}
          </h3>
          <button onClick={fetchBreaks} className="text-xs text-teal-400 font-semibold hover:underline">
            Refresh
          </button>
        </div>

        {pendingBreaks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingBreaks.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 relative overflow-hidden"
              >
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

                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Requested: <strong className="text-white">{b.requestedMinutes} mins</strong></span>
                </div>

                {b.notes && (
                  <div className="text-[11px] text-slate-400 italic bg-slate-900 p-2 rounded border border-slate-800">
                    "{b.notes}"
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setSelectedBreak(b);
                      setDecisionType("APPROVED");
                      setApprovedMinutes(b.requestedMinutes);
                      setDecisionReason("");
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-emerald-600/90 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
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
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-rose-600/20 py-1.5 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No break requests pending approval right now.
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {selectedBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {decisionType === "APPROVED" ? "Approve Break Request" : "Reject Break Request"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              For <span className="font-bold text-white">{selectedBreak.user?.fullName}</span> ({selectedBreak.breakType?.name}).
            </p>

            <form onSubmit={handleDecision} className="space-y-4">
              {decisionType === "APPROVED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Approved Duration (Minutes)
                  </label>
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
                  rows={3}
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
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
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
