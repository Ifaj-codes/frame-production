import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Shield, User, Menu, Clock, Wifi } from "lucide-react";
import brandLogo from "../assets/logo.png";

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTabTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTabTitle }) => {
  const { user, branding, logout } = useAuth();
  const [timecode, setTimecode] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimecode(now.toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.07] bg-[#090a0f]/85 px-4 backdrop-blur-xl md:px-6">
      {/* Left: Mobile Toggle, Brand & Active Section */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white md:hidden transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-500/40 to-yellow-500/20 blur-sm opacity-60 group-hover:opacity-100 transition" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden border border-amber-500/40 bg-zinc-950 shadow-md">
              <img
                src={brandLogo}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
                {branding.appName}
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/25">
                STUDIO OS
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
              {branding.companySubtitle}
            </p>
          </div>
        </div>

        <div className="hidden h-5 w-px bg-white/[0.08] md:block mx-2" />
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-amber-400/90 md:inline-block font-mono">
          // {activeTabTitle}
        </span>
      </div>

      {/* Right: Studio Clock, Central Sync Status, User Pill & Logout */}
      <div className="flex items-center space-x-3">
        {/* Studio Live Timecode */}
        <div className="hidden lg:flex items-center space-x-2 rounded-xl border border-white/[0.06] bg-zinc-950/70 px-3 py-1.5 font-mono text-xs text-zinc-300 shadow-inner">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="tracking-widest font-semibold">{timecode}</span>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline font-mono">LIVE SYNC</span>
          <span className="sm:hidden font-mono">OK</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold shadow-inner">
            {user?.role === "DEVELOPER" ? (
              <Shield className="h-4 w-4 text-amber-400" />
            ) : (
              <User className="h-4 w-4 text-cyan-400" />
            )}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-zinc-100 leading-tight">
              {user?.fullName}
            </div>
            <div className="text-[10px] font-mono text-amber-400/80 capitalize">
              {user?.role.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of Console"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900 text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
