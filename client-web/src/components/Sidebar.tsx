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
  const navSections = [
    {
      group: "Overview",
      items: [
        { key: "overview", label: "Dashboard", icon: LayoutDashboard },
        { key: "employees", label: "Employees", icon: Users },
        { key: "attendance", label: "Attendance", icon: CalendarCheck },
      ]
    },
    {
      group: "Requests & Approvals",
      items: [
        { key: "breaks", label: "Breaks", icon: Coffee, badge: pendingCounts.breaks },
        { key: "leaves", label: "Leave Applications", icon: CalendarDays, badge: pendingCounts.leaves },
        { key: "exits", label: "Exit Requests", icon: DoorOpen, badge: pendingCounts.exits },
      ]
    },
    {
      group: "Monitoring & Insights",
      items: [
        { key: "activity", label: "Work Activity", icon: Activity },
        { key: "screenshots", label: "Screenshots", icon: Camera },
        { key: "ranking", label: "Monthly Performance", icon: Trophy },
      ]
    },
    {
      group: "Management",
      items: [
        { key: "accounts", label: "Accounts & Passwords", icon: UserPlus },
        { key: "branding", label: "Branding", icon: Palette },
        { key: "audit", label: "Audit Logs", icon: FileText },
        { key: "health", label: "System Health", icon: ActivitySquare },
      ]
    }
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

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-[#0b0c10] border-r border-white/[0.08] transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile Close Header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/[0.08] md:hidden">
            <span className="font-semibold text-white text-sm">Navigation</span>
            <button onClick={onCloseMobile} className="text-zinc-400 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="px-3 pb-1 text-[11px] font-medium text-zinc-500">
                  {section.group}
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onSelectTab(item.key as TabKey);
                        onCloseMobile();
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-400" : "text-zinc-500"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {(item as any).badge !== undefined && (item as any).badge > 0 && (
                        <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400/20 px-1 text-[10px] font-semibold text-amber-300">
                          {(item as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="p-3 border-t border-white/[0.08] text-xs text-zinc-500 flex items-center justify-between">
            <span>Frame Production</span>
            <span className="text-[11px] text-zinc-600">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
