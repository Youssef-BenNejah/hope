import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Search } from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDateTime, matches } from "@/lib/cabinet/utils";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { inputCls } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal d'activité — Cabinet" },
      { name: "description", content: "Historique horodaté des actions réalisées dans le cabinet, par utilisateur." },
      { property: "og:title", content: "Journal d'activité — Cabinet" },
      { property: "og:description", content: "Traçabilité des modifications du dossier cabinet." },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const { data } = useCabinet();
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("Tous");

  const actors = useMemo(() => [...new Set(data.audit.map((a) => a.actor))], [data.audit]);

  const groups = useMemo(() => {
    const rows = data.audit
      .filter((a) => actor === "Tous" || a.actor === actor)
      .filter((a) => !q || matches(a.summary, q) || matches(a.actor, q));
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = format(new Date(r.at), "EEEE d MMMM yyyy", { locale: fr });
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()];
  }, [data.audit, actor, q]);

  return (
    <ScreenTransition>
      <PageHeader
        title="Journal d'activité"
        subtitle={`${data.audit.length} action${data.audit.length > 1 ? "s" : ""} enregistrée${
          data.audit.length > 1 ? "s" : ""
        }`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Rechercher dans le journal…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className={`${inputCls} w-auto`} value={actor} onChange={(e) => setActor(e.target.value)}>
          <option>Tous</option>
          {actors.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      {data.audit.length === 0 ? (
        <EmptyState
          icon={<History className="h-10 w-10" />}
          title="Le journal est vide — il se remplit au fil des actions (dossiers, ordonnances, paiements…)."
        />
      ) : groups.length === 0 ? (
        <EmptyState icon={<History className="h-10 w-10" />} title="Aucune entrée ne correspond au filtre." />
      ) : (
        <div className="space-y-6">
          {groups.map(([day, rows]) => (
            <div key={day}>
              <p className="label-caps mb-2 capitalize text-teal">{day}</p>
              <Card className="p-0">
                <div className="divide-y divide-border">
                  {rows.map((r) => (
                    <div key={r.id} className="flex items-baseline gap-4 px-4 py-2.5 text-sm sm:px-5">
                      <span className="num w-16 shrink-0 text-xs text-muted-foreground">
                        {format(new Date(r.at), "HH'h'mm")}
                      </span>
                      <span className="flex-1">{r.summary}</span>
                      <span className="shrink-0 text-xs text-muted-foreground" title={fmtDateTime(r.at)}>
                        {r.actor}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </ScreenTransition>
  );
}
