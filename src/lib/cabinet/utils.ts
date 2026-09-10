import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { AppointmentStatus } from "./types";

export const today = () => format(new Date(), "yyyy-MM-dd");

export const fmtDate = (iso: string, pattern = "d MMMM yyyy") => {
  try {
    return format(parseISO(iso), pattern, { locale: fr });
  } catch {
    return iso;
  }
};

export const fmtLong = (date: Date) => format(date, "EEEE d MMMM yyyy", { locale: fr });

export const fmtDateTime = (iso: string) => {
  try {
    return format(new Date(iso), "d MMM yyyy 'à' HH'h'mm", { locale: fr });
  } catch {
    return iso;
  }
};

/** "il y a 3 h", "il y a 2 j"… pour les fils de messages / journaux */
export const fmtAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return iso;
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  if (j < 30) return `il y a ${j} j`;
  return fmtDate(iso.slice(0, 10), "dd/MM/yyyy");
};

export const dt = (n: number) => `${n.toFixed(0)} DT`;

export const statusMeta: Record<AppointmentStatus, { label: string; className: string }> = {
  upcoming: { label: "À venir", className: "bg-frost text-twilight" },
  done: { label: "Terminé", className: "bg-success-soft text-success" },
  absent: { label: "Absent", className: "bg-danger-soft text-danger" },
};

export const slots = (step = 15) => {
  const out: string[] = [];
  for (let m = 8 * 60; m <= 18 * 60; m += step) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function levenshtein(a: string, b: string) {
  const s = norm(a);
  const t = norm(b);
  const m: number[][] = Array.from({ length: s.length + 1 }, () => new Array<number>(t.length + 1).fill(0));
  for (let i = 0; i <= s.length; i++) m[i]![0] = i;
  for (let j = 0; j <= t.length; j++) m[0]![j] = j;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      m[i]![j] = Math.min(
        m[i - 1]![j]! + 1,
        m[i]![j - 1]! + 1,
        m[i - 1]![j - 1]! + (s[i - 1] === t[j - 1] ? 0 : 1),
      );
    }
  }
  return m[s.length]![t.length]!;
}

export const matches = (haystack: string, needle: string) => norm(haystack).includes(norm(needle));

/** Initiales (prénom + nom) + 6 chiffres uniques, ex. "ST-482915" */
export function makePatientCode(name: string, taken: string[] = []) {
  const parts = norm(name).split(/\s+/).filter(Boolean);
  const first = (parts[0]?.[0] ?? "x").toUpperCase();
  const last = (parts[parts.length - 1]?.[0] ?? first).toUpperCase();
  const initials = `${first}${last}`;

  // hachage déterministe du nom, puis décalage jusqu'à obtenir un code libre
  let h = 0;
  for (const ch of norm(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 1000; i++) {
    const digits = String((h + i * 7919) % 1_000_000).padStart(6, "0");
    const code = `${initials}-${digits}`;
    if (!taken.includes(code)) return code;
  }
  return `${initials}-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
}

/** Âge calculé automatiquement à partir de la date de naissance */
export function ageFrom(birthDate?: string) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

export const sexLabel = (sex?: "homme" | "femme") =>
  sex === "homme" ? "Homme" : sex === "femme" ? "Femme" : "—";

/** Redimensionne une image (fichier) en dataUrl JPEG, côté max `max` px — pour rester léger en localStorage. */
export function resizeImage(file: File, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("lecture impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image invalide"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas indisponible"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
