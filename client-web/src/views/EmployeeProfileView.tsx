import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  ArrowLeft,
  User,
  CalendarCheck,
  Coffee,
  CalendarDays,
  DoorOpen,
  Activity,
  Trophy,
  History,
  Laptop,
  CheckCircle2,
  Clock,
  AlertTriangle,
  KeyRound,
  Edit3,
  ShieldAlert,
  Camera
} from "lucide-react";

interface EmployeeProfileViewProps {
  employeeId: string;
  onBack: () => void;
  onRenameUser?: (userId: string, currentUsername: string) => void;
  onResetPassword?: (userId: string, username: string) => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employeeId,
  onBack,
  onRenameUser,
  onResetPassword
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const fetchProfile = () => {
    setLoading(true);
    api.get(`/employees/${employeeId}`)
      .then((res) => setProfileData(res.data))
      .catch((err) => console.error("Error loading employee profile:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [employeeId]);

  if (loading || !profileData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-xs text-slate-400">Loading comprehensive employee profile...</div>
      </div>
    );
  }

  const { profile, stats, schedule, attendanceHistory, breakHistory, leaveHistory, exitHistory, monthlyScores, workActivity, screenshots, auditHistory } = profileData;

  const tabs = [
    { id: 1, label: "1. Overview", icon: User },
    { id: 2, label: "2. Attendance", icon: CalendarCheck, count: attendanceHistory?.length },
    { id: 3, label: "3. Breaks", icon: Coffee, count: breakHistory?.length },
    { id: 4, label: "4. Leave Apps", icon: CalendarDays, count: leaveHistory?.length },
    { id: 5, label: "5. Exit Requests", icon: DoorOpen, count: exitHistory?.length },
    { id: 6, label: "6. Work Activity", icon: Activity, count: workActivity?.length },
    { id: 7, label: "7. Monthly Reports", icon: Trophy, count: monthlyScores?.length },
    { id: 8, label: "8. Admin History", icon: History, count: auditHistory?.length }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Staff Directory</span>
      </button>

      {/* Header Profile Hero Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border-2 border-teal-500/30 text-2xl font-black text-teal-300">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{profile.fullName}</h2>
                <span className="rounded bg-teal-500/10 px-2 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20">
                  @{profile.username}
                </span>
                {profile.role !== "EMPLOYEE" && (
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                    {profile.role}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{profile.jobTitle}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Laptop className="h-3.5 w-3.5 text-slate-500" />
                  {profile.workstationId || "Unassigned"}
                </span>
                <span>•</span>
                <span>ID: {profile.id.substring(0, 8)}...</span>
                <span>•</span>
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onRenameUser && onRenameUser(profile.id, profile.username)}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-400" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => onResetPassword && onResetPassword(profile.id, profile.username)}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Profile Tabs Navigation Bar */}
      <div className="flex overflow-x-auto space-x-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 text-[10px] ${isActive ? "bg-teal-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Metrics */}
      {activeSubTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400">Total Work Hours</span>
              <div className="mt-1 text-2xl font-black text-teal-400">{stats.totalWorkHours} hrs</div>
              <span className="text-[11px] text-slate-500">{stats.totalRecordedSessions} recorded sessions</span>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <span className="text-xs text-emerald-400">Present Days</span>
              <div className="mt-1 text-2xl font-black text-emerald-300">{stats.presentDays}</div>
              <span className="text-[11px] text-emerald-500/80">Regular on-time sessions</span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <span className="text-xs text-amber-400">Late Arrivals</span>
              <div className="mt-1 text-2xl font-black text-amber-300">{stats.lateDays}</div>
              <span className="text-[11px] text-amber-500/80">Over grace period</span>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <span className="text-xs text-indigo-400">Approved Breaks</span>
              <div className="mt-1 text-2xl font-black text-indigo-300">{stats.approvedBreaksCount}</div>
              <span className="text-[11px] text-indigo-500/80">Compliant breaks</span>
            </div>
          </div>

          {/* Work Schedule Configuration Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Assigned Work Schedule</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Working Days:</span>
                <div className="font-semibold text-slate-200">Mon - Sat (6 Days)</div>
              </div>
              <div>
                <span className="text-slate-500">Standard Hours:</span>
                <div className="font-semibold text-slate-200">{schedule?.startTime || "09:00"} — {schedule?.endTime || "18:00"}</div>
              </div>
              <div>
                <span className="text-slate-500">Punctuality Grace Period:</span>
                <div className="font-semibold text-teal-400">{schedule?.gracePeriodMinutes || 15} minutes</div>
              </div>
              <div>
                <span className="text-slate-500">Target Shift:</span>
                <div className="font-semibold text-slate-200">{schedule?.expectedHoursPerDay || 8.0} hrs / day</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance History */}
      {activeSubTab === 2 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Elapsed</th>
                <th className="py-3 px-4">Break Deducted</th>
                <th className="py-3 px-4">Net Work Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attendanceHistory?.map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-white">{att.date}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In Progress"}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{att.totalElapsedMinutes} mins</td>
                  <td className="py-3 px-4 text-indigo-400">{att.breakDeductedMins} mins</td>
                  <td className="py-3 px-4 font-bold text-teal-400">
                    {Math.floor(att.netWorkMinutes / 60)}h {att.netWorkMinutes % 60}m
                  </td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      att.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-400" :
                      att.status === "LATE" ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Break Requests */}
      {activeSubTab === 3 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Break Type</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Approved</th>
                <th className="py-3 px-4">Actual Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes / Decided By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {breakHistory?.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{b.breakType?.name || "Break"}</td>
                  <td className="py-3 px-4 text-slate-300">{b.requestedMinutes} mins</td>
                  <td className="py-3 px-4 text-slate-300">{b.approvedMinutes ? `${b.approvedMinutes} mins` : "—"}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{b.actualDurationMins ? `${b.actualDurationMins} mins` : "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      b.status === "APPROVED" || b.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" :
                      b.status === "PENDING" ? "bg-amber-500/10 text-amber-400" :
                      b.status === "OVERDUE" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {b.decisionReason || b.notes || (b.decidedBy ? `By @${b.decidedBy}` : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Leave Applications */}
      {activeSubTab === 4 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Leave Reason</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Decision Reason</th>
                <th className="py-3 px-4">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaveHistory?.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">
                    {l.leaveReason}
                    {l.customReason && <span className="block text-[11px] text-slate-400 font-normal">{l.customReason}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{l.startDate}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{l.endDate}</td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      l.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                      l.status === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{l.decisionReason || "—"}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Temporary Exit Requests */}
      {activeSubTab === 5 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4">Expected Return</th>
                <th className="py-3 px-4">Actual Return</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {exitHistory?.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{e.reason}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {new Date(e.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {new Date(e.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-mono text-teal-400">
                    {e.actualReturnTime ? new Date(e.actualReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Work Activity & Screenshots */}
      {activeSubTab === 6 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Foreground Application Activity</h3>
            <div className="space-y-2">
              {workActivity?.length > 0 ? (
                workActivity.map((act: any) => (
                  <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 text-xs border border-slate-800/80">
                    <div>
                      <div className="font-bold text-white">{act.appName}</div>
                      <div className="text-[11px] text-slate-400">{act.windowTitle}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-teal-400 font-semibold">{Math.round(act.durationSeconds / 60)} mins</div>
                      <div className="text-[10px] text-slate-500">{act.isIdle ? "Idle" : "Active Editing"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-4 text-center">No desktop activity logs synced yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Monthly Reports & Scores */}
      {activeSubTab === 7 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Historical Monthly Discipline & Reliability Scores</h3>
          <div className="space-y-3">
            {monthlyScores?.map((ms: any) => (
              <div key={ms.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <div>
                  <div className="text-sm font-black text-white">{ms.monthYear} Evaluation</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Rank #{ms.rank} • Punctuality: {ms.punctualityRate}% • Break Compliance: {ms.breakComplianceRate}%
                  </div>
                  {ms.managerNotes && (
                    <p className="mt-2 text-xs text-teal-400/90 italic bg-teal-500/10 p-2 rounded-lg border border-teal-500/20">
                      "{ms.managerNotes}"
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-teal-400">{ms.disciplineScore}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Discipline Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Administrative History & Audit Trail */}
      {activeSubTab === 8 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditHistory?.map((audit: any) => (
                <tr key={audit.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(audit.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-teal-400 font-semibold">{audit.action}</td>
                  <td className="py-3 px-4 text-slate-300">{audit.targetResource}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{audit.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
