import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Radio,
  Eye,
  EyeOff,
  Cpu,
  Fingerprint,
  CheckCircle2
} from "lucide-react";
import brandLogo from "../assets/logo.png";

export const LoginView: React.FC = () => {
  const { login, branding } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timecode, setTimecode] = useState("");

  // SMPTE 24fps timecode simulation
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      const now = new Date();
      frame = (frame + 1) % 24;
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const frames = String(frame).padStart(2, "0");
      setTimecode(`${hours}:${minutes}:${seconds}:${frames}`);
    }, 1000 / 24);
    return () => clearInterval(interval);
  }, []);

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
        setError("This console is reserved exclusively for Administrators and the Developer. Production employees must sign in via the Windows Desktop Client.");
        setLoading(false);
        return;
      }

      login(res.data.token, res.data.user, res.data.branding);
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Ensure backend service is reachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-studio-grid film-grain px-4 py-8 selection:bg-amber-500/30 selection:text-amber-200 overflow-hidden">
      {/* Cinematic Ambient Multi-Color Light Halos */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-b from-amber-500/18 via-amber-600/5 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-amber-400/8 blur-[130px]" />

      {/* Top Official Studio Ticker Header */}
      <header className="relative z-10 mx-auto w-full max-w-5xl flex items-center justify-between text-xs py-2 border-b border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
              SYS STATUS: OPERATIONAL
            </span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
            CLUSTER: PROD-DIRECTOR-01
          </span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[11px] text-zinc-400">
          <span className="text-zinc-500 hidden sm:inline">SMPTE TC:</span>
          <span className="rounded-md border border-white/[0.08] bg-zinc-950/80 px-2.5 py-0.5 text-amber-400 font-semibold tracking-widest shadow-inner">
            {timecode || "00:00:00:00"}
          </span>
        </div>
      </header>

      {/* Center Main Hero & Auth Console */}
      <main className="relative z-10 mx-auto w-full max-w-[460px] my-auto pt-6 pb-8">
        {/* Brand Identity with Golden Bezel Halo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative group mb-4">
            {/* Ambient Gold Radial Halo */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/50 via-yellow-400/25 to-amber-600/50 blur-xl opacity-70 group-hover:opacity-100 transition duration-700" />
            
            {/* Outer Chamfered Bezel */}
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-amber-400/50 bg-[#090b10] p-1 shadow-2xl shadow-amber-500/30">
              <img
                src={brandLogo}
                alt="Frame Production"
                className="h-full w-full object-cover rounded-[12px] transform group-hover:scale-105 transition duration-500"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {branding.appName}
            </span>
          </h1>

          <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Radio className="h-3 w-3 animate-pulse text-amber-400" />
              DIRECTOR GATEWAY
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">ENTERPRISE EDITION</span>
          </div>
        </div>

        {/* Elevated Glassmorphic Console Card */}
        <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Top Metallic Gold Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Card Header Bar */}
          <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-sm font-bold tracking-wide text-zinc-100 uppercase font-mono">
                Operator Clearance
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Central Operations, HR & Telemetry Suite
              </p>
            </div>
            <div className="flex items-center space-x-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>LEVEL 4 AUTH</span>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 backdrop-blur-md animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Operator Identifier
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">LDAP / INTERNAL</span>
              </div>
              <div className="relative group">
                <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-amber-400 transition" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin_ops or developer"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/70 py-3 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500/60 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Passkey Seal
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">BCRYPT 10-ROUNDS</span>
              </div>
              <div className="relative group">
                <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-amber-400 transition" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/70 py-3 pl-10 pr-11 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500/60 focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Premium Gold CTA with Light Sweep Shimmer */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-3 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-105 active:scale-[0.99] transition-all duration-200 overflow-hidden disabled:opacity-50"
            >
              {/* Shimmer sweep bar */}
              <div className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-sweep" />

              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  AUTHENTICATING OPERATOR...
                </span>
              ) : (
                <>
                  <span>INITIALIZE STUDIO CONSOLE</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Role Switcher */}
          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <div className="flex items-center justify-between text-[11px] mb-2.5">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-400 font-mono text-[10px]">
                <Fingerprint className="h-3.5 w-3.5 text-amber-400" />
                <span>Preset Studio Clearance</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">1-CLICK DISPATCH</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("developer", "DevPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-2.5 hover:bg-amber-500/[0.14] hover:border-amber-500/60 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-amber-300">Developer</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                    ROOT
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@developer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_ops", "AdminPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-cyan-500/30 bg-cyan-500/[0.06] p-2.5 hover:bg-cyan-500/[0.14] hover:border-cyan-500/60 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-cyan-300">Admin (Ops)</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-mono font-bold">
                    DISPATCH
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@admin_ops</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_hr", "AdminPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-purple-500/30 bg-purple-500/[0.06] p-2.5 hover:bg-purple-500/[0.14] hover:border-purple-500/60 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-purple-300">Admin (HR)</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-300 font-mono font-bold">
                    PEOPLE
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@admin_hr</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin_lead", "AdminPass@2026")}
                className="group flex flex-col text-left rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-2.5 hover:bg-emerald-500/[0.14] hover:border-emerald-500/60 transition duration-150"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-emerald-300">Lead Editor</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono font-bold">
                    SUITE
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">@admin_lead</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Official Bottom Studio Governance Ticker */}
      <footer className="relative z-10 mx-auto w-full max-w-5xl py-3 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span>FRAME PRODUCTION STUDIO ENGINE // BUILD 2026.10</span>
        </div>

        <div className="flex items-center space-x-3 text-zinc-400">
          <span>ZERO-KEYLOGGER GUARANTEE</span>
          <span>•</span>
          <span>FIPS 140-2 READY</span>
          <span>•</span>
          <span className="text-amber-400/90 font-semibold">ALL 17 EDITORIAL SUITES LINKED</span>
        </div>
      </footer>
    </div>
  );
};
