import { memo } from "react";
import type { CabinetActivity, GrowthMonth, SpecialtyCount } from "@/lib/api";
import { fmtMonth } from "@/lib/format";

/** Dependency-free monthly bars: new cabinets (solid) and new doctors (light). */
export const GrowthChart = memo(function GrowthChart({ data }: { data: GrowthMonth[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.newCabinets, d.newDoctors]));
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <div>
      <div className="flex h-48 items-end gap-3 border-b border-border" role="img" aria-label="Croissance mensuelle">
        {data.map((d) => (
          <div
            key={d.month}
            className="flex h-full flex-1 items-end justify-center gap-1"
            title={`${d.month} : ${d.newCabinets} cabinet(s), ${d.newDoctors} médecin(s), ${d.totalCabinets} au total`}
          >
            <div className="w-full max-w-6 rounded-t bg-teal" style={{ height: pct(d.newCabinets), minHeight: d.newCabinets ? 3 : 0 }} />
            <div className="w-full max-w-6 rounded-t bg-frost" style={{ height: pct(d.newDoctors), minHeight: d.newDoctors ? 3 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center">
            {fmtMonth(d.month)}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-teal" /> Nouveaux cabinets
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-frost" /> Nouveaux médecins
        </span>
      </div>
    </div>
  );
});

export const ActivityBars = memo(function ActivityBars({ data }: { data: CabinetActivity[] }) {
  const max = Math.max(1, ...data.map((d) => d.appointments));
  if (!data.length) return <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée</p>;
  return (
    <ul className="space-y-3">
      {data.map((c) => (
        <li key={c.cabinetId}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="truncate">{c.name}</span>
            <span className="num shrink-0 text-muted-foreground">
              {c.appointments} RDV · {c.patients} patients
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-teal" style={{ width: `${(c.appointments / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
});

export const SpecialtyBars = memo(function SpecialtyBars({ data }: { data: SpecialtyCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.doctors));
  if (!data.length) return <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée</p>;
  return (
    <ul className="space-y-3">
      {data.map((s) => (
        <li key={s.specialty}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate">{s.specialty}</span>
            <span className="num text-muted-foreground">{s.doctors}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-surf" style={{ width: `${(s.doctors / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
});
