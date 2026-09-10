import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { dt, fmtDate, statusMeta, today } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { GhostButton, inputCls } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/comptabilite")({
  head: () => ({
    meta: [
      { title: "Comptabilité & rapports — Cabinet" },
      {
        name: "description",
        content: "Recettes du cabinet et rapports : activité du jour, rendez-vous, encours CNAM, liste patients.",
      },
      { property: "og:title", content: "Comptabilité & rapports — Cabinet" },
      { property: "og:description", content: "Suivi financier et rapports d'activité du cabinet, exportables en CSV." },
    ],
  }),
  component: RevenuePage,
});

const methodBadge = {
  cash: { label: "Espèces", cls: "bg-success-soft text-success" },
  cnam_pending: { label: "CNAM en attente", cls: "bg-warning-soft text-warning" },
  cnam_paid: { label: "CNAM remboursé", cls: "bg-frost text-twilight" },
} as const;
const methodLabel = { cash: "Espèces", cnam_pending: "CNAM en attente", cnam_paid: "CNAM remboursé" } as const;

type View = "recettes" | "jour" | "rdv" | "modes" | "cnam" | "patients";
const tabs: { key: View; label: string }[] = [
  { key: "recettes", label: "Recettes" },
  { key: "jour", label: "Activité du jour" },
  { key: "rdv", label: "Rendez-vous" },
  { key: "modes", label: "Recettes par mode" },
  { key: "cnam", label: "Encours CNAM" },
  { key: "patients", label: "Liste patients" },
];

function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export CSV téléchargé");
}

function ReportTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="bg-twilight text-left text-[#EAF2FA]">
            {head.map((h) => (
              <th key={h} className="label-caps px-3 py-2 text-[#CAF0F8]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="px-3 py-6 text-center text-muted-foreground">
                Aucune donnée sur la période.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RevenuePage() {
  const { data, update, patientName } = useCabinet();
  const day = today();
  const [view, setView] = useState<View>("recettes");
  const [from, setFrom] = useState(format(subDays(new Date(), 6), "yyyy-MM-dd"));
  const [to, setTo] = useState(day);
  const inRange = (x: string) => x >= from && x <= to;

  const sum = (fromN: number, toN = 0) => {
    const start = format(subDays(new Date(), fromN), "yyyy-MM-dd");
    const end = format(subDays(new Date(), toN), "yyyy-MM-dd");
    return data.payments.filter((p) => p.date >= start && p.date <= end).reduce((s, p) => s + p.amount, 0);
  };

  const tiles = [
    { label: "Aujourd'hui", value: sum(0), prev: sum(1, 1) },
    { label: "Cette semaine", value: sum(6), prev: sum(13, 7) },
    { label: "Ce mois", value: sum(29), prev: sum(59, 30) },
  ];

  const chart = useMemo(() => {
    const rows = Array.from({ length: 14 }, (_, i) => {
      const dd = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
      return {
        date: format(subDays(new Date(), 13 - i), "dd/MM", { locale: fr }),
        total: data.payments.filter((p) => p.date === dd).reduce((s, p) => s + p.amount, 0),
      };
    });
    const avg = rows.reduce((s, r) => s + r.total, 0) / rows.length;
    return rows.map((r) => ({ ...r, moyenne: Math.round(avg) }));
  }, [data.payments]);

  const transactions = [...data.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  const pending = data.payments.filter((p) => p.method === "cnam_pending");

  const dayStats = useMemo(() => {
    const appts = data.appointments.filter((a) => a.date === day);
    const pays = data.payments.filter((p) => p.date === day);
    return {
      appts,
      done: appts.filter((a) => a.status === "done").length,
      absent: appts.filter((a) => a.status === "absent").length,
      upcoming: appts.filter((a) => a.status === "upcoming").length,
      total: pays.reduce((s, p) => s + p.amount, 0),
      cash: pays.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0),
      cnam: pays.filter((p) => p.method !== "cash").reduce((s, p) => s + p.amount, 0),
    };
  }, [data, day]);

  const rdvRows = useMemo(
    () =>
      data.appointments.filter((a) => inRange(a.date)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [data.appointments, from, to],
  );

  const modes = useMemo(() => {
    const pays = data.payments.filter((p) => inRange(p.date));
    const by = { cash: 0, cnam_pending: 0, cnam_paid: 0 };
    pays.forEach((p) => (by[p.method] += p.amount));
    return { pays, by, total: by.cash + by.cnam_pending + by.cnam_paid };
  }, [data.payments, from, to]);

  const cnam = useMemo(() => {
    const pend = data.payments.filter((p) => p.method === "cnam_pending");
    const bucket = (lo: number, hi: number) =>
      pend.filter((p) => {
        const age = Math.round((Date.now() - new Date(p.date).getTime()) / 86400000);
        return age >= lo && age <= hi;
      });
    const s = (arr: typeof pend) => arr.reduce((acc, p) => acc + p.amount, 0);
    const b0 = bucket(0, 30);
    const b1 = bucket(31, 60);
    const b2 = bucket(61, 9999);
    return { pend, b0, b1, b2, s, total: s(pend) };
  }, [data.payments]);

  return (
    <ScreenTransition>
      <PageHeader
        title="Comptabilité & rapports"
        subtitle={`Suivi financier et rapports — ${fmtDate(day)}`}
        actions={
          <GhostButton
            onClick={() => toast.success(`Relevé exporté (période : ${format(new Date(), "MMMM yyyy", { locale: fr })})`)}
          >
            <Download className="h-4 w-4" /> Exporter pour le comptable
          </GhostButton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                view === t.key ? "bg-teal text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {(view === "rdv" || view === "modes") && (
          <div className="ml-auto flex items-center gap-2">
            <input type="date" className={`${inputCls} num w-auto`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-muted-foreground">→</span>
            <input type="date" className={`${inputCls} num w-auto`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      {view === "recettes" && (
        <>
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
                  <div key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm sm:gap-4">
                    <span className="num w-24 text-muted-foreground sm:w-28">{fmtDate(p.date, "dd/MM/yyyy")}</span>
                    <span className="min-w-0 flex-1 truncate">{patientName(p.patientId)}</span>
                    <span className="num font-medium">{dt(p.amount)}</span>
                    <button
                      onClick={() => {
                        update(
                          (dd) => ({
                            ...dd,
                            payments: dd.payments.map((x) => (x.id === p.id ? { ...x, method: "cnam_paid" } : x)),
                          }),
                          `CNAM marqué remboursé — ${patientName(p.patientId)} (${p.amount} DT)`,
                        );
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
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[560px] text-sm">
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
            </div>
          </Card>
        </>
      )}

      {view === "jour" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Consultations", String(dayStats.appts.length)],
              ["Honorées / absents", `${dayStats.done} / ${dayStats.absent}`],
              ["Encore à venir", String(dayStats.upcoming)],
              ["Recettes du jour", dt(dayStats.total)],
            ].map(([l, v]) => (
              <Card key={l}>
                <p className="label-caps">{l}</p>
                <p className="mt-2 num text-2xl font-semibold text-twilight dark:text-frost">{v}</p>
              </Card>
            ))}
          </div>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Détail — {fmtDate(day)}</p>
              <GhostButton
                onClick={() =>
                  downloadCsv(`rapport-jour-${day}.csv`, [
                    ["Heure", "Patient", "Motif", "Statut"],
                    ...dayStats.appts.map((a) => [a.time, patientName(a.patientId), a.reason, statusMeta[a.status].label]),
                  ])
                }
              >
                <Download className="h-4 w-4" /> CSV
              </GhostButton>
            </div>
            <ReportTable
              head={["Heure", "Patient", "Motif", "Statut"]}
              rows={dayStats.appts.map((a) => [
                <span className="num">{a.time}</span>,
                patientName(a.patientId),
                a.reason,
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusMeta[a.status].className}`}>
                  {statusMeta[a.status].label}
                </span>,
              ])}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Espèces <span className="num font-medium text-foreground">{dt(dayStats.cash)}</span> · CNAM{" "}
              <span className="num font-medium text-foreground">{dt(dayStats.cnam)}</span>
            </p>
          </Card>
        </div>
      )}

      {view === "rdv" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">
              {rdvRows.length} rendez-vous du {fmtDate(from, "dd/MM/yyyy")} au {fmtDate(to, "dd/MM/yyyy")}
            </p>
            <GhostButton
              onClick={() =>
                downloadCsv(`rendez-vous-${from}_${to}.csv`, [
                  ["Date", "Heure", "Patient", "Motif", "Statut"],
                  ...rdvRows.map((a) => [a.date, a.time, patientName(a.patientId), a.reason, statusMeta[a.status].label]),
                ])
              }
            >
              <Download className="h-4 w-4" /> CSV
            </GhostButton>
          </div>
          <ReportTable
            head={["Date", "Heure", "Patient", "Motif", "Statut"]}
            rows={rdvRows.map((a) => [
              <span className="num">{fmtDate(a.date, "dd/MM/yy")}</span>,
              <span className="num">{a.time}</span>,
              patientName(a.patientId),
              a.reason,
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusMeta[a.status].className}`}>
                {statusMeta[a.status].label}
              </span>,
            ])}
          />
        </Card>
      )}

      {view === "modes" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total encaissé", dt(modes.total)],
              ["Espèces", dt(modes.by.cash)],
              ["CNAM en attente", dt(modes.by.cnam_pending)],
              ["CNAM remboursé", dt(modes.by.cnam_paid)],
            ].map(([l, v]) => (
              <Card key={l}>
                <p className="label-caps">{l}</p>
                <p className="mt-2 num text-2xl font-semibold text-twilight dark:text-frost">{v}</p>
              </Card>
            ))}
          </div>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">{modes.pays.length} paiements sur la période</p>
              <GhostButton
                onClick={() =>
                  downloadCsv(`recettes-${from}_${to}.csv`, [
                    ["Date", "Patient", "Montant (DT)", "Mode"],
                    ...modes.pays
                      .slice()
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((p) => [p.date, patientName(p.patientId), p.amount, methodLabel[p.method]]),
                  ])
                }
              >
                <Download className="h-4 w-4" /> CSV
              </GhostButton>
            </div>
            <ReportTable
              head={["Mode de règlement", "Nombre", "Montant"]}
              rows={(["cash", "cnam_pending", "cnam_paid"] as const).map((m) => [
                methodLabel[m],
                <span className="num">{modes.pays.filter((p) => p.method === m).length}</span>,
                <span className="num font-medium">{dt(modes.by[m])}</span>,
              ])}
            />
          </Card>
        </div>
      )}

      {view === "cnam" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">Encours CNAM : {dt(cnam.total)}</p>
            <GhostButton
              onClick={() =>
                downloadCsv(`encours-cnam-${today()}.csv`, [
                  ["Date", "Patient", "Montant (DT)", "Ancienneté (j)"],
                  ...cnam.pend
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((p) => [
                      p.date,
                      patientName(p.patientId),
                      p.amount,
                      Math.round((Date.now() - new Date(p.date).getTime()) / 86400000),
                    ]),
                ])
              }
            >
              <Download className="h-4 w-4" /> CSV
            </GhostButton>
          </div>
          <ReportTable
            head={["Ancienneté", "Dossiers", "Montant"]}
            rows={[
              ["0 – 30 jours", <span className="num">{cnam.b0.length}</span>, <span className="num font-medium">{dt(cnam.s(cnam.b0))}</span>],
              ["31 – 60 jours", <span className="num">{cnam.b1.length}</span>, <span className="num font-medium">{dt(cnam.s(cnam.b1))}</span>],
              [
                "Plus de 60 jours",
                <span className="num text-danger">{cnam.b2.length}</span>,
                <span className="num font-medium text-danger">{dt(cnam.s(cnam.b2))}</span>,
              ],
            ]}
          />
        </Card>
      )}

      {view === "patients" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">{data.patients.length} patients au répertoire</p>
            <GhostButton
              onClick={() =>
                downloadCsv(`patients-${today()}.csv`, [
                  ["Identifiant", "Nom", "Téléphone", "Naissance", "Sexe", "Couverture", "N° CNAM", "Allergies"],
                  ...data.patients.map((p) => [
                    p.code,
                    p.name,
                    p.phone,
                    p.birthDate,
                    p.sex ?? "",
                    p.coverage ?? "",
                    p.cnam,
                    p.allergies.join(", "),
                  ]),
                ])
              }
            >
              <Download className="h-4 w-4" /> CSV
            </GhostButton>
          </div>
          <ReportTable
            head={["Identifiant", "Nom", "Téléphone", "Couverture"]}
            rows={data.patients.map((p) => [
              <span className="num text-xs font-semibold text-teal">{p.code}</span>,
              p.name,
              <span className="num text-muted-foreground">{p.phone}</span>,
              p.coverage === "assurance" ? "Assurance" : p.coverage === "aucune" ? "Aucune" : "CNAM",
            ])}
          />
        </Card>
      )}
    </ScreenTransition>
  );
}
