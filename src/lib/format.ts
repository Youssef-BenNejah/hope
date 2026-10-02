const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const relativeFmt = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const toDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (iso?: string | null) => {
  const d = iso ? toDate(iso) : null;
  return d ? dateFmt.format(d) : "—";
};

export const fmtDateTime = (iso?: string | null) => {
  const d = iso ? toDate(iso) : null;
  return d ? dateTimeFmt.format(d) : "—";
};

/** "2026-05" -> "mai" */
export const fmtMonth = (yyyyMm: string) => {
  const d = toDate(`${yyyyMm}-01T00:00:00`);
  return d ? monthFmt.format(d).replace(".", "") : yyyyMm;
};

/** "il y a 3 jours", "hier"… for an ISO instant. */
export const fmtAgo = (iso?: string | null) => {
  const d = iso ? toDate(iso) : null;
  if (!d) return "Jamais";
  const seconds = Math.round((d.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFmt.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue");

export const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
