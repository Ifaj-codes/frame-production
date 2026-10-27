import React, { useEffect, useState } from "react";
import { api } from "../api";
import { FileText, Search, ShieldCheck, RefreshCw } from "lucide-react";

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [searchActor, setSearchActor] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    const params: any = {};
    if (filterAction) params.action = filterAction;

    api.get("/settings/audit-logs", { params })
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error fetching audit logs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const filtered = logs.filter((l) => {
    if (!searchActor) return true;
    return (
      l.actorUsername.toLowerCase().includes(searchActor.toLowerCase()) ||
      (l.detailsJson && l.detailsJson.toLowerCase().includes(searchActor.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            <span>Immutable Administrative Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Accountability ledger recording all role changes, password resets, attendance corrections, and decisions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_CREATE">USER_CREATE</option>
            <option value="USER_RENAME">USER_RENAME</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            <option value="ATTENDANCE_CORRECTION">ATTENDANCE_CORRECTION</option>
            <option value="LEAVE_APPROVED">LEAVE_APPROVED</option>
            <option value="BREAK_APPROVED">BREAK_APPROVED</option>
            <option value="UPDATE_BRANDING">UPDATE_BRANDING</option>
          </select>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search actor username or keyword in details..."
            value={searchActor}
            onChange={(e) => setSearchActor(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      @{log.actorUsername}
                    </td>
                    <td className="py-3 px-4 text-teal-300 font-bold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.targetResource}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-sans max-w-xs truncate">
                      {log.detailsJson || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No audit records matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
