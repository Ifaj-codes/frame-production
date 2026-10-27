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
  X,
  Sparkles
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

  const sections = [
    {
      group: "Core Dispatch",
      items: [
        { key: "overview", label: "Studio Overview", icon: LayoutDashboard },
        { key: "employees", label: "Team & Workstations", icon: Users },
        { key: "attendance", label: "Attendance Matrix", icon: CalendarCheck },
      ]
    },
    {
      group: "Approvals & Telemetry",
      items: [
        { key: "breaks", label: "Break Requests", icon: Coffee, badge: pendingCounts.breaks },
        { key: "leaves", label: "Leave Applications", icon: CalendarDays, badge: pendingCounts.leaves },
        { key: "exits", label: "Exit Requests", icon: DoorOpen, badge: pendingCounts.exits },
        { key: "activity", label: "App & Window Activity", icon: Activity },
        { key: "screenshots", label: "Visual Screen Captures", icon: Camera },
      ]
    },
    {
      group: "Studio Governance",
      items: [
        { key: "ranking", label: "Monthly Rankings", icon: Trophy },
        { key: "accounts", label: "Credentials & Roles", icon: UserPlus },
        { key: "branding", label: "White-Label Branding", icon: Palette },
        { key: "audit", label: "Immutable Audit Logs", icon: FileText },
        { key: "health", label: "System & Sync Health", icon: ActivitySquare },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#090a0f] border-r border-white/[0.07] transition-transform duration-250 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Mobile Close */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.07] md:hidden">
            <span className="font-bold text-white text-sm">Studio Navigation</span>
            <button onClick={onCloseMobile} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05]">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
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
                      className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-amber-500/[0.12] text-amber-300 border border-amber-500/30 shadow-sm"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      )}

                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-zinc-950 shadow-sm font-mono">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Footer Telemetry */}
          <div className="p-3.5 border-t border-white/[0.07] bg-zinc-950/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span className="font-mono text-zinc-400 text-[10px]">DAEMON: ONLINE</span>
            </div>
            <span className="rounded-md border border-white/[0.08] bg-zinc-900 px-1.5 py-0.5 text-[9px] text-amber-400 font-mono">
              v1.0-PRO
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
