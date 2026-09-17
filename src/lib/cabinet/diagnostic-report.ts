export interface ReportLine {
  kind: "flag" | "section" | "sub" | "text";
  text: string;
}

/** Découpe le texte généré/écrit par le médecin en lignes typées pour un affichage lisible. */
export function parseReport(content: string): ReportLine[] {
  return content
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      if (line.trim().startsWith("🚨")) return { kind: "flag", text: line.replace(/^\s*🚨\s*/, "") };
      if (/^\s{2}-\s/.test(line)) return { kind: "sub", text: line.replace(/^\s{2}-\s/, "") };
      if (line.includes(" : ")) return { kind: "section", text: line };
      return { kind: "text", text: line };
    });
}
