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

export const dt = (n: number) => `${n.toFixed(0)} DT`;

export const statusMeta: Record<AppointmentStatus, { label: string; className: string }> = {
  upcoming: { label: "À venir", className: "bg-frost text-twilight" },
  done: { label: "Terminé", className: "bg-success-soft text-success" },
  absent: { label: "Absent", className: "bg-danger-soft text-danger" },
};

export const slots = () => {
  const out: string[] = [];
  for (let h = 8; h <= 18; h++) {
    for (const m of ["00", "15", "30", "45"]) {
      if (h === 18 && m !== "00") continue;
      out.push(`${String(h).padStart(2, "0")}:${m}`);
    }
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
