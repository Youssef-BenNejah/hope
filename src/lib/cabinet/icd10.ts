import type { IcdCode } from "./types";

/**
 * Sous-ensemble CIM-10 des motifs les plus fréquents en médecine générale.
 * Volontairement court : un cabinet solo n'a pas besoin du référentiel complet.
 */
export const ICD10: IcdCode[] = [
  { code: "I10", label: "Hypertension essentielle (primitive)" },
  { code: "E11", label: "Diabète sucré de type 2" },
  { code: "E78.5", label: "Hyperlipidémie, sans précision" },
  { code: "E66.9", label: "Obésité, sans précision" },
  { code: "J00", label: "Rhinopharyngite aiguë (rhume banal)" },
  { code: "J02.9", label: "Pharyngite aiguë, sans précision" },
  { code: "J03.9", label: "Amygdalite aiguë, sans précision" },
  { code: "J06.9", label: "Infection aiguë des voies respiratoires supérieures" },
  { code: "J20.9", label: "Bronchite aiguë, sans précision" },
  { code: "J45", label: "Asthme" },
  { code: "J44", label: "Bronchopneumopathie chronique obstructive" },
  { code: "A09", label: "Gastro-entérite et colite d'origine infectieuse" },
  { code: "K21.9", label: "Reflux gastro-œsophagien sans œsophagite" },
  { code: "K29.7", label: "Gastrite, sans précision" },
  { code: "K59.0", label: "Constipation" },
  { code: "N39.0", label: "Infection des voies urinaires, siège non précisé" },
  { code: "M54.5", label: "Lombalgie basse" },
  { code: "M54.2", label: "Cervicalgie" },
  { code: "M25.5", label: "Douleur articulaire" },
  { code: "M79.7", label: "Fibromyalgie" },
  { code: "R51", label: "Céphalée" },
  { code: "G43.9", label: "Migraine, sans précision" },
  { code: "R05", label: "Toux" },
  { code: "R10.4", label: "Douleurs abdominales, autres et non précisées" },
  { code: "R50.9", label: "Fièvre, sans précision" },
  { code: "R42", label: "Étourdissements et vertiges" },
  { code: "F41.9", label: "Trouble anxieux, sans précision" },
  { code: "F32.9", label: "Épisode dépressif, sans précision" },
  { code: "F51.0", label: "Insomnie non organique" },
  { code: "L20.9", label: "Dermatite atopique, sans précision" },
  { code: "L30.9", label: "Dermatite, sans précision" },
  { code: "L23.9", label: "Dermatite allergique de contact, de cause non précisée" },
  { code: "H66.9", label: "Otite moyenne, sans précision" },
  { code: "H10.9", label: "Conjonctivite, sans précision" },
  { code: "B34.9", label: "Infection virale, sans précision" },
  { code: "Z00.0", label: "Examen médical général" },
  { code: "Z23", label: "Nécessité de vaccination contre une seule maladie" },
  { code: "Z71.3", label: "Conseil diététique et surveillance" },
  { code: "D50.9", label: "Anémie par carence en fer, sans précision" },
  { code: "E03.9", label: "Hypothyroïdie, sans précision" },
];

const stripDiacritics = (s: string) => {
  let out = "";
  for (const ch of s.normalize("NFD")) {
    const c = ch.charCodeAt(0);
    if (c >= 768 && c <= 879) continue; // marques combinantes U+0300–U+036F
    out += ch;
  }
  return out;
};

const norm = (s: string) => stripDiacritics(s.toLowerCase());

export function searchIcd(query: string, limit = 8): IcdCode[] {
  const q = norm(query.trim());
  if (!q) return ICD10.slice(0, limit);
  return ICD10.filter((c) => norm(c.code).includes(q) || norm(c.label).includes(q)).slice(0, limit);
}
