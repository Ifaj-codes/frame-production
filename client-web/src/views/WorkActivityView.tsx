import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Activity, Laptop, Clock, Calendar, CheckCircle, RefreshCw } from "lucide-react";

export const WorkActivityView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [activityData, setActivityData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/employees")
      .then((res) => {
        setEmployees(res.data);
        if (res.data.length > 0) {
          setSelectedEmpId(res.data[0].id);
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  const fetchActivity = () => {
    if (!selectedEmpId) return;
    setLoading(true);
    api.get(`/monitoring/activity/employee/${selectedEmpId}?date=${selectedDate}`)
      .then((res) => setActivityData(res.data))
      .catch((err) => console.error("Error fetching activity:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivity();
  }, [selectedEmpId, selectedDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-400" />
          <span>Workstation Activity & Application Usage</span>
        </h2>
        <p className="text-xs text-slate-400">
          Audited foreground software usage (Adobe Premiere Pro, After Effects, DaVinci Resolve) and active editing vs idle duration.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Select Employee:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} (@{emp.username})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          />
        </div>

        <button
          onClick={fetchActivity}
          className="flex items-center space-x-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      {activityData?.appSummary && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white">Aggregated Application Hours</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(activityData.appSummary).map(([app, metrics]: [string, any]) => {
              const activeMins = Math.round((metrics.durationSeconds - metrics.idleSeconds) / 60);
              const idleMins = Math.round(metrics.idleSeconds / 60);

              return (
                <div key={app} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                  <div className="font-bold text-white text-xs truncate" title={app}>{app}</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-teal-400 font-semibold">{activeMins} mins active</span>
                    <span className="text-slate-500">{idleMins} mins idle</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-teal-500 h-full"
                      style={{ width: `${Math.min(100, (activeMins / Math.max(1, activeMins + idleMins)) * 100)}%` }}
                    />
                    <div
                      className="bg-amber-500/60 h-full"
                      style={{ width: `${Math.min(100, (idleMins / Math.max(1, activeMins + idleMins)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white">Recent Foreground Window Log</h3>
        {activityData?.timeline?.length > 0 ? (
          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
            {activityData.timeline.map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">{item.appName}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-md">{item.windowTitle}</div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-teal-400 font-bold">{Math.round(item.durationSeconds / 60)}m</span>
                  <div className="text-[10px] text-slate-500">
                    {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-8">
            No application activities recorded for this date.
          </div>
        )}
      </div>
    </div>
  );
};
