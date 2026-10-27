import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  CalendarDays,
  Check,
  X,
  HelpCircle,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Plus,
  Printer,
  FileText,
  PieChart,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  Download,
  Info,
  CalendarRange,
  ShieldAlert,
  Layers
} from "lucide-react";

interface LeaveApp {
  id: string;
  userId: string;
  leaveReason: string;
  customReason?: string | null;
  startDate: string;
  endDate: string;
  description?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED";
  decisionReason?: string | null;
  decidedBy?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    jobTitle: string;
    workstationId?: string | null;
    avatarUrl?: string | null;
  };
}

interface LeaveBalance {
  user: {
    id: string;
    username: string;
    fullName: string;
    jobTitle: string;
    workstationId?: string | null;
  };
  year: string;
  policy: {
    ANNUAL: number;
    MEDICAL: number;
    CASUAL: number;
    EMERGENCY: number;
    TOTAL: number;
  };
  breakdown: {
    annual: { allowance: number; used: number; remaining: number };
    medical: { allowance: number; used: number; remaining: number };
    casual: { allowance: number; used: number; remaining: number };
    emergency: { allowance: number; used: number; remaining: number };
    other: { used: number };
  };
  totalUsed: number;
  totalAllowance: number;
  remaining: number;
}

export const LeaveApplicationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"APPLICATIONS" | "CALENDAR" | "BALANCES" | "VOUCHER">("APPLICATIONS");

  // Applications Data
  const [leaves, setLeaves] = useState<LeaveApp[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Balances Data
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [balanceSearch, setBalanceSearch] = useState("");
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Calendar Data
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().substring(0, 7));
  const [calendarData, setCalendarData] = useState<{ targetMonth: string; totalStaff: number; leaves: LeaveApp[] } | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Decision Modal
  const [selectedLeave, setSelectedLeave] = useState<LeaveApp | null>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED">("APPROVED");
  const [decisionReason, setDecisionReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Record Leave on Behalf Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [recordUserId, setRecordUserId] = useState("");
  const [recordReason, setRecordReason] = useState("Annual or planned leave");
  const [recordCustomReason, setRecordCustomReason] = useState("");
  const [recordStartDate, setRecordStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [recordEndDate, setRecordEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [recordDescription, setRecordDescription] = useState("");
  const [recordStatus, setRecordStatus] = useState("APPROVED");
  const [recordNotes, setRecordNotes] = useState("");
  const [recording, setRecording] = useState(false);

  // Voucher print target
  const [voucherLeave, setVoucherLeave] = useState<LeaveApp | null>(null);

  // Presets
  const [presets, setPresets] = useState<string[]>([
    "Annual or planned leave",
    "Sickness or medical issue",
    "Medical appointment",
    "Family emergency",
    "Family responsibility",
    "Personal reasons",
    "Religious observance",
    "Education or examination",
    "Bereavement",
    "Government or official work",
    "Transportation difficulty",
    "Other reason"
  ]);

  const fetchLeaves = () => {
    setLoading(true);
    const params: any = {};
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (searchQuery) params.query = searchQuery;

    api.get("/leaves/all", { params })
      .then((res) => {
        setLeaves(res.data);
        if (!voucherLeave && res.data.length > 0) {
          setVoucherLeave(res.data[0]);
        }
      })
      .catch((err) => console.error("Error fetching leaves:", err))
      .finally(() => setLoading(false));
  };

  const fetchBalances = () => {
    setLoadingBalances(true);
    api.get("/leaves/balances")
      .then((res) => setBalances(res.data))
      .catch((err) => console.error("Error fetching balances:", err))
      .finally(() => setLoadingBalances(false));
  };

  const fetchCalendar = () => {
    setLoadingCalendar(true);
    api.get(`/leaves/calendar?month=${selectedMonth}`)
      .then((res) => setCalendarData(res.data))
      .catch((err) => console.error("Error fetching calendar:", err))
      .finally(() => setLoadingCalendar(false));
  };

  const fetchEmployeesList = () => {
    api.get("/employees")
      .then((res) => setEmployeesList(res.data))
      .catch((err) => console.error("Error fetching employees:", err));
  };

  useEffect(() => {
    fetchLeaves();
    fetchEmployeesList();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === "BALANCES") fetchBalances();
    if (activeTab === "CALENDAR") fetchCalendar();
  }, [activeTab, selectedMonth]);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setSubmitting(true);
    try {
      await api.put(`/leaves/${selectedLeave.id}/decision`, {
        status: decisionType,
        decisionReason,
        internalNotes
      });
      setSelectedLeave(null);
      fetchLeaves();
      if (activeTab === "BALANCES") fetchBalances();
      if (activeTab === "CALENDAR") fetchCalendar();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process leave decision");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordUserId) {
      alert("Please select an employee");
      return;
    }
    setRecording(true);
    try {
      await api.post("/leaves/admin-create", {
        userId: recordUserId,
        leaveReason: recordReason,
        customReason: recordCustomReason || undefined,
        startDate: recordStartDate,
        endDate: recordEndDate,
        description: recordDescription || undefined,
        status: recordStatus,
        internalNotes: recordNotes || undefined
      });
      setShowRecordModal(false);
      setRecordDescription("");
      setRecordNotes("");
      fetchLeaves();
      if (activeTab === "BALANCES") fetchBalances();
      if (activeTab === "CALENDAR") fetchCalendar();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to record leave");
    } finally {
      setRecording(false);
    }
  };

  // Helper calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingCount = leaves.filter((l) => l.status === "PENDING" || l.status === "MORE_INFO_REQUESTED").length;
  const onLeaveToday = leaves.filter(
    (l) => l.status === "APPROVED" && l.startDate <= todayStr && l.endDate >= todayStr
  );

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter !== "ALL" && leave.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = leave.user?.fullName?.toLowerCase().includes(q);
      const matchUser = leave.user?.username?.toLowerCase().includes(q);
      const matchReason = leave.leaveReason?.toLowerCase().includes(q);
      return matchName || matchUser || matchReason;
    }
    return true;
  });

  const filteredBalances = balances.filter((b) => {
    if (!balanceSearch.trim()) return true;
    const q = balanceSearch.toLowerCase();
    return b.user.fullName.toLowerCase().includes(q) || b.user.username.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Leave Management & Studio Roster</h2>
              <p className="text-xs text-slate-400">
                Track employee leave quotas, review pending requests, prevent suite staffing shortages, and generate official vouchers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecordModal(true)}
            className="flex items-center space-x-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition shadow-lg shadow-teal-900/30 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Record Pre-Approved Leave</span>
          </button>
        </div>
      </div>

      {/* Top Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Requests</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{pendingCount}</span>
            <span className="text-xs text-slate-500">awaiting decision</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
            {pendingCount > 0 ? "Requires administrative review" : "Queue fully cleared"}
          </div>
        </div>

        {/* On Leave Today */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">On Leave Today</span>
            <Users className="h-4 w-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{onLeaveToday.length}</span>
            <span className="text-xs text-slate-500">staff out of studio</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {onLeaveToday.length > 0
              ? onLeaveToday.map((l) => l.user.fullName.split(" ")[0]).join(", ")
              : "All 17 suites currently active"}
          </div>
        </div>

        {/* Active Studio Roster Capacity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Roster Availability</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {Math.round(((17 - onLeaveToday.length) / 17) * 100)}%
            </span>
            <span className="text-xs text-slate-500">{17 - onLeaveToday.length}/17 editors</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Production suites operating safely
          </div>
        </div>

        {/* Annual Policy Allowance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Annual Policy Cap</span>
            <PieChart className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-indigo-400">32</span>
            <span className="text-xs text-slate-500">days/yr allowance</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            14 Paid • 10 Medical • 5 Casual • 3 Emg
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("APPLICATIONS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "APPLICATIONS"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Layers className="h-4 w-4 text-teal-400" />
          <span>Applications & Requests</span>
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("CALENDAR")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "CALENDAR"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <CalendarRange className="h-4 w-4 text-indigo-400" />
          <span>Studio Coverage Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab("BALANCES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "BALANCES"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <PieChart className="h-4 w-4 text-emerald-400" />
          <span>Annual Quotas & Balances</span>
        </button>

        <button
          onClick={() => setActiveTab("VOUCHER")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "VOUCHER"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <FileText className="h-4 w-4 text-amber-400" />
          <span>Official Leave Voucher</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS & REQUESTS */}
      {activeTab === "APPLICATIONS" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search editor, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none w-56"
                />
              </div>

              {/* Status Filter Pill Buttons */}
              <div className="hidden md:flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      statusFilter === st
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchLeaves}
              className="text-xs text-teal-400 font-semibold hover:underline self-end sm:self-auto"
            >
              Refresh Queue
            </button>
          </div>

          {/* Leaves List */}
          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-400">
              Loading leave applications...
            </div>
          ) : filteredLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeaves.map((leave) => {
                const isPending = leave.status === "PENDING" || leave.status === "MORE_INFO_REQUESTED";
                const isApproved = leave.status === "APPROVED";
                const isRejected = leave.status === "REJECTED";

                return (
                  <div
                    key={leave.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3.5 relative flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    {/* Top Row: User & Status Badge */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{leave.user.fullName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            @{leave.user.username} • {leave.user.jobTitle}
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            isApproved
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isRejected
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {leave.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Reason Tag */}
                      <div>
                        <span className="inline-block rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/20">
                          {leave.leaveReason}
                        </span>
                      </div>

                      {/* Custom reason note */}
                      {leave.customReason && (
                        <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <span className="font-semibold text-slate-400">Custom Reason:</span> {leave.customReason}
                        </div>
                      )}

                      {/* Date Range Block */}
                      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Start Date:
                          </span>
                          <span className="font-mono text-white font-semibold">{leave.startDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> End Date:
                          </span>
                          <span className="font-mono text-white font-semibold">{leave.endDate}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {leave.description && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/60 line-clamp-3">
                          "{leave.description}"
                        </p>
                      )}

                      {/* Decision Details if Decided */}
                      {leave.decisionReason && (
                        <div className="text-[11px] text-slate-400 bg-slate-800/30 p-2 rounded border border-slate-800">
                          <span className="font-bold text-slate-300">Decision Note:</span> {leave.decisionReason}
                          {leave.decidedBy && <span className="text-slate-500 ml-1">({leave.decidedBy})</span>}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setDecisionType("APPROVED");
                              setDecisionReason("Approved by management");
                              setInternalNotes("");
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-emerald-600/90 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition active:scale-95"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setDecisionType("REJECTED");
                              setDecisionReason("");
                              setInternalNotes("");
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-rose-600/20 py-1.5 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition active:scale-95"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setDecisionType("MORE_INFO_REQUESTED");
                              setDecisionReason("");
                              setInternalNotes("");
                            }}
                            className="flex items-center justify-center rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                            title="Request Clarification"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between">
                          <button
                            onClick={() => {
                              setVoucherLeave(leave);
                              setActiveTab("VOUCHER");
                            }}
                            className="flex items-center space-x-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>View HR Voucher</span>
                          </button>
                          <span className="text-[11px] text-slate-500">
                            Logged {new Date(leave.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
              No leave applications matching the selected criteria.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDIO COVERAGE HEATMAP / CALENDAR */}
      {activeTab === "CALENDAR" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-indigo-400" />
                <span>Monthly Staffing Coverage Heatmap</span>
              </h3>
              <p className="text-xs text-slate-400">
                Visual timeline of all approved absences to safeguard high-volume video export and editing deadlines.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-400">Target Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Calendar Grid */}
          {loadingCalendar ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-400">
              Loading monthly studio heatmap...
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNum = i + 1;
                  const dayStr = `${selectedMonth}-${dayNum.toString().padStart(2, "0")}`;
                  const leavesOnDay = (calendarData?.leaves || []).filter(
                    (l) => l.startDate <= dayStr && l.endDate >= dayStr
                  );
                  const isConflict = leavesOnDay.length >= 2;

                  return (
                    <div
                      key={dayStr}
                      className={`min-h-[90px] rounded-lg p-2.5 border flex flex-col justify-between transition ${
                        isConflict
                          ? "bg-rose-950/20 border-rose-500/40"
                          : leavesOnDay.length > 0
                          ? "bg-amber-950/20 border-amber-500/30"
                          : "bg-slate-950/60 border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{dayNum}</span>
                        {isConflict ? (
                          <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-400 border border-rose-500/30">
                            Shortage Alert
                          </span>
                        ) : leavesOnDay.length > 0 ? (
                          <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                            {leavesOnDay.length} away
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">Full</span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1.5">
                        {leavesOnDay.map((l) => (
                          <div
                            key={l.id}
                            className="text-[10px] font-medium text-slate-300 truncate bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800"
                            title={`${l.user.fullName} (${l.leaveReason})`}
                          >
                            • {l.user.fullName.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 rounded bg-slate-950 border border-slate-800"></div>
                  <span>Full Studio Capacity (0 away)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 rounded bg-amber-950/40 border border-amber-500/40"></div>
                  <span>1 Editor on Leave</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 rounded bg-rose-950/40 border border-rose-500/40"></div>
                  <span>High Shortage Alert (2+ simultaneous leaves)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANNUAL QUOTAS & BALANCES */}
      {activeTab === "BALANCES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="h-4 w-4 text-emerald-400" />
                <span>Employee Annual Leave Quota Ledger</span>
              </h3>
              <p className="text-xs text-slate-400">
                Tracks remaining days against the 32-day statutory studio allowance (14 Annual, 10 Medical, 5 Casual, 3 Emergency).
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search employee quotas..."
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none w-56"
              />
            </div>
          </div>

          {loadingBalances ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-400">
              Calculating leave quotas and remaining balances...
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Editor / Staff</th>
                      <th className="px-4 py-3">Annual Paid (14d)</th>
                      <th className="px-4 py-3">Medical/Sick (10d)</th>
                      <th className="px-4 py-3">Casual (5d)</th>
                      <th className="px-4 py-3">Emergency (3d)</th>
                      <th className="px-4 py-3">Total Used</th>
                      <th className="px-4 py-3">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredBalances.map((item) => {
                      const pctUsed = Math.round((item.totalUsed / item.totalAllowance) * 100);

                      return (
                        <tr key={item.user.id} className="hover:bg-slate-850/50 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white text-xs">{item.user.fullName}</div>
                            <div className="text-[11px] text-slate-500">
                              @{item.user.username} • {item.user.jobTitle}
                            </div>
                          </td>

                          {/* Annual */}
                          <td className="px-4 py-3 font-mono">
                            <span className="text-white font-bold">{item.breakdown.annual.used}</span>
                            <span className="text-slate-500"> / {item.breakdown.annual.allowance}d</span>
                          </td>

                          {/* Medical */}
                          <td className="px-4 py-3 font-mono">
                            <span className="text-white font-bold">{item.breakdown.medical.used}</span>
                            <span className="text-slate-500"> / {item.breakdown.medical.allowance}d</span>
                          </td>

                          {/* Casual */}
                          <td className="px-4 py-3 font-mono">
                            <span className="text-white font-bold">{item.breakdown.casual.used}</span>
                            <span className="text-slate-500"> / {item.breakdown.casual.allowance}d</span>
                          </td>

                          {/* Emergency */}
                          <td className="px-4 py-3 font-mono">
                            <span className="text-white font-bold">{item.breakdown.emergency.used}</span>
                            <span className="text-slate-500"> / {item.breakdown.emergency.allowance}d</span>
                          </td>

                          {/* Total Used */}
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-amber-400">{item.totalUsed} days</span>
                          </td>

                          {/* Remaining with Progress Bar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-emerald-400 font-mono text-xs w-10">
                                {item.remaining}d
                              </span>
                              <div className="h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pctUsed > 80 ? "bg-rose-500" : pctUsed > 50 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, pctUsed)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OFFICIAL LEAVE VOUCHER / SLIP GENERATOR */}
      {activeTab === "VOUCHER" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span>Official Frame Production HR Leave Voucher</span>
              </h3>
              <p className="text-xs text-slate-400">
                Printable corporate leave sanction certificate for HR records, physical file archives, and auditor inspections.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={voucherLeave?.id || ""}
                onChange={(e) => {
                  const found = leaves.find((l) => l.id === e.target.value);
                  if (found) setVoucherLeave(found);
                }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {leaves.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.user.fullName} ({l.startDate} to {l.endDate}) - {l.status}
                  </option>
                ))}
              </select>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition border border-slate-700"
              >
                <Printer className="h-3.5 w-3.5 text-amber-400" />
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>

          {/* Printable Voucher Paper Card */}
          {voucherLeave ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-950 p-8 shadow-2xl relative text-slate-200 font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
                <div>
                  <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span className="text-amber-400">FRAME</span> PRODUCTION
                  </div>
                  <div className="text-[11px] text-slate-400 tracking-wider uppercase mt-0.5">
                    HUMAN RESOURCES DEPARTMENT • LEAVE SANCTION CERTIFICATE
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-300">
                    VOUCHER #{voucherLeave.id.substring(0, 8).toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ISSUED: {new Date().toISOString().split("T")[0]}
                  </div>
                </div>
              </div>

              {/* Status Ribbon */}
              <div className="mb-6 flex items-center justify-between bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Official Sanction Status:</span>
                <span
                  className={`px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                    voucherLeave.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {voucherLeave.status}
                </span>
              </div>

              {/* Employee & Leave Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Employee Name:</div>
                  <div className="text-white font-bold text-sm">{voucherLeave.user.fullName}</div>
                  <div className="text-slate-400">@{voucherLeave.user.username}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Designation / Suite:</div>
                  <div className="text-white font-semibold">{voucherLeave.user.jobTitle}</div>
                  <div className="text-slate-400">{voucherLeave.user.workstationId || "Master Suite"}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Leave Classification:</div>
                  <div className="text-amber-400 font-semibold">{voucherLeave.leaveReason}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Sanctioned Date Range:</div>
                  <div className="text-white font-mono font-bold">
                    {voucherLeave.startDate} → {voucherLeave.endDate}
                  </div>
                </div>
              </div>

              {/* Reason / Statement */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5 mb-8 text-xs">
                <div className="text-slate-400 font-semibold">Employee Statement / Application Remarks:</div>
                <div className="text-slate-300 italic">
                  "{voucherLeave.description || voucherLeave.customReason || "Regular planned absence pursuant to studio roster policy."}"
                </div>
                {voucherLeave.decisionReason && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">Management Endorsement:</span> {voucherLeave.decisionReason}
                  </div>
                )}
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-800">
                <div className="space-y-4">
                  <div className="h-10 border-b border-dashed border-slate-700 flex items-end">
                    <span className="text-[11px] font-mono text-slate-400">{voucherLeave.user.fullName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Employee Digital Signature
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-10 border-b border-dashed border-slate-700 flex items-end justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {voucherLeave.decidedBy || "ADMIN_OPS"} [VERIFIED]
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono">SEAL-FP-2026</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Authorised HR Administrator
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500">
              Select a leave application from above to inspect and print its HR Voucher.
            </div>
          )}
        </div>
      )}

      {/* RECORD LEAVE ON BEHALF MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-400" />
                <span>Record Pre-Approved Leave</span>
              </h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Employee / Editor *
                </label>
                <select
                  required
                  value={recordUserId}
                  onChange={(e) => setRecordUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} (@{emp.username}) - {emp.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Leave Reason / Classification *
                </label>
                <select
                  value={recordReason}
                  onChange={(e) => setRecordReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  {presets.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {recordReason === "Other reason" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Reason Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={recordCustomReason}
                    onChange={(e) => setRecordCustomReason(e.target.value)}
                    placeholder="Specify exact reason..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recordStartDate}
                    onChange={(e) => setRecordStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recordEndDate}
                    onChange={(e) => setRecordEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={recordDescription}
                  onChange={(e) => setRecordDescription(e.target.value)}
                  placeholder="e.g. Approved in weekly sprint meeting; handover completed to backup editor."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={recordStatus}
                    onChange={(e) => setRecordStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="APPROVED">APPROVED (Immediate)</option>
                    <option value="PENDING">PENDING (Hold for confirmation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Internal HR Tag
                  </label>
                  <input
                    type="text"
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                    placeholder="HR file ref code..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {recording ? "Saving..." : "Record Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION MODAL */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Leave Decision: {decisionType.replace("_", " ")}
              </h3>
              <p className="text-xs text-slate-400">
                Applicant: <span className="font-bold text-white">{selectedLeave.user.fullName}</span> ({selectedLeave.startDate} to {selectedLeave.endDate})
              </p>
            </div>

            <form onSubmit={handleDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Decision Explanation / Message to Employee *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Provide feedback or confirmation..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Management Notes (Optional)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes visible only to administrators..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Submit Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
