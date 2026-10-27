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
  FileSpreadsheet,
  Plus,
  AlertTriangle,
  Award,
  TrendingUp,
  History,
  Timer
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

  // Manual Punch Creation Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [manualUserId, setManualUserId] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [manualClockIn, setManualClockIn] = useState("09:00");
  const [manualClockOut, setManualClockOut] = useState("18:00");
  const [manualStatus, setManualStatus] = useState("PRESENT");
  const [manualReason, setManualReason] = useState("Supervisor entry - Workstation maintenance");
  const [creatingManual, setCreatingManual] = useState(false);

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

  const fetchEmployees = () => {
    api.get("/employees")
      .then((res) => setEmployeesList(res.data))
      .catch((err) => console.error("Error fetching employees:", err));
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, startDate, endDate, isRange, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Quick Date Preset Handlers
  const setPreset = (preset: "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH") => {
    const today = new Date();
    if (preset === "TODAY") {
      setIsRange(false);
      setDate(today.toISOString().split("T")[0]);
    } else if (preset === "YESTERDAY") {
      setIsRange(false);
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      setDate(y.toISOString().split("T")[0]);
    } else if (preset === "THIS_WEEK") {
      setIsRange(true);
      const first = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      const last = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "THIS_MONTH") {
      setIsRange(true);
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

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

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId) {
      alert("Please select an employee");
      return;
    }
    setCreatingManual(true);
    try {
      const inIso = new Date(`${manualDate}T${manualClockIn}:00`).toISOString();
      const outIso = manualClockOut ? new Date(`${manualDate}T${manualClockOut}:00`).toISOString() : undefined;

      await api.post("/attendance/manual-create", {
        userId: manualUserId,
        date: manualDate,
        clockInTime: inIso,
        clockOutTime: outIso,
        status: manualStatus,
        reason: manualReason
      });
      setShowManualModal(false);
      fetchAttendance();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create manual attendance punch");
    } finally {
      setCreatingManual(false);
    }
  };

  const handleExportCSV = () => {
    const url = `${API_BASE_URL}/attendance/export?date=${date}${startDate && endDate ? `&startDate=${startDate}&endDate=${endDate}` : ""}`;
    window.open(url, "_blank");
  };

  // Telemetry Metrics
  const totalSessions = sessions.length;
  const onTimeCount = sessions.filter((s) => s.status === "PRESENT").length;
  const lateCount = sessions.filter((s) => s.status === "LATE").length;
  const leaveCount = sessions.filter((s) => s.status === "ON_LEAVE").length;

  let totalOvertimeMins = 0;
  sessions.forEach((s) => {
    if (s.netWorkMinutes > 480) {
      totalOvertimeMins += (s.netWorkMinutes - 480);
    }
  });

  const punctualityRate = totalSessions > 0 ? Math.round((onTimeCount / totalSessions) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Attendance & Telemetry Matrix</h2>
              <p className="text-xs text-slate-400">
                Precision workstation punch tracking, overtime ledger, and supervisor audit trail.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center space-x-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition shadow active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Record Missed Punch</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition shadow"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Logged Sessions</span>
            <Calendar className="h-4 w-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{totalSessions}</span>
            <span className="text-xs text-slate-500">records retrieved</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-400/90 font-medium">
            Active editor workstations
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Punctuality Rate</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{punctualityRate}%</span>
            <span className="text-xs text-slate-500">{onTimeCount} on-time</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Within 15-min shift grace window
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Late Arrivals</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{lateCount}</span>
            <span className="text-xs text-slate-500">exceeded 09:15 AM</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {leaveCount > 0 ? `${leaveCount} approved leaves` : "No pending violations"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Overtime (OT) Logged</span>
            <Timer className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-indigo-400">
              {Math.floor(totalOvertimeMins / 60)}h {totalOvertimeMins % 60}m
            </span>
            <span className="text-xs text-slate-500">beyond 8h shift</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Calculated for payroll export
          </div>
        </div>
      </div>

      {/* Shift Window Banner */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Standard Production Shift: 09:00 AM – 06:00 PM (Mon–Sat)</span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.2 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                15m Grace Period
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Clock-ins after 09:15 AM are automatically flagged as LATE. Daily lunch allowance: 60 minutes.
            </div>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          <button
            onClick={() => setPreset("TODAY")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            Today
          </button>
          <button
            onClick={() => setPreset("YESTERDAY")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            Yesterday
          </button>
          <button
            onClick={() => setPreset("THIS_WEEK")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            This Week
          </button>
          <button
            onClick={() => setPreset("THIS_MONTH")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            This Month
          </button>
        </div>
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
              <option value="PRESENT">Present (On-Time)</option>
              <option value="LATE">Late Arrival</option>
              <option value="ON_LEAVE">Approved Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search employee name or @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAttendance()}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchAttendance}
            className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Break Deducted</th>
                <th className="py-3 px-4">Net Work Time</th>
                <th className="py-3 px-4">Overtime (OT)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sync Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : sessions.length > 0 ? (
                sessions.map((s) => {
                  const otMins = Math.max(0, s.netWorkMinutes - 480);
                  const isLate = s.status === "LATE";

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">{s.date}</td>
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onOpenProfile(s.user.id)}
                          className="cursor-pointer font-bold text-teal-400 hover:text-teal-300 transition"
                        >
                          {s.user.fullName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            @{s.user.username} • {s.user.workstationId || "Suite"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {new Date(s.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {s.clockOutTime ? (
                          new Date(s.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-teal-400 font-semibold animate-pulse">● Active In-Studio</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-indigo-400 font-mono">{s.breakDeductedMins} mins</td>
                      <td className="py-3 px-4 font-bold text-white font-mono">
                        {Math.floor(s.netWorkMinutes / 60)}h {s.netWorkMinutes % 60}m
                      </td>

                      {/* Overtime (OT) Column */}
                      <td className="py-3 px-4">
                        {otMins > 0 ? (
                          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 font-mono">
                            +{Math.floor(otMins / 60)}h {otMins % 60}m OT
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            s.status === "PRESENT"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : s.status === "LATE"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : s.status === "ON_LEAVE"
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
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
                          className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 transition border border-slate-700"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Correct</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
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

      {/* Manual Missed Punch Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-400" />
                <span>Record Missed Punch / Session</span>
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Employee *</label>
                <select
                  required
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} (@{emp.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Clock In Time *</label>
                  <input
                    type="time"
                    required
                    value={manualClockIn}
                    onChange={(e) => setManualClockIn(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Clock Out Time</label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={(e) => setManualClockOut(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / HR Audit Tag *</label>
                <input
                  type="text"
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Workstation network card replacement"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingManual}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {creatingManual ? "Saving..." : "Record Punch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Attendance Correction Modal */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-teal-400" />
                <span>Supervisor Attendance Correction</span>
              </h3>
              <button onClick={() => setCorrectionTarget(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCorrect} className="space-y-4">
              <div className="text-xs text-slate-400">
                Adjusting punch timestamp for <span className="font-bold text-white">{correctionTarget.user?.fullName}</span> on <span className="font-mono text-teal-300">{correctionTarget.date}</span>.
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
                  <option value="PRESENT">PRESENT (On-Time)</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Correction (Audited) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Employee was rendering 4K timeline on workstation WS-04 with supervisor verbal consent."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {correcting ? "Saving..." : "Save Correction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
