import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coffee,
  CalendarDays,
  DoorOpen,
  Activity,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Radio,
  Layers,
  ChevronRight
} from "lucide-react";
import { TabKey } from "../components/Sidebar";

interface OverviewProps {
  onNavigate: (tab: TabKey) => void;
}

export const OverviewView: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = () => {
    setLoading(true);
    api.get("/reports/overview")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching overview:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-7 w-7 animate-spin text-amber-400" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Polling Telemetry...
        </span>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalEmployees: 17,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    currentlyOnBreak: 0,
    pendingBreakRequests: 0,
    pendingLeaveApplications: 0,
    pendingExitRequests: 0,
    todayTotalWorkHours: 0
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Cinematic Command Header */}
      <div className="glass-panel-elevated relative overflow-hidden rounded-2xl p-6">
        {/* Subtle top gold highlight */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                COMMAND DISPATCH
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Studio Operations Command
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time attendance, break telemetry, and active workstation monitoring.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchOverview}
              className="group flex items-center space-x-2 rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-amber-500/40 hover:text-white hover:bg-zinc-850 transition duration-150 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-400 transition ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span className="font-mono text-[11px]">Sync Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Metric Bento Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {/* Total Active Employees */}
        <div
          onClick={() => onNavigate("employees")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Staff</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            {metrics.totalEmployees}
          </div>
          <div className="mt-2 text-[11px] text-amber-400 font-semibold flex items-center gap-1">
            <span>View All Profiles</span>
            <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 border-emerald-500/20 group hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between text-emerald-400/80 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">Present</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight font-mono">
            {metrics.presentToday}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/80 font-medium">
            Clocked in & active
          </div>
        </div>

        {/* Late Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 border-amber-500/20 group hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between text-amber-400/80 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">Late Arrivals</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight font-mono">
            {metrics.lateToday}
          </div>
          <div className="mt-2 text-[11px] text-amber-400/70 font-medium">
            Past grace window
          </div>
        </div>

        {/* Absent / Off */}
        <div
          onClick={() => onNavigate("attendance")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 border-rose-500/20 group hover:border-rose-500/40"
        >
          <div className="flex items-center justify-between text-rose-400/80 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400/80">Absent</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:scale-105 transition">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 tracking-tight font-mono">
            {metrics.absentToday}
          </div>
          <div className="mt-2 text-[11px] text-rose-400/70 font-medium truncate">
            {metrics.onLeaveToday} on approved leave
          </div>
        </div>

        {/* Currently On Break */}
        <div
          onClick={() => onNavigate("breaks")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">On Break</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition">
              <Coffee className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
            {metrics.currentlyOnBreak}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 font-medium">
            Active timers running
          </div>
        </div>

        {/* Total Working Hours */}
        <div
          onClick={() => onNavigate("ranking")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Work Hours</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight font-mono">
            {metrics.todayTotalWorkHours} <span className="text-sm font-normal text-zinc-400">hrs</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-400/80 font-medium">
            Cumulative net time
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigate("breaks")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 border-amber-500/20 group hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between text-amber-400/80 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">Pending Action</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight font-mono">
            {metrics.pendingBreakRequests + metrics.pendingLeaveApplications + metrics.pendingExitRequests}
          </div>
          <div className="mt-2 text-[11px] text-amber-400/70 font-medium truncate">
            {metrics.pendingBreakRequests} breaks • {metrics.pendingLeaveApplications} leaves
          </div>
        </div>

        {/* System Health */}
        <div
          onClick={() => onNavigate("health")}
          className="glass-card cursor-pointer rounded-2xl p-4.5 border-emerald-500/20 group hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between text-emerald-400/80 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">Core Engine</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
            99.9%
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 font-medium">
            DB & WebSocket Live
          </div>
        </div>
      </div>

      {/* Pending Action Queues & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Queues Column */}
        <div className="glass-panel-elevated rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              <span>Pending Action Queues</span>
            </h3>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
              TRIAGE
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Break Queue Box */}
            <div
              onClick={() => onNavigate("breaks")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-zinc-950/40 hover:border-amber-500/30 hover:bg-zinc-900/60 transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Coffee className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">Break Requests</div>
                  <div className="text-[11px] text-zinc-400">Timed workstation pauses</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 font-mono font-bold text-indigo-400">
                <span>{metrics.pendingBreakRequests}</span>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Leave Queue Box */}
            <div
              onClick={() => onNavigate("leaves")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-zinc-950/40 hover:border-amber-500/30 hover:bg-zinc-900/60 transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">Leave Applications</div>
                  <div className="text-[11px] text-zinc-400">Single & multi-day permits</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 font-mono font-bold text-cyan-400">
                <span>{metrics.pendingLeaveApplications}</span>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Exit Queue Box */}
            <div
              onClick={() => onNavigate("exits")}
              className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-zinc-950/40 hover:border-amber-500/30 hover:bg-zinc-900/60 transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DoorOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">Temporary Exits</div>
                  <div className="text-[11px] text-zinc-400">Emergency departure passes</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 font-mono font-bold text-amber-400">
                <span>{metrics.pendingExitRequests}</span>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Administrative Audit Trail */}
        <div className="lg:col-span-2 glass-panel-elevated rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span>Immutable Audit Trail</span>
            </h3>
            <button
              onClick={() => onNavigate("audit")}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-400">
              <thead className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                <tr>
                  <th className="pb-2.5">Time</th>
                  <th className="pb-2.5">Operator</th>
                  <th className="pb-2.5">Event</th>
                  <th className="pb-2.5">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data?.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.map((evt: any) => (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 font-mono text-[11px] text-zinc-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-semibold text-zinc-200">
                        @{evt.actorUsername}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                          {evt.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400 font-mono text-[11px]">
                        {evt.targetResource}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500 font-mono">
                      No recent events recorded in the ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
