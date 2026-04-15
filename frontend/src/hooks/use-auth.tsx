"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthLoginRequest, AuthRegisterRequest, UserDTO, Role } from "@/types";
import { authService } from "@/services/auth.service";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";

// Synchronise le token dans un cookie lisible par le middleware
function setAuthCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=Strict`;
  } else {
    document.cookie = "accessToken=; path=/; max-age=0";
  }
}

// Décoder les informations de base depuis le JWT (sans appel réseau)
function decodeUserFromToken(token: string): Partial<UserDTO> | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = (payload.role || payload.authorities?.[0]?.replace("ROLE_", "")) as Role;
    return {
      email: payload.sub || "",
      role: role,
      nom: "",
      prenom: "",
    };
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: UserDTO | null;
  loading: boolean;
  login: (data: AuthLoginRequest) => Promise<void>;
  register: (data: AuthRegisterRequest) => Promise<void>;
  logout: (redirectTo?: string) => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Récupère le profil réel depuis /api/users/me
  const fetchMe = async (): Promise<UserDTO | null> => {
    try {
      const res = await apiClient.get<UserDTO>("/users/me");
      return res.data;
    } catch {
      return null;
    }
  };

  const refreshUser = async () => {
    const me = await fetchMe();
    if (me) {
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        // 1. Essayer de récupérer depuis le serveur
        const me = await fetchMe();
        if (me) {
          setUser(me);
          localStorage.setItem("user", JSON.stringify(me));
        } else {
          // 2. Fallback sur le cache local
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              // 3. Dernier recours: décoder le JWT directement
              const decoded = decodeUserFromToken(token);
              if (decoded) {
                setUser(decoded as UserDTO);
              } else {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
              }
            }
          } else {
            // 4. Décoder le JWT si pas de cache
            const decoded = decodeUserFromToken(token);
            if (decoded) {
              setUser(decoded as UserDTO);
            } else {
              localStorage.removeItem("accessToken");
            }
          }
        }
      }
      setLoading(false);
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirectByRole = (role: Role) => {
    if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (role === "SELLER") {
      router.push("/seller/dashboard");
    } else {
      router.push("/");
    }
  };

  const login = async (data: AuthLoginRequest) => {
    const response = await authService.login(data);
    localStorage.setItem("accessToken", response.access_token);
    localStorage.setItem("refreshToken", response.refresh_token);
    setAuthCookie(response.access_token);

    // 1. Essayer de récupérer le profil complet
    const me = await fetchMe();
    if (me) {
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
      redirectByRole(me.role);
    } else {
      // 2. Fallback: déchiffrer depuis le JWT pour avoir role + email
      const decoded = decodeUserFromToken(response.access_token);
      if (decoded && decoded.role) {
        setUser(decoded as UserDTO);
        localStorage.setItem("user", JSON.stringify(decoded));
        redirectByRole(decoded.role);
      } else {
        router.push("/");
      }
    }
  };

  const register = async (data: AuthRegisterRequest) => {
    // register retourne le UserDTO (pas de token), on fait un login automatique après
    await authService.register(data);
    const loginResp = await authService.login({ email: data.email, password: data.password });
    localStorage.setItem("accessToken", loginResp.access_token);
    localStorage.setItem("refreshToken", loginResp.refresh_token);
    setAuthCookie(loginResp.access_token);

    const me = await fetchMe();
    if (me) {
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
      redirectByRole(me.role);
    } else {
      const decoded = decodeUserFromToken(loginResp.access_token);
      if (decoded && decoded.role) {
        setUser(decoded as UserDTO);
        localStorage.setItem("user", JSON.stringify(decoded));
        redirectByRole(decoded.role);
      } else {
        router.push("/");
      }
    }
  };

  const logout = (redirectTo: string = "/login") => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      authService.logout(refreshToken).catch(console.error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setAuthCookie(null);
    setUser(null);
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
