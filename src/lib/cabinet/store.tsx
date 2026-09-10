import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildSeed, uid } from "./seed";
import { makePatientCode } from "./utils";
import type { CabinetData, Settings } from "./types";
import { CabinetContext, type CabinetContextValue, type SessionRole } from "./context";

export { useCabinet } from "./context";

const KEY = "cabinet-data-v1";

function load(): CabinetData {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CabinetData;
      const seed = buildSeed();
      // rétro-compatibilité : générer l'identifiant des anciens dossiers
      const taken: string[] = parsed.patients.map((p) => p.code).filter(Boolean);
      parsed.patients = parsed.patients.map((p) => {
        if (p.code) return p;
        const code = makePatientCode(p.name, taken);
        taken.push(code);
        return { ...p, code };
      });
      parsed.settings = {
        ...seed.settings,
        ...parsed.settings,
        consultDuration: parsed.settings.consultDuration || 30,
        adminPin: parsed.settings.adminPin || "0000",
        appointmentCategories: parsed.settings.appointmentCategories?.length
          ? parsed.settings.appointmentCategories
          : seed.settings.appointmentCategories,
        resources: parsed.settings.resources?.length ? parsed.settings.resources : seed.settings.resources,
        certificateTemplates: parsed.settings.certificateTemplates ?? [],
      };
      // rétro-compatibilité : comptes médecins + rôle
      if (!parsed.doctors?.length) parsed.doctors = seed.doctors;
      parsed.doctors = parsed.doctors.map((d) => ({ ...d, role: d.role ?? "medecin" }));
      // rétro-compatibilité : garantir au moins un compte secrétariat (connexion + module Personnel)
      if (!parsed.doctors.some((d) => d.role === "secretaire")) {
        parsed.doctors = [...parsed.doctors, ...seed.doctors.filter((d) => d.role === "secretaire")];
      }
      // rétro-compatibilité : suivi clinique + analyses de démonstration
      if (!parsed.checkups?.length || !parsed.analyses?.some((a) => a.patientId === "pat-salma")) {
        parsed.checkups = parsed.checkups?.length ? parsed.checkups : seed.checkups;
        if (!parsed.analyses?.some((a) => a.patientId === "pat-salma")) {
          parsed.analyses = [...(parsed.analyses ?? []), ...seed.analyses.filter((a) => a.patientId === "pat-salma")];
        }
      }
      // rétro-compatibilité : nouvelles collections
      parsed.holidays ??= seed.holidays;
      parsed.referrals ??= seed.referrals;
      parsed.vaccinations ??= seed.vaccinations;
      parsed.documents ??= seed.documents;
      parsed.contacts ??= seed.contacts;
      // rétro-compatibilité : donner un contenu visualisable aux documents d'exemple
      parsed.documents = (parsed.documents ?? seed.documents).map((doc) => {
        if (doc.dataUrl) return doc;
        const match = seed.documents.find((s) => s.name === doc.name);
        return match ? { ...doc, dataUrl: match.dataUrl, mime: match.mime } : doc;
      });
      // rétro-compatibilité : anciens entretiens (trame de questions) → texte libre des réponses
      parsed.diagnostics = (parsed.diagnostics ?? seed.diagnostics).map((entry) => {
        const legacy = entry as unknown as {
          content?: string;
          answers?: { question?: string; answer?: string }[];
          freeNotes?: string;
        };
        if (typeof legacy.content === "string") return entry;
        const lines = (legacy.answers ?? [])
          .map((a) => {
            const q = String(a.question ?? "").trim();
            const ans = String(a.answer ?? "").trim();
            if (!q && !ans) return "";
            return q ? `${q} ${ans}`.trim() : ans;
          })
          .filter(Boolean);
        const content = [...lines, legacy.freeNotes].filter(Boolean).join("\n");
        return { ...entry, content } as (typeof parsed.diagnostics)[number];
      });
      parsed.messages ??= seed.messages;
      parsed.audit ??= [];
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

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
    (fn: (d: CabinetData) => CabinetData, audit?: string) => {
      setData((prev) => {
        const next = fn(prev);
        if (!audit) return next;
        const actor =
          prev.doctors.find((d) => d.id === userIdRef.current)?.name ?? prev.settings.doctorName ?? "Système";
        const entry = { id: uid(), at: new Date().toISOString(), actor, summary: audit };
        return { ...next, audit: [entry, ...(next.audit ?? [])].slice(0, 400) };
      });
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

  const currentUser = useMemo(
    () => data.doctors.find((d) => d.id === currentUserId) ?? null,
    [data.doctors, currentUserId],
  );
  const role: SessionRole = isAdmin ? "admin" : (currentUser?.role ?? "medecin");

  const value = useMemo<CabinetContextValue>(
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
      isAdmin,
      currentUser,
      role,
      lock: () => {
        setLocked(true);
        setIsAdmin(false);
        setCurrentUserId(null);
        userIdRef.current = null;
      },
      unlock: (opts) => {
        setIsAdmin(!!opts?.admin);
        setCurrentUserId(opts?.userId ?? null);
        userIdRef.current = opts?.userId ?? null;
        setLocked(false);
      },
      patientName,
      newId: uid,
    }),
    [
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
      isAdmin,
      currentUser,
      role,
      patientName,
    ],
  );

  return <CabinetContext.Provider value={value}>{children}</CabinetContext.Provider>;
}
