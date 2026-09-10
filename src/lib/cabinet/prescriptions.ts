import type { Favorite } from "./types";

const rid = () => Math.random().toString(36).slice(2, 10);

const stripDiacritics = (s: string) => {
  let out = "";
  for (const ch of s.normalize("NFD")) {
    const c = ch.charCodeAt(0);
    if (c >= 0x300 && c <= 0x36f) continue;
    out += ch;
  }
  return out;
};
const norm = (s: string) => stripDiacritics(s.toLowerCase());
const asciiDash = (s: string) => {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    out += c >= 0x2010 && c <= 0x2015 ? "-" : ch;
  }
  return out;
};

/** Ligne d'ordonnance générée à partir d'un favori structuré. */
export function renderFavorite(f: Favorite): string {
  let s = f.label.trim();
  if (f.form?.trim()) s += ` (${f.form.trim()})`;
  if (f.posology?.trim()) s += ` - ${f.posology.trim()}`;
  if (f.duration?.trim()) s += `, ${f.duration.trim()}`;
  if (f.note?.trim()) s += ` - ${f.note.trim()}`;
  return s;
}

/** Convertit une ancienne chaîne « Paracétamol 1g — 3x/j, 5j » en favori structuré. */
export function parseLegacyFavorite(raw: string): Favorite {
  const text = asciiDash(String(raw)).trim();
  const parts = text.split(/\s+-\s+/);
  const label = (parts[0] ?? text).trim();
  const rest = parts.slice(1).join(" - ").trim();
  let posology = rest;
  let duration = "";
  const m = rest.match(/^(.*?),\s*([^,]+)$/);
  if (m && m[1] && m[2]) {
    posology = m[1].trim();
    duration = m[2].trim();
  }
  return {
    id: rid(),
    label,
    posology: posology || "-",
    ...(duration ? { duration } : {}),
  };
}

// Groupes croisés fréquents : une allergie à la famille => alerte sur ces molécules
const CROSS_ALLERGY: { key: string; members: string[] }[] = [
  { key: "penicill", members: ["penicillin", "penicilline", "amoxicillin", "amoxicilline", "ampicillin", "augmentin", "oxacillin", "cloxacillin", "flucloxacillin"] },
  { key: "sulfamide", members: ["sulfamethoxazole", "cotrimoxazole", "bactrim", "sulfadiazine"] },
  { key: "aspirin", members: ["aspirine", "acetylsalicylique", "aspirin"] },
  { key: "iode", members: ["iode", "iodé", "iode", "amiodarone", "povidone iodee", "produit de contraste"] },
];

/** Repère les conflits d'une ligne d'ordonnance avec les allergies / le traitement chronique. */
export function lineConflicts(
  line: string,
  allergies: string[],
  chronic: string[],
): { allergy: string[]; chronic: string[] } {
  const l = norm(line);
  return {
    allergy: allergies.filter((a) => {
      const term = norm((a.split(/[ (]/)[0] ?? a).trim());
      if (term.length > 2 && l.includes(term)) return true;
      const group = CROSS_ALLERGY.find((g) => norm(a).includes(g.key));
      return !!group && group.members.some((m) => l.includes(norm(m)));
    }),
    chronic: chronic.filter((c) => {
      const drug = norm((c.split(/[-(]/)[0] ?? c).trim());
      return drug.length > 3 && l.includes(drug);
    }),
  };
}
