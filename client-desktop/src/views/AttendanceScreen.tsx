import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { enqueueOfflineEvent } from "../services/offlineQueue";
import {
  Film,
  User,
  Clock,
  CalendarCheck,
  Coffee,
  CalendarDays,
  DoorOpen,
  LogOut,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Trophy,
  ShieldAlert,
  X,
  Send,
  Camera
} from "lucide-react";

export const AttendanceScreen: React.FC = () => {
  const { user, isOnline, logout } = useAuth();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);

  // Modals state
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);

  // Break Request Form
  const [breakTypes, setBreakTypes] = useState<any[]>([]);
  const [selectedBreakTypeId, setSelectedBreakTypeId] = useState("");
  const [requestedBreakMinutes, setRequestedBreakMinutes] = useState(15);
  const [breakNotes, setBreakNotes] = useState("");

  // Temporary Exit Form
  const [exitReason, setExitReason] = useState("");
  const [expectedReturnTime, setExpectedReturnTime] = useState("");

  // Leave Form
  const [leaveReason, setLeaveReason] = useState("Sickness or medical issue");
  const [customLeaveReason, setCustomLeaveReason] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveDescription, setLeaveDescription] = useState("");

  // My Rankings Data
  const [myRanking, setMyRanking] = useState<any | null>(null);

  // Ticking Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = () => {
    setLoading(true);
    api.get("/attendance/today")
      .then((res) => setAttendanceData(res.data))
      .catch((err) => console.warn("Failed to fetch today's status from server:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTodayStatus();
    // Fetch break types
    api.get("/breaks/types")
      .then((res) => {
        setBreakTypes(res.data);
        if (res.data.length > 0) setSelectedBreakTypeId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  // Clock In Action
  const handleClockIn = async () => {
    setPunching(true);
    if (!isOnline) {
      await enqueueOfflineEvent("CLOCK_IN");
      setAttendanceData({
        isClockedIn: true,
        session: {
          status: "PRESENT",
          clockInTime: new Date().toISOString(),
          isOfflineRecorded: true
        }
      });
      alert("Clock In recorded offline. It will automatically synchronize when internet access returns.");
      setPunching(false);
      return;
    }

    try {
      const res = await api.post("/attendance/clock-in");
      setAttendanceData({
        isClockedIn: true,
        session: res.data.session
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Clock in failed");
    } finally {
      setPunching(false);
    }
  };

  // Clock Out Action
  const handleClockOut = async () => {
    if (!confirm("Are you sure you want to end your workstation session for today?")) return;
    setPunching(true);

    if (!isOnline) {
      await enqueueOfflineEvent("CLOCK_OUT");
      setAttendanceData((prev: any) => ({
        ...prev,
        isClockedIn: false,
        session: { ...prev?.session, clockOutTime: new Date().toISOString() }
      }));
      alert("Clock Out recorded offline. Will synchronize upon connection.");
      setPunching(false);
      return;
    }

    try {
      const res = await api.post("/attendance/clock-out");
      setAttendanceData({
        isClockedIn: false,
        session: res.data.session
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Clock out failed");
    } finally {
      setPunching(false);
    }
  };

  // Submit Break Request
  const handleSubmitBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/breaks/request", {
        breakTypeId: selectedBreakTypeId,
        requestedMinutes: requestedBreakMinutes,
        notes: breakNotes
      });
      setShowBreakModal(false);
      setBreakNotes("");
      alert("Break request submitted to Administrator");
      fetchTodayStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to request break");
    }
  };

  // End Active Break
  const handleEndBreak = async (breakId: string) => {
    try {
      await api.post(`/breaks/${breakId}/end`);
      fetchTodayStatus();
    } catch (err: any) {
      alert("Failed to end break");
    }
  };

  // Submit Exit Request
  const handleSubmitExit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/exits/request", {
        reason: exitReason,
        departureTime: new Date().toISOString(),
        expectedReturnTime: new Date(expectedReturnTime).toISOString()
      });
      setShowExitModal(false);
      setExitReason("");
      alert("Exit request submitted to Administrator");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit exit request");
    }
  };

  // Submit Leave Application
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/leaves/apply", {
        leaveReason,
        customReason: leaveReason === "Other reason" ? customLeaveReason : undefined,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        description: leaveDescription
      });
      setShowLeaveModal(false);
      alert("Leave application submitted successfully");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to apply for leave");
    }
  };

  // Fetch My Performance & Ranking
  const handleOpenMyRanking = () => {
    setShowRankingModal(true);
    api.get("/reports/monthly")
      .then((res) => {
        if (res.data?.rankings?.length > 0) {
          setMyRanking(res.data.rankings[0]);
        }
      })
      .catch(() => {});
  };

  const isClockedIn = attendanceData?.isClockedIn;
  const currentSession = attendanceData?.session;
  const activeBreak = attendanceData?.activeBreak;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
      {/* Top Application Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 shadow-md shadow-amber-500/10">
            <img src="/logo.png" alt="Frame Production Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Frame Production</h1>
            <p className="text-[10px] text-amber-400 font-medium">Workstation Client • Studio Suite</p>
          </div>
        </div>

        {/* Network & User Info */}
        <div className="flex items-center space-x-4">
          {/* Online/Offline Badge */}
          <div className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
            isOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span>Central Sync Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline Mode (Queue Active)</span>
              </>
            )}
          </div>

          {/* User Pill */}
          <div className="flex items-center space-x-2.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
              {user?.fullName.charAt(0)}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white leading-none">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                @{user?.username} • {user?.workstationId || "Suite"}
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={logout}
            title="Sign out of workstation"
            className="rounded-lg p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Attendance Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6 flex flex-col justify-center">
        {/* Live Date & Time Centerpiece */}
        <div className="text-center space-y-1">
          <div className="text-xs uppercase font-bold tracking-widest text-teal-400">
            {currentTime.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>

        {/* Primary Attendance Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="text-xs font-semibold text-slate-400">Current Workstation Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                  isClockedIn ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isClockedIn ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  {isClockedIn ? "WORK SESSION ACTIVE" : "NOT CLOCKED IN"}
                </span>

                {currentSession?.status === "LATE" && (
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                    Late Arrival
                  </span>
                )}
              </div>
            </div>

            {/* Total Working Time Ticker */}
            <div className="text-center sm:text-right">
              <span className="text-xs text-slate-400">Today's Recorded Working Time</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {currentSession?.netWorkMinutes ? `${Math.floor(currentSession.netWorkMinutes / 60)}h ${currentSession.netWorkMinutes % 60}m` : "0h 0m"}
              </div>
            </div>
          </div>

          {/* Active Break Banner */}
          {activeBreak && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <div className="flex items-center space-x-3">
                <Coffee className="h-6 w-6 text-indigo-400 animate-bounce" />
                <div>
                  <div className="font-bold text-sm text-white">Currently on {activeBreak.breakType.name}</div>
                  <div className="text-xs text-indigo-300/80">
                    Started at {new Date(activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Approved: {activeBreak.approvedMinutes} mins
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleEndBreak(activeBreak.id)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow"
              >
                End Break & Resume Work
              </button>
            </div>
          )}

          {/* Primary Action Button (Clock In / Clock Out) */}
          <div className="flex justify-center pt-2">
            {!isClockedIn ? (
              <button
                onClick={handleClockIn}
                disabled={punching}
                className="flex items-center space-x-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-10 py-5 text-lg shadow-xl shadow-teal-500/20 transition transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Play className="h-6 w-6 fill-current" />
                <span>{punching ? "Recording Session..." : "CLOCK IN TO WORK"}</span>
              </button>
            ) : (
              <button
                onClick={handleClockOut}
                disabled={punching}
                className="flex items-center space-x-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black px-10 py-5 text-lg shadow-xl shadow-rose-600/20 transition transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Square className="h-6 w-6 fill-current" />
                <span>{punching ? "Saving Session..." : "CLOCK OUT"}</span>
              </button>
            )}
          </div>

          {/* Session Details */}
          {isClockedIn && currentSession?.clockInTime && (
            <div className="text-center text-xs text-slate-400 font-mono">
              Session started today at <span className="text-white font-bold">{new Date(currentSession.clockInTime).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* 4 Action Modals Trigger Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setShowBreakModal(true)}
            disabled={!isClockedIn || !!activeBreak}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition disabled:opacity-40 group text-center"
          >
            <Coffee className="h-5 w-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Request Break</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Prayer, Lunch, etc.</span>
          </button>

          <button
            onClick={() => setShowExitModal(true)}
            disabled={!isClockedIn}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition disabled:opacity-40 group text-center"
          >
            <DoorOpen className="h-5 w-5 text-amber-400 mb-2 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Temporary Exit</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Short departure</span>
          </button>

          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition group text-center"
          >
            <CalendarDays className="h-5 w-5 text-teal-400 mb-2 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Apply for Leave</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Single / multi-day</span>
          </button>

          <button
            onClick={handleOpenMyRanking}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition group text-center"
          >
            <Trophy className="h-5 w-5 text-amber-400 mb-2 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">My Monthly Score</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Ranking & discipline</span>
          </button>
        </div>

        {/* Telemetry Indicator */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 text-center">
          <Camera className="h-3.5 w-3.5 text-teal-500/70" />
          <span>Workstation Telemetry Active • Idle Time & Studio Activity Audited</span>
        </div>
      </main>

      {/* Break Request Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Request Workstation Break</h3>

            <form onSubmit={handleSubmitBreak} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Break Type</label>
                <select
                  value={selectedBreakTypeId}
                  onChange={(e) => setSelectedBreakTypeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  {breakTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Max {t.maxDurationMinutes} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Requested Duration: <span className="text-teal-400">{requestedBreakMinutes} Minutes</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={requestedBreakMinutes}
                  onChange={(e) => setRequestedBreakMinutes(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Optional Notes</label>
                <input
                  type="text"
                  value={breakNotes}
                  onChange={(e) => setBreakNotes(e.target.value)}
                  placeholder="e.g. Lunch with client..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBreakModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Temporary Exit Permission</h3>

            <form onSubmit={handleSubmitExit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  required
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  placeholder="e.g. Bank visit, client footage delivery..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Return Time</label>
                <input
                  type="datetime-local"
                  required
                  value={expectedReturnTime}
                  onChange={(e) => setExpectedReturnTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                >
                  Submit Exit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Application Modal (12 Preset Reasons) */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Submit Leave Application</h3>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Reason Category</label>
                <select
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="Sickness or medical issue">1. Sickness or medical issue</option>
                  <option value="Medical appointment">2. Medical appointment</option>
                  <option value="Family emergency">3. Family emergency</option>
                  <option value="Family responsibility">4. Family responsibility</option>
                  <option value="Personal reasons">5. Personal reasons</option>
                  <option value="Religious observance">6. Religious observance</option>
                  <option value="Education or examination">7. Education or examination</option>
                  <option value="Bereavement">8. Bereavement</option>
                  <option value="Government or official work">9. Government or official work</option>
                  <option value="Transportation difficulty">10. Transportation difficulty</option>
                  <option value="Annual or planned leave">11. Annual or planned leave</option>
                  <option value="Other reason">12. Other reason</option>
                </select>
              </div>

              {leaveReason === "Other reason" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specific Custom Reason</label>
                  <input
                    type="text"
                    required
                    value={customLeaveReason}
                    onChange={(e) => setCustomLeaveReason(e.target.value)}
                    placeholder="Specify custom reason..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={leaveDescription}
                  onChange={(e) => setLeaveDescription(e.target.value)}
                  placeholder="Optional details for approving administrator..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Performance Modal */}
      {showRankingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span>My Monthly Evaluation</span>
              </h3>
              <button onClick={() => setShowRankingModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {myRanking ? (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Current Monthly Discipline Score</div>
                  <div className="text-4xl font-black text-teal-400 mt-1">{myRanking.disciplineScore}</div>
                  <div className="text-xs font-bold text-amber-400 mt-1">Company Rank #{myRanking.rank}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500">Punctuality Rate</span>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">{myRanking.punctualityRate}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500">Break Compliance</span>
                    <div className="font-bold text-indigo-400 text-sm mt-0.5">{myRanking.breakComplianceRate}%</div>
                  </div>
                </div>

                {myRanking.managerNotes && (
                  <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 italic">
                    "{myRanking.managerNotes}"
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                Monthly performance metrics are compiled at the end of each working cycle.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
