import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Search, Menu } from "lucide-react";
import brandLogo from "../assets/logo.png";

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

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-[#0c0d12]/80 px-4 backdrop-blur-2xl md:px-6">
      {/* Left: Brand & Mobile Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white md:hidden transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl overflow-hidden border border-white/[0.1] bg-zinc-900 shadow-sm shrink-0">
            <img src={brandLogo} alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            {branding.appName || "Frame Production"}
          </span>
        </div>

        <span className="hidden md:inline-block text-zinc-600 mx-1">/</span>
        <span className="hidden text-xs font-medium text-zinc-400 md:inline-block">
          {activeTabTitle}
        </span>
      </div>

      {/* Center: Sleek Apple/Linear style search */}
      <div className="hidden md:flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200 transition"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span>Search or jump to...</span>
          <kbd className="ml-2 rounded border border-white/[0.1] bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: User status & Sign Out */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 rounded-lg bg-zinc-900/80 border border-white/[0.08] px-2.5 py-1 text-xs">
          <div className="h-5 w-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div className="hidden sm:block text-left">
            <span className="font-medium text-zinc-200 block text-xs leading-none">
              {user?.fullName}
            </span>
            <span className="text-[10px] text-zinc-400 capitalize">
              {user?.role.toLowerCase()}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
