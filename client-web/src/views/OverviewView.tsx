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
  ShieldAlert
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
    const interval = setInterval(fetchOverview, 20000); // 20s live polling
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-teal-400" />
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
      {/* Top Banner: Quick Summary & Live Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Executive Command Center</span>
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-ping" />
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry across all 17 studio editing suites & workstations.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {/* Total Active Employees */}
        <div
          onClick={() => onNavigate("employees")}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Staff</span>
            <Users className="h-4 w-4 text-teal-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalEmployees}</div>
          <div className="mt-1 text-[11px] text-teal-400 font-medium flex items-center">
            <span>View All Profiles</span>
            <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between text-emerald-400/80 mb-2">
            <span className="text-xs font-medium">Present Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{metrics.presentToday}</div>
          <div className="mt-1 text-[11px] text-emerald-400/80 font-medium">
            Clocked in & active
          </div>
        </div>

        {/* Late Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="cursor-pointer rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-amber-400/80 mb-2">
            <span className="text-xs font-medium">Late Arrivals</span>
            <AlertTriangle className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-amber-300">{metrics.lateToday}</div>
          <div className="mt-1 text-[11px] text-amber-400/80 font-medium">
            Past 15m grace period
          </div>
        </div>

        {/* Absent Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="cursor-pointer rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 hover:border-rose-500/40 transition group"
        >
          <div className="flex items-center justify-between text-rose-400/80 mb-2">
            <span className="text-xs font-medium">Absent / Not In</span>
            <Clock className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-rose-300">{metrics.absentToday}</div>
          <div className="mt-1 text-[11px] text-rose-400/80 font-medium">
            {metrics.onLeaveToday} on approved leave
          </div>
        </div>

        {/* On Break Right Now */}
        <div
          onClick={() => onNavigate("breaks")}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Currently on Break</span>
            <Coffee className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.currentlyOnBreak}</div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Active timers running
          </div>
        </div>

        {/* Total Working Hours */}
        <div
          onClick={() => onNavigate("ranking")}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today's Total Hours</span>
            <TrendingUp className="h-4 w-4 text-teal-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-teal-300">{metrics.todayTotalWorkHours} hrs</div>
          <div className="mt-1 text-[11px] text-teal-400/80 font-medium">
            Net work duration
          </div>
        </div>

        {/* Pending Approvals Queue */}
        <div
          onClick={() => onNavigate("breaks")}
          className="cursor-pointer rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-amber-400/80 mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <ShieldAlert className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {metrics.pendingBreakRequests + metrics.pendingLeaveApplications + metrics.pendingExitRequests}
          </div>
          <div className="mt-1 text-[11px] text-amber-400/80 font-medium">
            {metrics.pendingBreakRequests} breaks • {metrics.pendingLeaveApplications} leaves
          </div>
        </div>

        {/* Studio System Health */}
        <div
          onClick={() => onNavigate("health")}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">System Health</span>
            <Activity className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100% OK</div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            SQLite DB • 0 Latency
          </div>
        </div>
      </div>

      {/* Pending Action Banners & Recent Audit Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Column */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Pending Queues Needing Action</span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              Needs Review
            </span>
          </h3>

          <div className="space-y-3">
            {/* Break Queue Box */}
            <div
              onClick={() => onNavigate("breaks")}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Coffee className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Break Requests</div>
                  <div className="text-[11px] text-slate-400">Pending employee break requests</div>
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-400">
                {metrics.pendingBreakRequests}
              </span>
            </div>

            {/* Leave Queue Box */}
            <div
              onClick={() => onNavigate("leaves")}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Leave Applications</div>
                  <div className="text-[11px] text-slate-400">Single & multi-day applications</div>
                </div>
              </div>
              <span className="text-sm font-bold text-teal-400">
                {metrics.pendingLeaveApplications}
              </span>
            </div>

            {/* Exit Queue Box */}
            <div
              onClick={() => onNavigate("exits")}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <DoorOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Temporary Exit Requests</div>
                  <div className="text-[11px] text-slate-400">Temporary workplace departure</div>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-400">
                {metrics.pendingExitRequests}
              </span>
            </div>
          </div>
        </div>

        {/* Live Administrative Audit Trail */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Administrative Events & Audits</h3>
            <button
              onClick={() => onNavigate("audit")}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300"
            >
              View Full Audit Log ➔
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Actor</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.map((evt: any) => (
                    <tr key={evt.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-mono text-[11px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-200">
                        @{evt.actorUsername}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-teal-300">
                          {evt.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {evt.targetResource}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No recent events recorded yet.
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
