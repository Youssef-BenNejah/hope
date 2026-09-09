import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed, uid } from "./seed";
import { makePatientCode } from "./utils";
import type { CabinetData, Settings } from "./types";

const KEY = "cabinet-data-v1";

interface Ctx {
  data: CabinetData;
  update: (fn: (d: CabinetData) => CabinetData) => void;
  setSettings: (s: Partial<Settings>) => void;
  reset: () => void;
  offline: boolean;
  setOffline: (v: boolean) => void;
  pending: number;
  syncing: boolean;
  justSynced: boolean;
  locked: boolean;
  lock: () => void;
  unlock: () => void;
  patientName: (id: string) => string;
  newId: () => string;
}

const CabinetContext = createContext<Ctx | null>(null);

function load(): CabinetData {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CabinetData;
      // rétro-compatibilité : générer l'identifiant des anciens dossiers
      const taken: string[] = parsed.patients.map((p) => p.code).filter(Boolean);
      parsed.patients = parsed.patients.map((p) => {
        if (p.code) return p;
        const code = makePatientCode(p.name, taken);
        taken.push(code);
        return { ...p, code };
      });
      parsed.settings = { consultDuration: 30, ...parsed.settings };
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return buildSeed();
}

export function CabinetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CabinetData>(() => buildSeed());
  const [hydrated, setHydrated] = useState(false);
  const [offline, setOfflineState] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, hydrated]);

  // Thème
  useEffect(() => {
    if (typeof document === "undefined") return;
    const theme = data.settings.theme;
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const dark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", !!dark);
  }, [data.settings.theme]);

  const update = useCallback(
    (fn: (d: CabinetData) => CabinetData) => {
      setData((prev) => fn(prev));
      setPending((p) => (offline ? p + 1 : p));
    },
    [offline],
  );

  const setSettings = useCallback(
    (s: Partial<Settings>) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...s } })),
    [],
  );

  const reset = useCallback(() => {
    const seed = buildSeed();
    setData(seed);
    setPending(0);
  }, []);

  const setOffline = useCallback((v: boolean) => {
    setOfflineState(v);
    if (!v) {
      setSyncing(true);
      window.setTimeout(() => {
        setSyncing(false);
        setPending(0);
        setJustSynced(true);
        window.setTimeout(() => setJustSynced(false), 2000);
      }, 1000);
    }
  }, []);

  // Verrouillage automatique par inactivité
  useEffect(() => {
    if (locked) return;
    const delay = data.settings.lockDelay;
    if (!delay) return;
    let timer: number;
    const reset2 = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLocked(true), delay * 60_000);
    };
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset2));
    reset2();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset2));
    };
  }, [locked, data.settings.lockDelay]);

  const patientName = useCallback(
    (id: string) => data.patients.find((p) => p.id === id)?.name ?? "Patient inconnu",
    [data.patients],
  );

  const value = useMemo<Ctx>(
    () => ({
      data,
      update,
      setSettings,
      reset,
      offline,
      setOffline,
      pending,
      syncing,
      justSynced,
      locked,
      lock: () => setLocked(true),
      unlock: () => setLocked(false),
      patientName,
      newId: uid,
    }),
    [data, update, setSettings, reset, offline, setOffline, pending, syncing, justSynced, locked, patientName],
  );

  return <CabinetContext.Provider value={value}>{children}</CabinetContext.Provider>;
}

export function useCabinet() {
  const ctx = useContext(CabinetContext);
  if (!ctx) throw new Error("useCabinet doit être utilisé dans CabinetProvider");
  return ctx;
}
