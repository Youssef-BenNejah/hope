import type { Analysis, AnalysisValue, Checkup, PatientState } from "./types";

export const stateMeta: Record<PatientState, { label: string; className: string; dot: string; score: number }> = {
  mieux: { label: "Amélioration", className: "bg-success-soft text-success", dot: "#2E9E6B", score: 100 },
  stable: { label: "Stable", className: "bg-frost text-twilight", dot: "#0077B6", score: 65 },
  moins_bien: { label: "Aggravation", className: "bg-danger-soft text-danger", dot: "#D1495B", score: 25 },
};

export const states: PatientState[] = ["mieux", "stable", "moins_bien"];

export interface MarkerPoint {
  date: string;
  value: number;
  unit: string;
  ref: number;
  refMin?: number;
}

/** Regroupe toutes les valeurs d'analyses par marqueur, triées par date */
export function markerSeries(analyses: Analysis[]): Record<string, MarkerPoint[]> {
  const out: Record<string, MarkerPoint[]> = {};
  const sorted = [...analyses].sort((a, b) => a.date.localeCompare(b.date));
  for (const a of sorted) {
    for (const v of a.values) {
      (out[v.label] ??= []).push({
        date: a.date,
        value: v.value,
        unit: v.unit,
        ref: v.ref,
        ...(v.refMin !== undefined ? { refMin: v.refMin } : {}),
      });
    }
  }
  return out;
}

export const inRange = (v: Pick<AnalysisValue, "value" | "ref" | "refMin">) =>
  v.value <= v.ref && (v.refMin === undefined || v.value >= v.refMin);

/** Écart relatif à la zone normale : 0 = parfait, 1 = très éloigné */
function deviation(p: MarkerPoint) {
  const min = p.refMin ?? 0;
  const span = Math.max(p.ref - min, Math.abs(p.ref) * 0.2 || 1);
  if (p.value > p.ref) return Math.min((p.value - p.ref) / span, 1);
  if (p.value < min) return Math.min((min - p.value) / span, 1);
  return 0;
}

/** Score de santé 0-100 d'un bilan (100 = tout dans les normes) */
export function analysisScore(points: MarkerPoint[]) {
  if (points.length === 0) return 0;
  const avg = points.reduce((s, p) => s + deviation(p), 0) / points.length;
  return Math.round((1 - avg) * 100);
}

export interface Trend {
  delta: number;
  pct: number;
  better: boolean | null; // true = se rapproche des normes
}

export function markerTrend(points: MarkerPoint[]): Trend | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const delta = last.value - prev.value;
  const pct = prev.value === 0 ? 0 : (delta / prev.value) * 100;
  const d1 = deviation(prev);
  const d2 = deviation(last);
  const better = Math.abs(d2 - d1) < 0.01 ? null : d2 < d1;
  return { delta, pct, better };
}

/** Évolution globale du patient à partir des bilans + points de suivi */
export function globalTrend(analyses: Analysis[], checkups: Checkup[]) {
  const series = markerSeries(analyses);
  const dates = [...new Set(analyses.map((a) => a.date))].sort();
  const scoreByDate = dates.map((date) => {
    const points = Object.values(series)
      .map((pts) => pts.filter((p) => p.date === date))
      .flat();
    return { date, score: analysisScore(points) };
  });

  const lastCheckup = [...checkups].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const first = scoreByDate[0]?.score ?? 0;
  const last = scoreByDate.at(-1)?.score ?? 0;
  const delta = last - first;

  const state: PatientState =
    lastCheckup?.state ?? (delta > 5 ? "mieux" : delta < -5 ? "moins_bien" : "stable");

  return { scoreByDate, score: last, delta, state, lastCheckup };
}
