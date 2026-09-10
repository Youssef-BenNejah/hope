import type { Diagnostic } from "./types";

/**
 * Entretien libre : le médecin note uniquement les réponses du patient,
 * sans aucune question pré-remplie. Brouillon daté, modifiable à tout moment.
 */

/** Court extrait du contenu pour l'affichage en liste */
export const diagnosticPreview = (d: Pick<Diagnostic, "content">, max = 140) => {
  const t = d.content.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
};
