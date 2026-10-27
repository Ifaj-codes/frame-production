import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Clock,
  Coffee,
  AlertCircle,
  Plus,
  ArrowRight,
  Shield,
  Laptop
} from "lucide-react";

interface EmployeesViewProps {
  onOpenProfile: (employeeId: string) => void;
  onOpenCreateAccount: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ onOpenProfile, onOpenCreateAccount }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchEmployees = () => {
    setLoading(true);
    api.get("/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.workstationId && emp.workstationId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || emp.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20"><UserCheck className="h-3 w-3" /> Present</span>;
      case "LATE":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20"><Clock className="h-3 w-3" /> Late Arrival</span>;
      case "ON_BREAK":
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-400 border border-indigo-500/20"><Coffee className="h-3 w-3" /> On Break</span>;
      case "CLOCKED_OUT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-400 border border-slate-500/20">Clocked Out</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">Offline</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" />
            <span>Staff Directory & Profiles</span>
          </h2>
          <p className="text-xs text-slate-400">
            Click any employee row, avatar, or name to open their 8-tab comprehensive profile.
          </p>
        </div>

        <button
          onClick={onOpenCreateAccount}
          className="flex items-center space-x-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition shadow-lg shadow-teal-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee / Admin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by full name, username, workstation ID, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-slate-300 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ON_BREAK">On Break</option>
            <option value="CLOCKED_OUT">Clocked Out</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Workstation</th>
                <th className="py-3 px-4">Today's Status</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Net Time Today</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => onOpenProfile(emp.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* Employee Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-300">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-teal-400 transition">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            @{emp.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Workstation */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{emp.jobTitle}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Laptop className="h-3 w-3 text-slate-500" />
                        <span>{emp.workstationId || "Unassigned"}</span>
                        {emp.role !== "EMPLOYEE" && (
                          <span className="ml-1 rounded bg-slate-800 px-1 text-[9px] font-bold text-amber-400">
                            {emp.role}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {getStatusBadge(emp.currentStatus)}
                    </td>

                    {/* Clock In */}
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {emp.todaySession?.clockInTime
                        ? new Date(emp.todaySession.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : "—"}
                    </td>

                    {/* Net Time */}
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {emp.todaySession?.netWorkMinutes
                        ? `${Math.floor(emp.todaySession.netWorkMinutes / 60)}h ${emp.todaySession.netWorkMinutes % 60}m`
                        : "0m"}
                    </td>

                    {/* Action Arrow */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProfile(emp.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:border-teal-500/40 hover:text-teal-400 transition"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No employees matching the current filter.
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
