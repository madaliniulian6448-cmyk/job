import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  role: "user" | "admin";
  businessType: "none" | "private" | "company";
  businessStatus: "pending" | "approved" | "rejected";
  businessName: string | null;
  businessDescription: string | null;
  caen: string | null;
  cui: string | null;
  proofUrl: string | null;
  paidUntil: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/auth/me");
        return res.user as AuthUser;
      } catch {
        return null;
      }
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <AuthContext.Provider value={{ user: data ?? null, isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useInvalidateAuth() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["me"] });
}

export function isBusinessVisible(user: AuthUser): boolean {
  if (user.businessType === "none") return true;
  if (user.businessStatus !== "approved") return false;
  return !!user.paidUntil && new Date(user.paidUntil) > new Date();
}
