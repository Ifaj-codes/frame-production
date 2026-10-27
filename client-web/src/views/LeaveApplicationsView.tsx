import React, { useEffect, useState } from "react";
import { api } from "../api";
import { CalendarDays, Check, X, HelpCircle, Calendar, User, Clock, AlertCircle } from "lucide-react";

export const LeaveApplicationsView: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED">("APPROVED");
  const [decisionReason, setDecisionReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = () => {
    setLoading(true);
    api.get("/leaves/pending")
      .then((res) => setLeaves(res.data))
      .catch((err) => console.error("Error fetching leaves:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setSubmitting(true);
    try {
      await api.put(`/leaves/${selectedLeave.id}/decision`, {
        status: decisionType,
        decisionReason,
        internalNotes
      });
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process leave decision");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-400" />
          <span>Leave Applications & Approval Routing</span>
        </h2>
        <p className="text-xs text-slate-400">
          Review single-day and multi-day leave requests across 12 preset categories.
        </p>
      </div>

      {/* Pending Leave Queue */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Pending Leave Queue</span>
            {leaves.length > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-teal-500/20 px-2 text-[10px] font-bold text-teal-400 border border-teal-500/30">
                {leaves.length} pending
              </span>
            )}
          </h3>
          <button onClick={fetchLeaves} className="text-xs text-teal-400 font-semibold hover:underline">
            Refresh
          </button>
        </div>

        {leaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{leave.user.fullName}</div>
                    <div className="text-[11px] text-slate-400">
                      @{leave.user.username} • {leave.user.jobTitle}
                    </div>
                  </div>
                  <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-bold text-teal-300 border border-teal-500/20">
                    {leave.leaveReason}
                  </span>
                </div>

                {leave.customReason && (
                  <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-400">Custom Reason:</span> {leave.customReason}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-1">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>From: <strong className="text-white font-mono">{leave.startDate}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>To: <strong className="text-white font-mono">{leave.endDate}</strong></span>
                  </div>
                </div>

                {leave.description && (
                  <div className="text-xs text-slate-400 italic bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    "{leave.description}"
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setSelectedLeave(leave);
                      setDecisionType("APPROVED");
                      setDecisionReason("Approved by management");
                      setInternalNotes("");
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-emerald-600/90 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedLeave(leave);
                      setDecisionType("REJECTED");
                      setDecisionReason("");
                      setInternalNotes("");
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-rose-600/20 py-1.5 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedLeave(leave);
                      setDecisionType("MORE_INFO_REQUESTED");
                      setDecisionReason("");
                      setInternalNotes("");
                    }}
                    className="flex items-center justify-center rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                    title="Request Clarification"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No pending leave applications at this time.
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Leave Decision: {decisionType.replace("_", " ")}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Applicant: <span className="font-bold text-white">{selectedLeave.user.fullName}</span> ({selectedLeave.startDate} to {selectedLeave.endDate})
            </p>

            <form onSubmit={handleDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Decision Reason / Message to Employee
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Provide decision explanation..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Management Notes (Optional)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes visible only to admins..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {submitting ? "Saving Decision..." : "Submit Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
