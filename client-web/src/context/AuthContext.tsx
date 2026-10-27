import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

export interface User {
  id: string;
  username: string;
  role: "EMPLOYEE" | "ADMIN" | "DEVELOPER";
  fullName: string;
  jobTitle?: string;
  avatarUrl?: string;
  workstationId?: string;
}

export interface Branding {
  appName: string;
  logoUrl: string;
  companySubtitle: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  branding: Branding;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  login: (token: string, user: User, branding?: Branding) => void;
  logout: () => void;
  updateBranding: (newBranding: Partial<Branding>) => void;
}

const defaultBranding: Branding = {
  appName: "Frame Production",
  logoUrl: "/assets/logo.png",
  companySubtitle: "Video Editing & Production Agency"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("frame_auth_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("frame_auth_token"));
  const [branding, setBranding] = useState<Branding>(defaultBranding);

  useEffect(() => {
    // Fetch initial branding
    api.get("/settings/branding")
      .then((res) => {
        if (res.data) {
          setBranding({
            appName: res.data.appName || defaultBranding.appName,
            logoUrl: res.data.logoUrl || defaultBranding.logoUrl,
            companySubtitle: res.data.companySubtitle || defaultBranding.companySubtitle
          });
        }
      })
      .catch(() => {});

    // Verify session
    if (token) {
      api.get("/auth/me")
        .then((res) => {
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("frame_auth_user", JSON.stringify(res.data.user));
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken: string, newUser: User, newBranding?: Branding) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("frame_auth_token", newToken);
    localStorage.setItem("frame_auth_user", JSON.stringify(newUser));
    if (newBranding) setBranding(newBranding);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("frame_auth_token");
    localStorage.removeItem("frame_auth_user");
  };

  const updateBranding = (newBranding: Partial<Branding>) => {
    setBranding((prev) => ({ ...prev, ...newBranding }));
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "DEVELOPER";
  const isDeveloper = user?.role === "DEVELOPER";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        branding,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isDeveloper,
        login,
        logout,
        updateBranding
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
