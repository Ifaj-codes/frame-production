import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Radio } from "lucide-react";

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
      setError(err.response?.data?.error || "Invalid username or password. Check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-studio-grid px-4 py-12 selection:bg-amber-500/30 selection:text-amber-200 overflow-hidden">
      {/* Cinematic ambient background orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-80 w-80 rounded-full bg-amber-400/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand Identity Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative group mb-4">
            {/* Ambient gold halo */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/40 via-yellow-500/20 to-amber-600/40 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-amber-500/40 bg-zinc-950 p-0.5 shadow-2xl shadow-amber-500/20">
              <img
                src={branding.logoUrl || "/logo.png"}
                alt="Frame Production"
                className="h-full w-full object-cover rounded-[14px]"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{branding.appName}</span>
          </h1>

          <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] font-medium tracking-wide uppercase text-zinc-400">
            <span className="flex items-center gap-1.5 text-amber-400/90 font-semibold">
              <Radio className="h-3 w-3 animate-pulse text-amber-400" />
              Studio Gateway
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Cloud Management Suite</span>
          </div>
        </div>

        {/* Elevated Glassmorphism Card */}
        <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
                Authorized Sign In
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Operations, HR & Developer Central Console
              </p>
            </div>
            <div className="flex items-center space-x-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
              <ShieldCheck className="h-3 w-3 text-amber-400" />
              <span>RBAC v2.4</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 backdrop-blur-md animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Username
              </label>
              <div className="relative group">
                <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-amber-400 transition" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin_ops or developer"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 py-2.5 pl-10 pr-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500/60 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Bcrypt Hash Sealed</span>
              </div>
              <div className="relative group">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-amber-400 transition" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 py-2.5 pl-10 pr-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500/60 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-105 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  Verifying Credentials...
                </span>
              ) : (
                <>
                  <span>Sign In to Studio Console</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Badges for Seeded Roles */}
          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <div className="flex items-center justify-between text-[11px] mb-2.5">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Instant Seed Switcher</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">1-Click AutoFill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("developer", "DevPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-2.5 hover:bg-amber-500/[0.14] hover:border-amber-500/50 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-amber-300">Developer</span>
                  <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-amber-400/20 text-amber-300 font-mono">ROOT</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@developer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_ops", "AdminPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-cyan-500/30 bg-cyan-500/[0.07] p-2.5 hover:bg-cyan-500/[0.14] hover:border-cyan-500/50 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-cyan-300">Admin (Ops)</span>
                  <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-cyan-400/20 text-cyan-300 font-mono">OPS</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@admin_ops</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_hr", "AdminPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-purple-500/30 bg-purple-500/[0.07] p-2.5 hover:bg-purple-500/[0.14] hover:border-purple-500/50 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-purple-300">Admin (HR)</span>
                  <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-purple-400/20 text-purple-300 font-mono">LEAVES</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@admin_hr</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_lead", "AdminPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-2.5 hover:bg-emerald-500/[0.14] hover:border-emerald-500/50 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-emerald-300">Lead Editor</span>
                  <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-emerald-400/20 text-emerald-300 font-mono">SUITE</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@admin_lead</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Footer info */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-[11px] font-medium text-zinc-500">
            Protected by Frame Production Server-Side Authorization Engine
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-600 font-mono">
            <span>TLS 1.3</span>
            <span>•</span>
            <span>ZERO KEYLOGGING POLICY</span>
            <span>•</span>
            <span>SHA-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};
