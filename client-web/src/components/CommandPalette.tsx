import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Coffee,
  CalendarDays,
  DoorOpen,
  Camera,
  Trophy,
  UserPlus,
  Palette,
  FileText,
  ActivitySquare,
  ArrowRight,
  Sparkles,
  Command,
  X
} from "lucide-react";
import { TabKey } from "./Sidebar";
import { sound } from "../services/soundEffects";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabKey) => void;
  onSelectEmployeeProfile?: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectEmployeeProfile
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems = [
    { id: "overview", title: "Studio Overview & Metrics", category: "Navigation", icon: LayoutDashboard, tab: "overview" },
    { id: "employees", title: "Team & Workstation Directory", category: "Navigation", icon: Users, tab: "employees" },
    { id: "attendance", title: "Attendance Matrix & Date Filter", category: "Navigation", icon: CalendarCheck, tab: "attendance" },
    { id: "breaks", title: "Break Requests & Approvals", category: "Approvals", icon: Coffee, tab: "breaks" },
    { id: "leaves", title: "Leave Applications Review", category: "Approvals", icon: CalendarDays, tab: "leaves" },
    { id: "exits", title: "Temporary Exit Requests", category: "Approvals", icon: DoorOpen, tab: "exits" },
    { id: "screenshots", title: "Workstation Visual Screen Gallery", category: "Telemetry", icon: Camera, tab: "screenshots" },
    { id: "ranking", title: "Monthly Performance Rankings", category: "Analytics", icon: Trophy, tab: "ranking" },
    { id: "accounts", title: "Account Management & Password Reset", category: "Security", icon: UserPlus, tab: "accounts" },
    { id: "branding", title: "Agency White-Label Branding", category: "System", icon: Palette, tab: "branding" },
    { id: "audit", title: "Immutable Audit Log Ledger", category: "Security", icon: FileText, tab: "audit" },
    { id: "health", title: "System Health & WebSocket Diagnostics", category: "System", icon: ActivitySquare, tab: "health" },
  ];

  const filtered = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      sound.playClick(750, 0.04);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? onClose() : sound.playClick();
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
        sound.playClick(480, 0.02);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
        sound.playClick(520, 0.02);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        execute(filtered[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  const execute = (item: (typeof commandItems)[0]) => {
    sound.playClick(880, 0.05);
    onSelectTab(item.tab as TabKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="glass-panel-elevated w-full max-w-xl rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-white/[0.08] bg-zinc-950/60">
          <Search className="h-4 w-4 text-amber-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to studio module..."
            className="w-full bg-transparent py-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-medium"
          />
          <div className="flex items-center space-x-1 font-mono text-[10px] text-zinc-500 border border-white/[0.08] px-1.5 py-0.5 rounded bg-zinc-900">
            <span>ESC</span>
          </div>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition duration-150 ${
                    isSelected
                      ? "bg-amber-500/[0.12] text-amber-300 border border-amber-500/30"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg border ${
                      isSelected ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-zinc-900 text-zinc-500 border-white/[0.06]"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-100">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-zinc-500 font-mono text-[10px]">
                    <span className="hidden sm:inline">SELECT</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No matching studio commands found for "{query}".
            </div>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ NAVIGATE</span>
            <span>↵ SELECT</span>
            <span>ESC EXIT</span>
          </div>
          <span className="text-amber-400 font-bold">FRAME PRODUCTION OMNIBAR</span>
        </div>
      </div>
    </div>
  );
};
