import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { UserPlus, KeyRound, Edit3, ShieldAlert, Check, X, Shield, Users, Power } from "lucide-react";

export const AccountManagementView: React.FC = () => {
  const { isDeveloper } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Account State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("EMPLOYEE");
  const [newJobTitle, setNewJobTitle] = useState("Video Editor");
  const [newWorkstationId, setNewWorkstationId] = useState("");
  const [creating, setCreating] = useState(false);

  // Rename Modal State
  const [renameTarget, setRenameTarget] = useState<any | null>(null);
  const [updatedUsername, setUpdatedUsername] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Reset Password Modal State
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get("/employees")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching accounts:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/employees", {
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        role: newRole,
        jobTitle: newJobTitle,
        workstationId: newWorkstationId
      });
      setShowCreateModal(false);
      setNewUsername("");
      setNewPassword("");
      setNewFullName("");
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    setRenaming(true);
    try {
      await api.put(`/employees/${renameTarget.id}/rename`, { newUsername: updatedUsername });
      setRenameTarget(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to rename user");
    } finally {
      setRenaming(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      await api.put(`/employees/${resetTarget.id}/reset-password`, { newPassword: resetPasswordVal });
      setResetTarget(null);
      setResetPasswordVal("");
      alert(`Password for @${resetTarget.username} has been reset.`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (user.role === "DEVELOPER") {
      alert("Developer account cannot be deactivated.");
      return;
    }
    const newStatus = !user.isActive;
    if (confirm(`Are you sure you want to ${newStatus ? "activate" : "deactivate"} @${user.username}?`)) {
      try {
        await api.put(`/employees/${user.id}/status`, { isActive: newStatus });
        fetchUsers();
      } catch (err: any) {
        alert("Failed to toggle status");
      }
    }
  };

  const handleChangeRole = async (user: any, newRole: string) => {
    if (!isDeveloper) {
      alert("Only the Developer can promote or change roles.");
      return;
    }
    try {
      await api.put(`/employees/${user.id}/role`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert("Failed to change role");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-400" />
            <span>Account Management & Security Controls</span>
          </h2>
          <p className="text-xs text-slate-400">
            Create new staff, rename usernames, reset passwords, and manage administrative privileges.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition shadow"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create New Account</span>
        </button>
      </div>

      {/* Account Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Full Name & Username</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Workstation</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{u.fullName}</div>
                    <div className="font-mono text-teal-400 text-[11px]">@{u.username}</div>
                  </td>

                  <td className="py-3 px-4">
                    {isDeveloper && u.role !== "DEVELOPER" ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className="rounded bg-slate-950 border border-slate-700 px-2 py-0.5 text-[11px] text-amber-400 font-bold focus:outline-none"
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        u.role === "DEVELOPER" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        u.role === "ADMIN" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {u.role}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300">{u.jobTitle}</td>

                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {u.workstationId || "Unassigned"}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setRenameTarget(u);
                          setUpdatedUsername(u.username);
                        }}
                        className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-teal-400 hover:bg-slate-700 transition"
                        title="Rename Username"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => {
                          setResetTarget(u);
                          setResetPasswordVal("");
                        }}
                        className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition"
                        title="Reset Password"
                      >
                        <KeyRound className="h-3 w-3" />
                      </button>

                      {u.role !== "DEVELOPER" && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                            u.isActive ? "bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                          title={u.isActive ? "Disable Account" : "Activate Account"}
                        >
                          <Power className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create New Frame Production Account</h3>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Shakil Khan"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. emp_18"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="EMPLOYEE">Employee (Desktop App Access)</option>
                    {isDeveloper && <option value="ADMIN">Administrator (Full Dashboard Access)</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Senior Colorist"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Workstation Suite ID</label>
                  <input
                    type="text"
                    value={newWorkstationId}
                    onChange={(e) => setNewWorkstationId(e.target.value)}
                    placeholder="e.g. WS-EDIT-18"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Username Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Rename Username</h3>
            <p className="text-xs text-slate-400 mb-4">
              Current: <strong className="text-white">@{renameTarget.username}</strong>
            </p>

            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Username</label>
                <input
                  type="text"
                  required
                  value={updatedUsername}
                  onChange={(e) => setUpdatedUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {renaming ? "Updating..." : "Update Username"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              For: <strong className="text-white">@{resetTarget.username}</strong> ({resetTarget.fullName})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Minimum 6 characters..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Commit Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
