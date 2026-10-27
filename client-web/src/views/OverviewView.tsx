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
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
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
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
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
      {/* Top Header: Clean, confident Apple-style title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time workplace telemetry and staff attendance
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="flex items-center space-x-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : "text-zinc-400"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 8 Clean Metric Cards (Stripe / Apple style) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Employees */}
        <div
          onClick={() => onNavigate("employees")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Total Staff</span>
            <Users className="h-4 w-4 text-zinc-400 group-hover:text-amber-400 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.totalEmployees}</div>
          <div className="mt-1 text-xs text-zinc-500 flex items-center group-hover:text-amber-400/90 transition">
            <span>View team</span>
            <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Present Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{metrics.presentToday}</div>
          <div className="mt-1 text-xs text-zinc-500">Clocked in & active</div>
        </div>

        {/* Late Today */}
        <div
          onClick={() => onNavigate("attendance")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Late Arrivals</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{metrics.lateToday}</div>
          <div className="mt-1 text-xs text-zinc-500">Past grace period</div>
        </div>

        {/* Absent */}
        <div
          onClick={() => onNavigate("attendance")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Absent</span>
            <Clock className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-300 tracking-tight">{metrics.absentToday}</div>
          <div className="mt-1 text-xs text-zinc-500">{metrics.onLeaveToday} on leave</div>
        </div>

        {/* Currently On Break */}
        <div
          onClick={() => onNavigate("breaks")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">On Break</span>
            <Coffee className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.currentlyOnBreak}</div>
          <div className="mt-1 text-xs text-zinc-500">Active breaks</div>
        </div>

        {/* Total Working Hours */}
        <div
          onClick={() => onNavigate("ranking")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Total Hours Today</span>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.todayTotalWorkHours} hrs</div>
          <div className="mt-1 text-xs text-zinc-500">Cumulative work</div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigate("breaks")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Pending Requests</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">
            {metrics.pendingBreakRequests + metrics.pendingLeaveApplications + metrics.pendingExitRequests}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Requires review</div>
        </div>

        {/* Attendance Rate */}
        <div
          onClick={() => onNavigate("ranking")}
          className="apple-card rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Attendance Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics.totalEmployees > 0 ? Math.round((metrics.presentToday / metrics.totalEmployees) * 100) : 0}%
          </div>
          <div className="mt-1 text-xs text-zinc-500">Present today</div>
        </div>
      </div>

      {/* Action Queues & Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Column */}
        <div className="apple-glass rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Pending Requests</h2>

          <div className="space-y-2">
            <div
              onClick={() => onNavigate("breaks")}
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Coffee className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-200">Break Requests</span>
              </div>
              <span className="text-xs font-semibold text-amber-300">{metrics.pendingBreakRequests}</span>
            </div>

            <div
              onClick={() => onNavigate("leaves")}
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <CalendarDays className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-200">Leave Applications</span>
              </div>
              <span className="text-xs font-semibold text-amber-300">{metrics.pendingLeaveApplications}</span>
            </div>

            <div
              onClick={() => onNavigate("exits")}
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <DoorOpen className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-200">Temporary Exits</span>
              </div>
              <span className="text-xs font-semibold text-amber-300">{metrics.pendingExitRequests}</span>
            </div>
          </div>
        </div>

        {/* Recent Audit Trail (Linear style minimal clean table) */}
        <div className="lg:col-span-2 apple-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <button
              onClick={() => onNavigate("audit")}
              className="text-xs text-zinc-400 hover:text-white transition flex items-center space-x-1"
            >
              <span>View all</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] text-zinc-500 font-medium">
                <tr>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data?.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.map((evt: any) => (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 text-zinc-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-medium text-zinc-200">
                        @{evt.actorUsername}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-zinc-300">
                          {evt.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400">
                        {evt.targetResource}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500">
                      No recent events recorded.
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
