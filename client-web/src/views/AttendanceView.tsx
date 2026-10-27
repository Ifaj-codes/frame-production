import React, { useEffect, useState } from "react";
import { api, API_BASE_URL } from "../api";
import {
  CalendarCheck,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Edit2,
  X,
  FileSpreadsheet
} from "lucide-react";

interface AttendanceViewProps {
  onOpenProfile: (id: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onOpenProfile }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isRange, setIsRange] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<any | null>(null);
  const [newClockIn, setNewClockIn] = useState("");
  const [newClockOut, setNewClockOut] = useState("");
  const [newStatus, setNewStatus] = useState("PRESENT");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correcting, setCorrecting] = useState(false);

  const fetchAttendance = () => {
    setLoading(true);
    const params: any = {};
    if (isRange && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else {
      params.date = date;
    }
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (searchQuery) params.query = searchQuery;

    api.get("/attendance/search", { params })
      .then((res) => setSessions(res.data.sessions || []))
      .catch((err) => console.error("Error fetching attendance:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, startDate, endDate, isRange, statusFilter]);

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      alert("Please provide a reason for the manual attendance correction");
      return;
    }
    setCorrecting(true);
    try {
      await api.post(`/attendance/${correctionTarget.id}/correct`, {
        clockInTime: newClockIn ? new Date(newClockIn).toISOString() : undefined,
        clockOutTime: newClockOut ? new Date(newClockOut).toISOString() : undefined,
        status: newStatus,
        reason: correctionReason
      });
      setCorrectionTarget(null);
      fetchAttendance();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit correction");
    } finally {
      setCorrecting(false);
    }
  };

  const handleExportCSV = () => {
    const url = `${API_BASE_URL}/attendance/export?date=${date}${startDate && endDate ? `&startDate=${startDate}&endDate=${endDate}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-teal-400" />
            <span>Attendance Management & Precision Search</span>
          </h2>
          <p className="text-xs text-slate-400">
            Search single date or custom date range across all video editors and staff.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/20 transition shadow"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export to CSV / Excel</span>
        </button>
      </div>

      {/* Date & Range Picker Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isRange}
              onChange={(e) => setIsRange(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500"
            />
            <span>Search Date Range</span>
          </label>

          {!isRange ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Target Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late Arrival</option>
              <option value="ON_LEAVE">Approved Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search employee name or @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAttendance()}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchAttendance}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Total Elapsed</th>
                <th className="py-3 px-4">Break Deducted</th>
                <th className="py-3 px-4">Net Work Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sync Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.length > 0 ? (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">{s.date}</td>
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onOpenProfile(s.user.id)}
                        className="cursor-pointer font-bold text-teal-400 hover:text-teal-300 transition"
                      >
                        {s.user.fullName}
                        <span className="block text-[10px] text-slate-400 font-normal">@{s.user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {new Date(s.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {s.clockOutTime ? new Date(s.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In Session"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{s.totalElapsedMinutes} mins</td>
                    <td className="py-3 px-4 text-indigo-400">{s.breakDeductedMins} mins</td>
                    <td className="py-3 px-4 font-bold text-teal-300">
                      {Math.floor(s.netWorkMinutes / 60)}h {s.netWorkMinutes % 60}m
                    </td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-400" :
                        s.status === "LATE" ? "bg-amber-500/10 text-amber-400" :
                        s.status === "ON_LEAVE" ? "bg-teal-500/10 text-teal-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[10px]">
                      {s.isOfflineRecorded ? (
                        <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 font-medium text-indigo-300 border border-indigo-500/20">
                          Offline Synced
                        </span>
                      ) : (
                        <span className="text-slate-500">Live Server</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setCorrectionTarget(s);
                          setNewClockIn(s.clockInTime ? new Date(s.clockInTime).toISOString().slice(0, 16) : "");
                          setNewClockOut(s.clockOutTime ? new Date(s.clockOutTime).toISOString().slice(0, 16) : "");
                          setNewStatus(s.status);
                          setCorrectionReason("");
                        }}
                        className="inline-flex items-center space-x-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 transition"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Correct</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No attendance sessions found for the selected query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Correction Modal */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-teal-400" />
                <span>Manual Attendance Correction</span>
              </h3>
              <button onClick={() => setCorrectionTarget(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCorrect} className="space-y-4">
              <div className="text-xs text-slate-400">
                Correcting session for <span className="font-bold text-white">{correctionTarget.user?.fullName}</span> on <span className="font-mono text-teal-300">{correctionTarget.date}</span>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Clock In Time</label>
                  <input
                    type="datetime-local"
                    value={newClockIn}
                    onChange={(e) => setNewClockIn(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Clock Out Time</label>
                  <input
                    type="datetime-local"
                    value={newClockOut}
                    onChange={(e) => setNewClockOut(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Override</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Correction (Required for Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Employee had network glitch at 9:02 AM, verified by Operations Director..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {correcting ? "Saving Correction..." : "Commit Correction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
