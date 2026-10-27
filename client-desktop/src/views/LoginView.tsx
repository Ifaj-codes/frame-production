import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Film, Lock, User, AlertCircle, ArrowRight, Laptop, Sparkles } from "lucide-react";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        username: username.trim().toLowerCase(),
        password
      });

      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Ensure backend service is reachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 relative">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-xl shadow-amber-500/20 mb-3 border border-amber-500/40 bg-slate-900">
            <img src="/logo.png" alt="Frame Production Logo" className="h-full w-full object-cover" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Frame Production
          </h2>
          <p className="mt-1 text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5">
            <Laptop className="h-3.5 w-3.5" />
            <span>Studio Workstation Desktop Client</span>
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Workstation Sign In</h3>
              <p className="text-xs text-slate-400">Video Editing & Production Staff</p>
            </div>
            <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/20">
              Desktop OS
            </span>
          </div>

          {error && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. emp_01"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center space-x-2 rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Workstation...</span>
              ) : (
                <>
                  <span>Sign In to Workstation</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Presets for Studio Staff */}
          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-400 mb-2">
              <Sparkles className="h-3 w-3 text-teal-400" />
              <span>Studio Quick Sign In (Preset Accounts)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("emp_01", "EmpPass@2026")}
                className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1.5 text-left text-teal-300 hover:bg-teal-500/20 transition"
              >
                🎬 Sabbir Ahmed (emp_01)
                <span className="block text-[10px] text-teal-400/70">Senior Video Editor</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("emp_02", "EmpPass@2026")}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 transition"
              >
                🎨 Rifat Hossain (emp_02)
                <span className="block text-[10px] text-slate-400">Motion Graphics Artist</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("emp_03", "EmpPass@2026")}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 transition"
              >
                🌈 Anisur Rahman (emp_03)
                <span className="block text-[10px] text-slate-400">Finishing Colorist</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("emp_04", "EmpPass@2026")}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 transition"
              >
                🎧 Mehedi Hasan (emp_04)
                <span className="block text-[10px] text-slate-400">Audio Engineer</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Offline Attendance Queuing Active • Reconciles Upon Internet Reconnection
        </p>
      </div>
    </div>
  );
};
