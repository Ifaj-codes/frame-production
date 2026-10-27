import React, { useEffect, useState } from "react";
import { api } from "../api";
import { ActivitySquare, Database, Server, Cpu, HardDrive, RefreshCw, CheckCircle2 } from "lucide-react";

export const SystemHealthView: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    api.get("/settings/system-health")
      .then((res) => setHealth(res.data))
      .catch((err) => console.error("Error fetching system health:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-teal-400" />
            <span>Server Health, Database & Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time backend telemetry, memory allocation, and database synchronization statistics.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Ping Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">API Status</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5" />
            <span>OPERATIONAL</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Uptime: {health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 60)} mins` : "Online"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Database Engine</span>
            <Database className="h-4 w-4 text-teal-400" />
          </div>
          <div className="text-base font-bold text-white">Prisma Relational</div>
          <div className="text-[11px] text-teal-400/80 font-mono">
            {health?.database?.totalAttendanceSessions || 0} Total Attendance Records
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">System Memory</span>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {health?.system?.freeMemoryMB} MB Free
          </div>
          <div className="text-[11px] text-slate-500">
            Total {health?.system?.totalMemoryMB} MB
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Offline Synchronization</span>
            <HardDrive className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">
            {health?.database?.offlineSyncedSessions || 0} Synced
          </div>
          <div className="text-[11px] text-slate-500">
            Reconciled desktop sessions
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Environment Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Host Platform:</span>
            <span className="text-slate-200">{health?.system?.platform} ({health?.system?.release})</span>
          </div>
          <div>
            <span className="text-slate-500 block">Node.js Runtime:</span>
            <span className="text-slate-200">{health?.system?.nodeVersion}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Database Storage:</span>
            <span className="text-slate-200">{health?.database?.engine}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Last Health Ping:</span>
            <span className="text-slate-200">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
