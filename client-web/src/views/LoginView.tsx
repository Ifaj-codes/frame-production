import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Film, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const LoginView: React.FC = () => {
  const { login, branding } = useAuth();
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

      if (res.data.user.role === "EMPLOYEE") {
        setError("This dashboard is exclusively for Administrators and the Developer. Employees must use the Windows Desktop Application.");
        setLoading(false);
        return;
      }

      login(res.data.token, res.data.user, res.data.branding);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-xl shadow-amber-500/20 mb-3 border border-amber-500/40 bg-slate-900">
            <img src="/logo.png" alt="Frame Production Logo" className="h-full w-full object-cover" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {branding.appName}
          </h2>
          <p className="mt-1 text-xs font-medium text-amber-400">
            {branding.companySubtitle} • Admin Gateway
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Management Sign In</h3>
              <p className="text-xs text-slate-400">Administrators & Developer Portal</p>
            </div>
            <div className="flex items-center space-x-1 rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-400">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Role Guard
            </div>
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
                  placeholder="e.g. admin_ops or developer"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center space-x-2 rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Helper for Seeded Accounts */}
          <div className="mt-6 border-t border-slate-800/80 pt-4">
            <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-400 mb-2">
              <Sparkles className="h-3 w-3 text-teal-400" />
              <span>Quick Login (Initial Seed Accounts)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("developer", "DevPass@2026")}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-left text-amber-300 hover:bg-amber-500/20 transition font-medium"
              >
                👑 Developer
                <span className="block text-[10px] text-amber-400/70">developer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_ops", "AdminPass@2026")}
                className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1.5 text-left text-teal-300 hover:bg-teal-500/20 transition font-medium"
              >
                🛠️ Admin (Ops)
                <span className="block text-[10px] text-teal-400/70">admin_ops</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_hr", "AdminPass@2026")}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 transition font-medium"
              >
                👥 Admin (HR)
                <span className="block text-[10px] text-slate-400">admin_hr</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_lead", "AdminPass@2026")}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 transition font-medium"
              >
                🎬 Admin (Lead)
                <span className="block text-[10px] text-slate-400">admin_lead</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Protected by Frame Production Server-Side Authorization • TLS / HTTPS
        </p>
      </div>
    </div>
  );
};
