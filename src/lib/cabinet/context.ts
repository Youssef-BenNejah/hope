import { createContext, useContext } from "react";
import type { CabinetData, Settings } from "./types";

export interface CabinetContextValue {
  data: CabinetData;
  update: (fn: (data: CabinetData) => CabinetData) => void;
  setSettings: (settings: Partial<Settings>) => void;
  reset: () => void;
  offline: boolean;
  setOffline: (value: boolean) => void;
  pending: number;
  syncing: boolean;
  justSynced: boolean;
  locked: boolean;
  lock: () => void;
  unlock: () => void;
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