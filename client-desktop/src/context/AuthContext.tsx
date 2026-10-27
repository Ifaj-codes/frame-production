import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";
import { flushOfflineQueue } from "../services/offlineQueue";

export interface User {
  id: string;
  username: string;
  role: "EMPLOYEE" | "ADMIN" | "DEVELOPER";
  fullName: string;
  jobTitle?: string;
  workstationId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isOnline: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("frame_desktop_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("frame_desktop_token"));
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue().then((synced) => {
        if (synced > 0) console.log(`Auto-synced ${synced} offline events`);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (navigator.onLine) {
      flushOfflineQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("frame_desktop_token", newToken);
    localStorage.setItem("frame_desktop_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("frame_desktop_token");
    localStorage.removeItem("frame_desktop_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, isOnline, isAuthenticated: !!token && !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
