import React, { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginView } from "./views/LoginView";
import { AttendanceScreen } from "./views/AttendanceScreen";
import { startMonitoring, stopMonitoring } from "./services/monitoringService";

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      startMonitoring(true);
    } else {
      stopMonitoring();
    }
    return () => stopMonitoring();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <AttendanceScreen />;
};
