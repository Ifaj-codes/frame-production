import React from "react";
import { useAuth } from "../context/AuthContext";
import { Film, LogOut, Shield, User, Menu, Bell } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTabTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTabTitle }) => {
  const { user, branding, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md md:px-6">
      {/* Left: Mobile Toggle & Brand & Active Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 shadow-md shadow-amber-500/10 shrink-0">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              {branding.appName}
            </h1>
            <p className="text-[10px] text-amber-400 font-medium hidden sm:block">
              {branding.companySubtitle}
            </p>
          </div>
        </div>

        <div className="hidden h-5 w-px bg-slate-700 md:block mx-2"></div>
        <span className="hidden text-sm font-semibold text-slate-300 md:inline-block">
          {activeTabTitle}
        </span>
      </div>

      {/* Right: Live Status, User pill & Logout */}
      <div className="flex items-center space-x-3">
        {/* Live sync badge */}
        <div className="flex items-center space-x-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">Online • Central Sync Active</span>
          <span className="sm:hidden">Live</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700/60">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-slate-300 text-xs font-bold">
            {user?.role === "DEVELOPER" ? (
              <Shield className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <User className="h-3.5 w-3.5 text-teal-400" />
            )}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-white leading-none">
              {user?.fullName}
            </div>
            <div className="text-[10px] font-medium text-slate-400 capitalize">
              {user?.role.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
