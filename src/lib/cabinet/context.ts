import { createContext, useContext } from "react";
import type { CabinetData, Doctor, Settings, UserRole } from "./types";

export type SessionRole = UserRole | "admin";

export interface CabinetContextValue {
  data: CabinetData;
  update: (fn: (data: CabinetData) => CabinetData, audit?: string) => void;
  setSettings: (settings: Partial<Settings>) => void;
  reset: () => void;
  offline: boolean;
  setOffline: (value: boolean) => void;
  pending: number;
  syncing: boolean;
  justSynced: boolean;
  locked: boolean;
  isAdmin: boolean;
  currentUser: Doctor | null;
  role: SessionRole;
  lock: () => void;
  unlock: (opts?: { admin?: boolean; userId?: string }) => void;
  patientName: (id: string) => string;
  newId: () => string;
}

export const CabinetContext = createContext<CabinetContextValue | null>(null);

export function useCabinet() {
  const context = useContext(CabinetContext);
  if (!context) {
    throw new Error("useCabinet doit être utilisé dans CabinetProvider");
  }
  return context;
}
