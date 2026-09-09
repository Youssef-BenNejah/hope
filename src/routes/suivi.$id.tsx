import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  HeartPulse,
  Minus,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCabinet } from "@/lib/cabinet/store";
import type { PatientState } from "@/lib/cabinet/types";
import { fmtDate, today } from "@/lib/cabinet/utils";
import {
  analysisScore,
  globalTrend,
  inRange,
  markerSeries,
  markerTrend,
  stateMeta,
  states,
} from "@/lib/cabinet/tracking";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/suivi/$id")({
  head: () => ({
    meta: [
      { title: "Suivi du patient — Cabinet" },
      {
        name: "description",
        content: "Courbes d'évolution, constantes, bilans biologiques et état clinique du patient.",
      },
      { property: "og:title", content: "Suivi du patient — Cabinet" },
      { property: "og:description", content: "Courbes, constantes et évolution clinique du patient." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackingPage,
});

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

function Kpi({
  icon,
  label,
  value,
  hint,
  tone = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="label-caps truncate">{label}</span>
      </div>
      <p className={`num mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function TrendPill({ better, text }: { better: boolean | null; text: string }) {
  const cls =
    better === null
      ? "bg-frost text-twilight"
      : better
        ? "bg-success-soft text-success"
        : "bg-danger-soft text-danger";
  const Icon = better === null ? Minus : better ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

function TrackingPage() {
  const { id } = useParams({ from: "/suivi/$id" });
  const { data, update, newId } = useCabinet();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    state: "stable" as PatientState,
    systolic: "",
    diastolic: "",
    weight: "",
    heartRate: "",
    temperature: "",
    pain: "0",
    comment: "",
  });

  const patient = data.patients.find((p) => p.id === id);
  const analyses = useMemo(
    () => data.analyses.filter((a) => a.patientId === id).sort((a, b) => a.date.localeCompare(b.date)),
    [data.analyses, id],
  );
  const checkups = useMemo(
    () => data.checkups.filter((c) => c.patientId === id).sort((a, b) => a.date.localeCompare(b.date)),
    [data.checkups, id],
  );

  const series = useMemo(() => markerSeries(analyses), [analyses]);
  const markers = Object.keys(series);
  const [marker, setMarker] = useState<string | null>(null);
  const activeMarker = marker && series[marker] ? marker : (markers[0] ?? null);
  const points = activeMarker ? series[activeMarker]! : [];

  const global = useMemo(() => globalTrend(analyses, checkups), [analyses, checkups]);
  const last = checkups.at(-1);
  const prev = checkups.at(-2);

  const vitals = checkups.map((c) => ({
    date: fmtDate(c.date, "dd/MM/yy"),
    systolic: c.systolic ?? null,
    diastolic: c.diastolic ?? null,
    weight: c.weight ?? null,
    heartRate: c.heartRate ?? null,
    pain: c.pain ?? 0,
    score: stateMeta[c.state].score,
  }));

  const scoreData = global.scoreByDate.map((s) => ({ date: fmtDate(s.date, "dd/MM/yy"), score: s.score }));

  const radar = (analyses.at(-1)?.values ?? []).map((v) => ({
    marker: v.label,
    ratio: Math.min(Math.round((v.value / v.ref) * 100), 160),
  }));

  const statePie = states
    .map((s) => ({ name: stateMeta[s].label, value: checkups.filter((c) => c.state === s).length, color: stateMeta[s].dot }))
    .filter((s) => s.value > 0);

  if (!patient) {
    return (
      <div className="space-y-4">
        <PageHeader title="Patient introuvable" />
        <GhostButton onClick={() => navigate({ to: "/patients" })}>Retour aux patients</GhostButton>
      </div>
    );
  }

  const save = () => {
    const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
    update((d) => ({
      ...d,
      checkups: [
        ...d.checkups,
        {
          id: newId(),
          patientId: patient.id,
          date: form.date,
          state: form.state,
          ...(num(form.systolic) !== undefined ? { systolic: num(form.systolic)! } : {}),
          ...(num(form.diastolic) !== undefined ? { diastolic: num(form.diastolic)! } : {}),
          ...(num(form.weight) !== undefined ? { weight: num(form.weight)! } : {}),
          ...(num(form.heartRate) !== undefined ? { heartRate: num(form.heartRate)! } : {}),
          ...(num(form.temperature) !== undefined ? { temperature: num(form.temperature)! } : {}),
          ...(num(form.pain) !== undefined ? { pain: num(form.pain)! } : {}),
          ...(form.comment.trim() ? { comment: form.comment.trim() } : {}),
        },
      ],
    }));
    setOpen(false);
    setForm({ ...form, comment: "" });
    toast.success("Point de suivi enregistré");
  };

  const tensionDelta =
    last?.systolic !== undefined && prev?.systolic !== undefined ? last.systolic - prev.systolic : null;
  const weightDelta = last?.weight !== undefined && prev?.weight !== undefined ? last.weight - prev.weight : null;

  return (
    <ScreenTransition>
      <PageHeader
        title={`Suivi — ${patient.name}`}
        subtitle={`${patient.code} · ${checkups.length} point(s) de suivi · ${analyses.length} bilan(s)`}
        actions={
          <>
            <GhostButton onClick={() => navigate({ to: "/patients" })}>
              <ArrowLeft className="mr-1.5 inline h-4 w-4" />
              Patients
            </GhostButton>
            <Link to="/historique/$id" params={{ id: patient.id }}>
              <GhostButton>Historique</GhostButton>
            </Link>
            <PrimaryButton onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 inline h-4 w-4" />
              Point de suivi
            </PrimaryButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<Activity className="h-4 w-4" />}
          label="État actuel"
          value={stateMeta[global.state].label}
          hint={last ? `Dernier point le ${fmtDate(last.date, "dd/MM/yyyy")}` : "Aucun point de suivi"}
          tone={global.state === "mieux" ? "text-success" : global.state === "moins_bien" ? "text-danger" : ""}
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Score biologique"
          value={`${global.score}/100`}
          hint={global.delta === 0 ? "Stable" : `${global.delta > 0 ? "+" : ""}${global.delta} pts depuis le 1er bilan`}
          tone={global.delta > 0 ? "text-success" : global.delta < 0 ? "text-danger" : ""}
        />
        <Kpi
          icon={<HeartPulse className="h-4 w-4" />}
          label="Tension"
          value={last?.systolic ? `${last.systolic}/${last.diastolic ?? "—"}` : "—"}
          hint={tensionDelta === null ? "mmHg" : `${tensionDelta > 0 ? "+" : ""}${tensionDelta} mmHg vs précédent`}
          tone={tensionDelta !== null && tensionDelta < 0 ? "text-success" : tensionDelta ? "text-danger" : ""}
        />
        <Kpi
          icon={<Scale className="h-4 w-4" />}
          label="Poids"
          value={last?.weight ? `${last.weight} kg` : "—"}
          hint={weightDelta === null ? "kg" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg vs précédent`}
          tone={weightDelta !== null && weightDelta < 0 ? "text-success" : weightDelta ? "text-danger" : ""}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <p className="label-caps mb-3">Tension artérielle (mmHg)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitals}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} />
                <YAxis domain={[60, 180]} tick={AXIS} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={140} stroke="#D1495B" strokeDasharray="4 4" />
                <ReferenceLine y={90} stroke="#D1495B" strokeDasharray="4 4" />
                <Line name="Systolique" type="monotone" dataKey="systolic" stroke="#0077B6" strokeWidth={2} />
                <Line name="Diastolique" type="monotone" dataKey="diastolic" stroke="#00B4D8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="label-caps mb-3">Poids (kg) et fréquence cardiaque</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitals}>
                <defs>
                  <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0077B6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0077B6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} />
                <YAxis yAxisId="w" domain={["dataMin - 3", "dataMax + 3"]} tick={AXIS} />
                <YAxis yAxisId="hr" orientation="right" domain={[50, 110]} tick={AXIS} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  yAxisId="w"
                  name="Poids"
                  type="monotone"
                  dataKey="weight"
                  stroke="#0077B6"
                  strokeWidth={2}
                  fill="url(#wgrad)"
                />
                <Line yAxisId="hr" name="FC (bpm)" type="monotone" dataKey="heartRate" stroke="#90A4AE" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="label-caps">Marqueur biologique</p>
            <div className="flex flex-wrap gap-1.5">
              {markers.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarker(m)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    m === activeMarker ? "bg-teal text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {points.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune analyse enregistrée pour ce patient.</p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points.map((p) => ({ ...p, label: fmtDate(p.date, "dd/MM/yy") }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={AXIS} />
                    <YAxis domain={["dataMin - 0.2", "dataMax + 0.2"]} tick={AXIS} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceArea
                      y1={points[0]!.refMin ?? 0}
                      y2={points[0]!.ref}
                      fill="#2E9E6B"
                      fillOpacity={0.08}
                    />
                    <ReferenceLine y={points[0]!.ref} stroke="#8B94A3" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="value" stroke="#0077B6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Zone verte = valeurs de référence ({points[0]!.refMin !== undefined ? `${points[0]!.refMin} – ` : "≤ "}
                {points[0]!.ref} {points[0]!.unit})
              </p>
            </>
          )}
        </Card>

        <Card>
          <p className="label-caps mb-3">Score biologique par bilan (0-100)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} />
                <YAxis domain={[0, 100]} tick={AXIS} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" fill="#CAF0F8" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="score" stroke="#0077B6" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="label-caps mb-3">Douleur ressentie (0-10)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vitals}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} />
                <YAxis domain={[0, 10]} tick={AXIS} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="pain" radius={[6, 6, 0, 0]}>
                  {vitals.map((v, i) => (
                    <Cell key={i} fill={v.pain >= 7 ? "#D1495B" : v.pain >= 4 ? "#F0A202" : "#2E9E6B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="label-caps mb-3">Dernier bilan vs normes (100 % = limite)</p>
          {radar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun bilan disponible.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="marker" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <PolarRadiusAxis domain={[0, 160]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                  <Radar dataKey="ratio" stroke="#0077B6" fill="#00B4D8" fillOpacity={0.35} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <p className="label-caps mb-3">Répartition des états cliniques</p>
          {statePie.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun point de suivi.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statePie} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={3}>
                    {statePie.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <p className="label-caps mb-3">Évolution ressentie du patient</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitals}>
                <defs>
                  <linearGradient id="sgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E9E6B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2E9E6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} />
                <YAxis domain={[0, 100]} tick={AXIS} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area name="État" type="stepAfter" dataKey="score" stroke="#2E9E6B" strokeWidth={2} fill="url(#sgrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-x-auto">
        <p className="label-caps mb-3">Marqueurs — dernière valeur et tendance</p>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="label-caps text-left text-muted-foreground">
              <th className="pb-2">Marqueur</th>
              <th className="pb-2">Dernière valeur</th>
              <th className="pb-2">Référence</th>
              <th className="pb-2">Tendance</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {markers.map((m) => {
              const pts = series[m]!;
              const lastPt = pts.at(-1)!;
              const trend = markerTrend(pts);
              const ok = inRange(lastPt);
              return (
                <tr key={m}>
                  <td className="py-2.5">{m}</td>
                  <td className="num py-2.5">
                    {lastPt.value} {lastPt.unit}
                  </td>
                  <td className="num py-2.5 text-muted-foreground">
                    {lastPt.refMin !== undefined ? `${lastPt.refMin} – ${lastPt.ref}` : `≤ ${lastPt.ref}`}
                  </td>
                  <td className="py-2.5">
                    {trend ? (
                      <TrendPill
                        better={trend.better}
                        text={`${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(2)} (${trend.pct.toFixed(1)} %)`}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
                    >
                      {ok ? "Normal" : "Hors normes"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {markers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-muted-foreground">
                  Aucune analyse enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4">
        <p className="label-caps mb-3">Journal de suivi clinique</p>
        <div className="divide-y divide-border">
          {[...checkups].reverse().map((c) => (
            <div key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
              <span className="num w-28 shrink-0 text-muted-foreground">{fmtDate(c.date, "dd/MM/yyyy")}</span>
              <div className="min-w-0 flex-1">
                <p className="num text-sm">
                  {c.systolic ? `TA ${c.systolic}/${c.diastolic ?? "—"} mmHg` : ""}
                  {c.weight ? ` · ${c.weight} kg` : ""}
                  {c.heartRate ? ` · ${c.heartRate} bpm` : ""}
                  {c.temperature ? ` · ${c.temperature} °C` : ""}
                  {c.pain !== undefined ? ` · douleur ${c.pain}/10` : ""}
                </p>
                {c.comment && <p className="mt-0.5 text-sm text-muted-foreground">{c.comment}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${stateMeta[c.state].className}`}>
                {stateMeta[c.state].label}
              </span>
            </div>
          ))}
          {checkups.length === 0 && <p className="py-2 text-muted-foreground">Aucun point de suivi enregistré.</p>}
        </div>
      </Card>

      <Card className="mt-4 overflow-x-auto">
        <p className="label-caps mb-3">Bilans enregistrés</p>
        <table className="w-full min-w-[520px] text-sm">
          <tbody className="divide-y divide-border">
            {[...analyses].reverse().map((a) => (
              <tr key={a.id}>
                <td className="num w-28 py-2.5 align-top text-muted-foreground">{fmtDate(a.date, "dd/MM/yyyy")}</td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {a.values.map((v) => (
                      <span
                        key={v.label}
                        className={`num rounded-full px-2 py-0.5 text-xs ${
                          inRange(v) ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                        }`}
                      >
                        {v.label} {v.value} {v.unit}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="num w-20 py-2.5 text-right align-top">
                  {analysisScore(a.values.map((v) => ({ ...v, date: a.date })))}/100
                </td>
              </tr>
            ))}
            {analyses.length === 0 && (
              <tr>
                <td className="py-3 text-muted-foreground">Aucun bilan enregistré.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau point de suivi">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Date
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="text-sm">
            État du patient
            <select
              className={inputCls}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value as PatientState })}
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {stateMeta[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Tension systolique (mmHg)
            <input
              type="number"
              className={inputCls}
              value={form.systolic}
              onChange={(e) => setForm({ ...form, systolic: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Tension diastolique (mmHg)
            <input
              type="number"
              className={inputCls}
              value={form.diastolic}
              onChange={(e) => setForm({ ...form, diastolic: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Poids (kg)
            <input
              type="number"
              step="0.1"
              className={inputCls}
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Fréquence cardiaque (bpm)
            <input
              type="number"
              className={inputCls}
              value={form.heartRate}
              onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Température (°C)
            <input
              type="number"
              step="0.1"
              className={inputCls}
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Douleur (0-10)
            <input
              type="number"
              min={0}
              max={10}
              className={inputCls}
              value={form.pain}
              onChange={(e) => setForm({ ...form, pain: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Commentaire
            <textarea
              rows={3}
              className={inputCls}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={save}>Enregistrer</PrimaryButton>
        </div>
      </Modal>

      <div className="mt-4">
        <Link to="/suivi" className="inline-flex items-center gap-1 text-sm text-teal hover:underline">
          Voir le suivi de tous les patients <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </ScreenTransition>
  );
}
