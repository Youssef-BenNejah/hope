import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCabinet } from "@/lib/cabinet/store";
import { dt, fmtDate, today } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { GhostButton } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/comptabilite")({
  head: () => ({
    meta: [
      { title: "Comptabilité — Cabinet" },
      { name: "description", content: "Suivi des recettes du cabinet : jour, semaine, mois et dossiers CNAM." },
      { property: "og:title", content: "Comptabilité — Cabinet" },
      { property: "og:description", content: "Suivi des recettes et des remboursements CNAM du cabinet." },
    ],
  }),
  component: RevenuePage,
});

const methodBadge = {
  cash: { label: "Espèces", cls: "bg-success-soft text-success" },
  cnam_pending: { label: "CNAM en attente", cls: "bg-warning-soft text-warning" },
  cnam_paid: { label: "CNAM remboursé", cls: "bg-frost text-twilight" },
} as const;

function RevenuePage() {
  const { data, update, patientName } = useCabinet();
  const day = today();

  const sum = (from: number, to = 0) => {
    const start = format(subDays(new Date(), from), "yyyy-MM-dd");
    const end = format(subDays(new Date(), to), "yyyy-MM-dd");
    return data.payments.filter((p) => p.date >= start && p.date <= end).reduce((s, p) => s + p.amount, 0);
  };

  const tiles = [
    { label: "Aujourd'hui", value: sum(0), prev: sum(1, 1) },
    { label: "Cette semaine", value: sum(6), prev: sum(13, 7) },
    { label: "Ce mois", value: sum(29), prev: sum(59, 30) },
  ];

  const chart = useMemo(() => {
    const rows = Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
      return {
        date: format(subDays(new Date(), 13 - i), "dd/MM", { locale: fr }),
        total: data.payments.filter((p) => p.date === d).reduce((s, p) => s + p.amount, 0),
      };
    });
    const avg = rows.reduce((s, r) => s + r.total, 0) / rows.length;
    return rows.map((r) => ({ ...r, moyenne: Math.round(avg) }));
  }, [data.payments]);

  const transactions = [...data.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  const pending = data.payments.filter((p) => p.method === "cnam_pending");

  return (
    <ScreenTransition>
      <PageHeader
        title="Comptabilité"
        subtitle={`Suivi financier du cabinet — ${fmtDate(day)}`}
        actions={
          <GhostButton
            onClick={() => toast.success(`Relevé exporté (période : ${format(new Date(), "MMMM yyyy", { locale: fr })})`)}
          >
            <Download className="h-4 w-4" /> Exporter pour le comptable
          </GhostButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((t) => {
          const delta = t.prev ? Math.round(((t.value - t.prev) / t.prev) * 100) : 0;
          const up = delta >= 0;
          return (
            <Card key={t.label}>
              <p className="label-caps">{t.label}</p>
              <p className="mt-2 num text-4xl font-semibold text-twilight dark:text-frost">{dt(t.value)}</p>
              <p className={`mt-2 flex items-center gap-1 text-xs ${up ? "text-success" : "text-danger"}`}>
                {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(delta)}% vs période précédente
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <p className="mb-4 font-semibold">Recettes des 14 derniers jours</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                formatter={(v: number) => [`${v} DT`, ""]}
              />
              <Bar dataKey="total" fill="#0077B6" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="moyenne" stroke="#00B4D8" strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {pending.length > 0 && (
        <Card className="mt-6">
          <p className="mb-3 font-semibold">CNAM en attente</p>
          <div className="divide-y divide-border">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-4 py-2.5 text-sm">
                <span className="num w-28 text-muted-foreground">{fmtDate(p.date, "dd/MM/yyyy")}</span>
                <span className="flex-1">{patientName(p.patientId)}</span>
                <span className="num font-medium">{dt(p.amount)}</span>
                <button
                  onClick={() => {
                    update((d) => ({
                      ...d,
                      payments: d.payments.map((x) => (x.id === p.id ? { ...x, method: "cnam_paid" } : x)),
                    }));
                    toast.success("Montant marqué comme remboursé");
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-success-soft hover:text-success"
                >
                  Marquer comme remboursé
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <p className="mb-3 font-semibold">Transactions</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-twilight text-left text-[#EAF2FA]">
              <th className="label-caps rounded-l-lg px-3 py-2 text-[#CAF0F8]">Date</th>
              <th className="label-caps px-3 py-2 text-[#CAF0F8]">Patient</th>
              <th className="label-caps px-3 py-2 text-[#CAF0F8]">Montant</th>
              <th className="label-caps rounded-r-lg px-3 py-2 text-[#CAF0F8]">Règlement</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="num px-3 py-2.5 text-muted-foreground">{fmtDate(p.date, "dd/MM/yyyy")}</td>
                <td className="px-3 py-2.5">{patientName(p.patientId)}</td>
                <td className="num px-3 py-2.5 font-medium">{dt(p.amount)}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${methodBadge[p.method].cls}`}>
                    {methodBadge[p.method].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ScreenTransition>
  );
}
