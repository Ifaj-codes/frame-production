import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Coffee,
  CalendarDays,
  DoorOpen,
  Activity,
  Camera,
  Trophy,
  UserPlus,
  Palette,
  FileText,
  ActivitySquare,
  X
} from "lucide-react";

export type TabKey =
  | "overview"
  | "employees"
  | "attendance"
  | "breaks"
  | "leaves"
  | "exits"
  | "activity"
  | "screenshots"
  | "ranking"
  | "accounts"
  | "branding"
  | "audit"
  | "health";

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCounts?: {
    breaks: number;
    leaves: number;
    exits: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingCounts = { breaks: 0, leaves: 0, exits: 0 }
}) => {
  const { isDeveloper } = useAuth();

  const navItems = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "employees", label: "Employees & Profiles", icon: Users },
    { key: "attendance", label: "Attendance & Search", icon: CalendarCheck },
    { key: "breaks", label: "Break Requests", icon: Coffee, badge: pendingCounts.breaks },
    { key: "leaves", label: "Leave Applications", icon: CalendarDays, badge: pendingCounts.leaves },
    { key: "exits", label: "Exit Requests", icon: DoorOpen, badge: pendingCounts.exits },
    { key: "activity", label: "Work Activity", icon: Activity },
    { key: "screenshots", label: "Screenshots", icon: Camera },
    { key: "ranking", label: "Monthly Performance", icon: Trophy },
    { key: "accounts", label: "Account Management", icon: UserPlus },
    { key: "branding", label: "Branding & Settings", icon: Palette },
    { key: "audit", label: "Audit Logs", icon: FileText },
    { key: "health", label: "System Health", icon: ActivitySquare },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Mobile Close */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 md:hidden">
            <span className="font-bold text-white text-sm">Navigation Menu</span>
            <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operations & Workflow
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelectTab(item.key as TabKey);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Footer Info */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Frame Production v1.0</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
              Admin OS
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
