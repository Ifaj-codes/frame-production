import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar, TabKey } from "./components/Sidebar";
import { LoginView } from "./views/LoginView";
import { OverviewView } from "./views/OverviewView";
import { EmployeesView } from "./views/EmployeesView";
import { EmployeeProfileView } from "./views/EmployeeProfileView";
import { AttendanceView } from "./views/AttendanceView";
import { BreakRequestsView } from "./views/BreakRequestsView";
import { LeaveApplicationsView } from "./views/LeaveApplicationsView";
import { ExitRequestsView } from "./views/ExitRequestsView";
import { WorkActivityView } from "./views/WorkActivityView";
import { ScreenshotsView } from "./views/ScreenshotsView";
import { MonthlyPerformanceView } from "./views/MonthlyPerformanceView";
import { AccountManagementView } from "./views/AccountManagementView";
import { BrandingSettingsView } from "./views/BrandingSettingsView";
import { AuditLogsView } from "./views/AuditLogsView";
import { SystemHealthView } from "./views/SystemHealthView";
import { api } from "./api";

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState({ breaks: 0, leaves: 0, exits: 0 });

  // Live WebSocket Connection
  useEffect(() => {
    if (!isAuthenticated) return;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("ws://localhost:5000/ws");
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (["BREAK_REQUEST", "NEW_LEAVE_APPLICATION", "EXIT_REQUEST", "ATTENDANCE_PUNCH"].includes(msg.type)) {
            // Refresh badge counters
            api.get("/reports/overview").then((res) => {
              if (res.data?.metrics) {
                setPendingCounts({
                  breaks: res.data.metrics.pendingBreakRequests,
                  leaves: res.data.metrics.pendingLeaveApplications,
                  exits: res.data.metrics.pendingExitRequests
                });
              }
            }).catch(() => {});
          }
        } catch (e) {}
      };
    } catch (e) {
      console.warn("WebSocket could not connect locally");
    }

    return () => {
      if (ws) ws.close();
    };
  }, [isAuthenticated]);

  // Initial pending fetch
  useEffect(() => {
    if (isAuthenticated) {
      api.get("/reports/overview").then((res) => {
        if (res.data?.metrics) {
          setPendingCounts({
            breaks: res.data.metrics.pendingBreakRequests,
            leaves: res.data.metrics.pendingLeaveApplications,
            exits: res.data.metrics.pendingExitRequests
          });
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, activeTab]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenProfile = (id: string) => {
    setSelectedProfileId(id);
  };

  const getTabTitle = (tab: TabKey): string => {
    switch (tab) {
      case "overview": return "Dashboard Overview";
      case "employees": return "Employees & Profiles";
      case "attendance": return "Attendance & Search";
      case "breaks": return "Break Requests";
      case "leaves": return "Leave Applications";
      case "exits": return "Temporary Exit Requests";
      case "activity": return "Workstation Activity";
      case "screenshots": return "Workstation Screenshots";
      case "ranking": return "Monthly Performance & Ranking";
      case "accounts": return "Account Management";
      case "branding": return "Branding & White-Label";
      case "audit": return "Audit Logs";
      case "health": return "System Health & Diagnostics";
      default: return "Dashboard";
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedProfileId(null);
        }}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        pendingCounts={pendingCounts}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          activeTabTitle={selectedProfileId ? "Employee Profile" : getTabTitle(activeTab)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {selectedProfileId ? (
              <EmployeeProfileView
                employeeId={selectedProfileId}
                onBack={() => setSelectedProfileId(null)}
              />
            ) : (
              <>
                {activeTab === "overview" && <OverviewView onNavigate={setActiveTab} />}
                {activeTab === "employees" && (
                  <EmployeesView
                    onOpenProfile={handleOpenProfile}
                    onOpenCreateAccount={() => setActiveTab("accounts")}
                  />
                )}
                {activeTab === "attendance" && <AttendanceView onOpenProfile={handleOpenProfile} />}
                {activeTab === "breaks" && <BreakRequestsView />}
                {activeTab === "leaves" && <LeaveApplicationsView />}
                {activeTab === "exits" && <ExitRequestsView />}
                {activeTab === "activity" && <WorkActivityView />}
                {activeTab === "screenshots" && <ScreenshotsView />}
                {activeTab === "ranking" && <MonthlyPerformanceView onOpenProfile={handleOpenProfile} />}
                {activeTab === "accounts" && <AccountManagementView />}
                {activeTab === "branding" && <BrandingSettingsView />}
                {activeTab === "audit" && <AuditLogsView />}
                {activeTab === "health" && <SystemHealthView />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
