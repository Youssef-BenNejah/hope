import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, matches } from "@/lib/cabinet/utils";
import { globalTrend, stateMeta } from "@/lib/cabinet/tracking";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { inputCls } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/suivi/")({
  head: () => ({
    meta: [
      { title: "Suivi des patients — Cabinet" },
      {
        name: "description",
        content: "Vue d'ensemble de l'évolution clinique des patients : état, score biologique et dernier contrôle.",
      },
      { property: "og:title", content: "Suivi des patients — Cabinet" },
      { property: "og:description", content: "État clinique et score biologique de chaque patient." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackingIndex,
});

function TrackingIndex() {
  const { data } = useCabinet();
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      data.patients
        .filter((p) => !q || matches(p.name, q) || matches(p.code, q) || matches(p.phone, q))
        .map((p) => {
          const analyses = data.analyses.filter((a) => a.patientId === p.id);
          const checkups = data.checkups.filter((c) => c.patientId === p.id);
          const g = globalTrend(analyses, checkups);
          return { patient: p, ...g, count: checkups.length + analyses.length };
        }),
    [data.patients, data.analyses, data.checkups, q],
  );

  return (
    <ScreenTransition>
      <PageHeader title="Suivi des patients" subtitle="Évolution clinique et biologique de chaque dossier" />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Rechercher un patient…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Activity className="h-8 w-8" />} title="Aucun patient trouvé." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Link key={r.patient.id} to="/suivi/$id" params={{ id: r.patient.id }}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.patient.name}</p>
                    <p className="num truncate text-xs text-muted-foreground">{r.patient.code}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${stateMeta[r.state].className}`}>
                    {stateMeta[r.state].label}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="label-caps text-muted-foreground">Score biologique</p>
                    <p className="num text-2xl font-semibold">{r.count ? `${r.score}/100` : "—"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.lastCheckup ? `Contrôle le ${fmtDate(r.lastCheckup.date, "dd/MM/yyyy")}` : "Aucun contrôle"}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.count ? r.score : 0}%`, background: stateMeta[r.state].dot }}
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </ScreenTransition>
  );
}
