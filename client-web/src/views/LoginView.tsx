import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import brandLogo from "../assets/logo.png";

export const LoginView: React.FC = () => {
  const { login, branding } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setError("This portal is exclusively for Administrators and the Developer. Production staff should use the Windows Desktop application.");
        setLoading(false);
        return;
      }

      login(res.data.token, res.data.user, res.data.branding);
    } catch (err: any) {
      setError(err.response?.data?.error || "Incorrect username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between apple-ambient-bg px-4 py-8 selection:bg-amber-400/20 selection:text-amber-200">
      {/* Top minimal brand bar */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between py-2 text-xs text-zinc-500">
        <span className="font-medium tracking-tight text-zinc-400">Frame Production Studio</span>
        <div className="flex items-center space-x-4 text-xs text-zinc-500">
          <span>Enterprise Workspace</span>
          <span>•</span>
          <span className="text-zinc-400">v1.0</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="mx-auto w-full max-w-[400px] my-auto">
        <div className="flex flex-col items-center text-center mb-8">
          {/* Logo with Apple-style squircle and subtle shadow */}
          <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/[0.08] mb-4 bg-zinc-900 transition-transform duration-300 hover:scale-105">
            <img
              src={brandLogo}
              alt="Frame Production"
              className="h-full w-full object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {branding.appName || "Frame Production"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400 font-normal">
            Sign in to manage studio attendance & production
          </p>
        </div>

        {/* Apple-grade glass card */}
        <div className="apple-glass rounded-2xl p-7 shadow-2xl">
          {error && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition duration-150"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/50 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 active:scale-[0.99] transition duration-150 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Understated role presets (iOS style clean pills) */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <span className="block text-[11px] font-medium text-zinc-400 mb-2.5">
              Quick access demo accounts
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset("developer", "DevPass@2026")}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-2 text-left hover:border-amber-400/40 hover:bg-zinc-800/80 transition"
              >
                <div className="font-semibold text-zinc-200">Developer</div>
                <div className="text-[11px] text-zinc-500">developer</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset("admin_ops", "AdminPass@2026")}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-2 text-left hover:border-amber-400/40 hover:bg-zinc-800/80 transition"
              >
                <div className="font-semibold text-zinc-200">Admin (Ops)</div>
                <div className="text-[11px] text-zinc-500">admin_ops</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset("admin_hr", "AdminPass@2026")}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-2 text-left hover:border-amber-400/40 hover:bg-zinc-800/80 transition"
              >
                <div className="font-semibold text-zinc-200">Admin (HR)</div>
                <div className="text-[11px] text-zinc-500">admin_hr</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset("admin_lead", "AdminPass@2026")}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-2 text-left hover:border-amber-400/40 hover:bg-zinc-800/80 transition"
              >
                <div className="font-semibold text-zinc-200">Lead Editor</div>
                <div className="text-[11px] text-zinc-500">admin_lead</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Understated Apple-style footer */}
      <footer className="mx-auto w-full max-w-5xl py-4 text-center text-xs text-zinc-600">
        <p>Copyright © 2026 Frame Production Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};
