import React, { useEffect, useState } from "react";
import { api } from "../api";
import { DoorOpen, Check, X, Clock, User, AlertCircle } from "lucide-react";

export const ExitRequestsView: React.FC = () => {
  const [exits, setExits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExits = () => {
    setLoading(true);
    api.get("/exits/pending")
      .then((res) => setExits(res.data))
      .catch((err) => console.error("Error fetching exits:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExits();
  }, []);

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED") => {
    const reason = prompt(`Enter ${status.toLowerCase()} remarks (optional):`) || "";
    try {
      await api.put(`/exits/${id}/decision`, { status, decisionReason: reason });
      fetchExits();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process exit decision");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-amber-400" />
          <span>Temporary Exit Permission Requests</span>
        </h2>
        <p className="text-xs text-slate-400">
          Approve or reject temporary office departures with scheduled return times.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Pending Exit Queue</span>
            {exits.length > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-amber-500/20 px-2 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                {exits.length} pending
              </span>
            )}
          </h3>
          <button onClick={fetchExits} className="text-xs text-teal-400 font-semibold hover:underline">
            Refresh
          </button>
        </div>

        {exits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exits.map((exit) => (
              <div
                key={exit.id}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3"
              >
                <div>
                  <div className="font-bold text-white text-sm">{exit.user.fullName}</div>
                  <div className="text-[11px] text-slate-400">@{exit.user.username} • {exit.user.workstationId || "Suite"}</div>
                </div>

                <div className="text-xs text-slate-300 font-semibold bg-slate-900 p-2 rounded border border-slate-800">
                  Reason: <span className="font-normal text-slate-400">{exit.reason}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Departure:</span>
                    <span className="font-mono text-amber-300">
                      {new Date(exit.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expected Return:</span>
                    <span className="font-mono text-teal-300">
                      {new Date(exit.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDecision(exit.id, "APPROVED")}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-emerald-600/90 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve Exit</span>
                  </button>

                  <button
                    onClick={() => handleDecision(exit.id, "REJECTED")}
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
            No temporary exit requests currently pending.
          </div>
        )}
      </div>
    </div>
  );
};
