import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Shield, User, Menu, Clock, Search, Command, Volume2, VolumeX } from "lucide-react";
import brandLogo from "../assets/logo.png";
import { sound } from "../services/soundEffects";

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTabTitle: string;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeTabTitle,
  onOpenCommandPalette
}) => {
  const { user, branding, logout } = useAuth();
  const [timecode, setTimecode] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

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

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) sound.playClick(900, 0.03);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.07] bg-[#08090d]/85 px-4 backdrop-blur-xl md:px-6">
      {/* Left: Mobile Toggle, Brand & Active Section */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={() => {
            sound.playClick(600, 0.02);
            onToggleSidebar();
          }}
          className="rounded-xl p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white md:hidden transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="relative group cursor-pointer" onClick={() => sound.playClick(900, 0.03)}>
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
                STUDIO PRO
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

      {/* Center: Quick Command Palette Trigger (Linear/Raycast style) */}
      <div className="hidden md:flex items-center">
        <button
          onClick={() => {
            sound.playClick(750, 0.03);
            onOpenCommandPalette && onOpenCommandPalette();
          }}
          className="group flex items-center space-x-2 rounded-xl border border-white/[0.08] bg-zinc-950/70 px-3.5 py-1.5 text-xs text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200 transition shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition" />
          <span className="font-medium text-xs">Omnibar Search...</span>
          <kbd className="flex items-center space-x-0.5 rounded border border-white/[0.1] bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 shadow-sm">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right: Studio Clock, Central Sync Status, User Pill & Logout */}
      <div className="flex items-center space-x-2.5">
        {/* Studio Live Timecode */}
        <div className="hidden lg:flex items-center space-x-1.5 rounded-xl border border-white/[0.06] bg-zinc-950/70 px-2.5 py-1.5 font-mono text-xs text-zinc-300 shadow-inner">
          <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="tracking-widest font-semibold text-[11px]">{timecode}</span>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline font-mono">NOMINAL</span>
          <span className="sm:hidden font-mono">LIVE</span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          title={soundEnabled ? "Studio Haptics Enabled" : "Sound Muted"}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/80 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition shadow-sm"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4 text-zinc-600" />}
        </button>

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
          onClick={() => {
            sound.playClick(400, 0.04);
            logout();
          }}
          title="Sign out of Console"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900 text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
