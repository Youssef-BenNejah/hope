import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Download,
  FileUp,
  FlaskConical,
  History,
  Paperclip,
  Pencil,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCabinet } from "@/lib/cabinet/store";
import type { AnalysisValue, CnamFiliere, IcdCode, NoteAttachment } from "@/lib/cabinet/types";
import { ageFrom, fmtDate, sexLabel, statusMeta, today } from "@/lib/cabinet/utils";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "./Modal";
import { IcdPicker } from "./IcdPicker";
import { DiagnosticModal } from "./DiagnosticModal";
import { DiagnosticReportView } from "./DiagnosticReportView";

const tabs = ["Aperçu", "Fiche", "Historique", "Consultations", "Notes", "Analyses", "Certificats"] as const;
type Tab = (typeof tabs)[number];
const sectionId = (t: Tab) => `patient-section-${tabs.indexOf(t)}`;

const cnamFiliereLabels: Record<CnamFiliere, string> = {
  N: "Non conventionné",
  P: "Filière publique",
  R: "Remboursement",
  MF: "Médecin de famille",
};

type TimelineItem = {
  id: string;
  date: string;
  time?: string;
  label: string;
  badge: string;
  badgeClass: string;
};

function HistoryList({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return <p className="text-muted-foreground">Aucun élément enregistré.</p>;
  return (
    <div className="divide-y divide-border">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-4 py-3">
          <span className="num w-32 shrink-0 text-muted-foreground">
            {fmtDate(it.date, "dd/MM/yyyy")} {it.time ?? ""}
          </span>
          <span className="flex-1">{it.label}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs ${it.badgeClass}`}>{it.badge}</span>
        </div>
      ))}
    </div>
  );
}


export function PatientDrawer({ patientId, onClose }: { patientId: string | null; onClose: () => void }) {
  const { data, update, newId, currentUser } = useCabinet();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Aperçu");
  const [note, setNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [files, setFiles] = useState<NoteAttachment[]>([]);
  const [structured, setStructured] = useState(false);
  const [visit, setVisit] = useState({ motif: "", exam: "", diagnosis: "", plan: "" });
  const [icd, setIcd] = useState<IcdCode[]>([]);
  const [labOpen, setLabOpen] = useState(false);
  const [labDate, setLabDate] = useState(today());
  const [labRows, setLabRows] = useState<{ label: string; value: string; unit: string; ref: string; refMin: string }[]>([
    { label: "", value: "", unit: "", ref: "", refMin: "" },
  ]);

  const [diag, setDiag] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [chronic, setChronic] = useState("");
  const [allergyEdit, setAllergyEdit] = useState(false);
  const [allergyValue, setAllergyValue] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importState, setImportState] = useState<"idle" | "loading" | "done">("idle");
  const [scan, setScan] = useState<"idle" | "loading" | "ready">("idle");

  useEffect(() => {
    if (!patientId) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible[0]) return;
        const idx = tabs.findIndex((t) => sectionId(t) === visible[0]!.target.id);
        if (idx >= 0) setTab(tabs[idx]!);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    tabs.forEach((t) => {
      const el = document.getElementById(sectionId(t));
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [patientId]);

  const patient = data.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const visits = data.appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const notes = data.notes.filter((n) => n.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const analyses = data.analyses.filter((a) => a.patientId === patient.id).sort((a, b) => a.date.localeCompare(b.date));
  const prescriptions = data.prescriptions
    .filter((r) => r.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const certs = data.certificates.filter((c) => c.patientId === patient.id);
  const diagnostics = data.diagnostics
    .filter((x) => x.patientId === patient.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const timeline: TimelineItem[] = [
    ...visits.map((v) => ({
      id: `v-${v.id}`,
      date: v.date,
      time: v.time,
      label: v.reason,
      badge: statusMeta[v.status].label,
      badgeClass: statusMeta[v.status].className,
    })),
    ...notes.map((n) => ({
      id: `n-${n.id}`,
      date: n.date,
      label: n.text || "Note de consultation",
      badge: "Note",
      badgeClass: "bg-frost text-twilight",
    })),
    ...certs.map((c) => ({
      id: `c-${c.id}`,
      date: c.documentDate,
      label: c.type,
      badge: "Certificat",
      badgeClass: "bg-frost text-twilight",
    })),
  ].sort((a: TimelineItem, b: TimelineItem) => (b.date + (b.time ?? "")).localeCompare(a.date + (a.time ?? "")));

  const glycemia = analyses
    .map((a) => ({ date: fmtDate(a.date, "dd/MM"), value: a.values.find((v) => v.label === "Glycémie")?.value }))
    .filter((r) => typeof r.value === "number");


  const runImport = () => {
    setImportState("loading");
    window.setTimeout(() => {
      update((d) => ({
        ...d,
        appointments: [
          ...d.appointments,
          ...[90, 150, 210, 300].map((off, i) => ({
            id: newId(),
            patientId: patient.id,
            date: fmtDate(new Date(Date.now() - off * 86400000).toISOString().slice(0, 10), "yyyy-MM-dd"),
            time: `1${i}:00`,
            reason: "Consultation (dossier importé)",
            status: "done" as const,
          })),
        ],
        prescriptions: [
          ...d.prescriptions,
          { id: newId(), patientId: patient.id, date: today(), text: "Paracétamol 1g — 3x/j (importé)" },
          { id: newId(), patientId: patient.id, date: today(), text: "Vitamine D 100 000 UI (importé)" },
        ],
        notes: [
          ...d.notes,
          { id: newId(), patientId: patient.id, date: today(), text: "Note importée depuis l'ancien dossier." },
        ],
      }));
      setImportState("done");
      toast.success("Dossier importé");
    }, 1500);
  };

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const exportPdf = () => {
    const s = data.settings;
    const rows = (items: string[][]) =>
      items.length
        ? items.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="3">—</td></tr>`;
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Dossier ${esc(patient.name)}</title>
<style>
@page{size:A4;margin:18mm}
body{font-family:Arial,Helvetica,sans-serif;color:#0B1220;font-size:12px}
h1{font-size:18px;margin:0 0 2px}h2{font-size:13px;margin:22px 0 6px;color:#0077B6;text-transform:uppercase;letter-spacing:.06em}
.head{border-bottom:2px solid #0077B6;padding-bottom:10px;margin-bottom:18px}
.muted{color:#5B6472;font-size:11px}
table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #E2E8F0;padding:5px 4px;text-align:left;vertical-align:top}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px}
</style></head><body>
<div class="head"><h1>${esc(s.doctorName)}</h1>
<p class="muted">${esc(s.specialty)} — ${esc(s.address)}<br>Tél. ${esc(s.phone ?? "")} · N° d'ordre : ${esc(s.licenseNumber)}</p></div>
<h1>Dossier médical — ${esc(patient.name)}</h1>
<p class="muted">Identifiant ${esc(patient.code)} · Édité le ${fmtDate(today())}</p>
<h2>Identité</h2>
<div class="grid">
<div><b>Téléphone :</b> ${esc(patient.phone || "—")}</div>
<div><b>Naissance :</b> ${patient.birthDate ? fmtDate(patient.birthDate) : "—"}</div>
<div><b>Pays :</b> ${esc(patient.country || "—")}</div>
<div><b>Couverture :</b> ${patient.coverage === "assurance" ? `Assurance ${esc(patient.insurer || "")}` : patient.coverage === "aucune" ? "Aucune" : `CNAM ${esc(patient.cnam || "")}`}</div>
<div><b>Allergies :</b> ${esc(patient.allergies.join(", ") || "Aucune connue")}</div>
<div><b>Antécédents :</b> ${esc(patient.chronic.join(", ") || "—")}</div>
</div>
<h2>Historique des consultations</h2>
<table>${rows(visits.map((v) => [`${fmtDate(v.date, "dd/MM/yyyy")} ${v.time}`, v.reason, statusMeta[v.status].label]))}</table>
<h2>Notes</h2>
<table>${rows(notes.map((n) => [fmtDate(n.date, "dd/MM/yyyy"), n.text || "—", `${n.attachments?.length ?? 0} pièce(s) jointe(s)`]))}</table>
<h2>Analyses</h2>
<table>${rows(analyses.map((a) => [fmtDate(a.date, "dd/MM/yyyy"), a.values.map((v) => `${v.label} : ${v.value} ${v.unit}`).join(" · "), ""]))}</table>
<h2>Certificats</h2>
<table>${rows(certs.map((c) => [fmtDate(c.documentDate, "dd/MM/yyyy"), c.type, ""]))}</table>
</body></html>`;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) {
      toast.error("Autorisez les fenêtres contextuelles pour exporter le dossier");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => w.print(), 300);
    toast.success("Dossier prêt — choisissez « Enregistrer au format PDF »");
  };

  const patchPatient = (patch: Partial<typeof patient>) => {
    update((d) => ({
      ...d,
      patients: d.patients.map((p) => (p.id === patient.id ? { ...p, ...patch } : p)),
    }));
  };

  const toggleCnamFiliere = (k: CnamFiliere) => {
    const cur = patient.cnamFiliere || [];
    patchPatient({ cnamFiliere: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] });
  };

  const ficheNotes = [...(patient.ficheNotes || [])].sort((a, b) => a.date.localeCompare(b.date));

  const addFicheNote = () => {
    patchPatient({ ficheNotes: [...(patient.ficheNotes || []), { id: newId(), date: today(), text: "" }] });
  };
  const updateFicheNote = (id: string, patch: Partial<{ date: string; text: string }>) => {
    patchPatient({
      ficheNotes: (patient.ficheNotes || []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
  };
  const removeFicheNote = (id: string) => {
    patchPatient({ ficheNotes: (patient.ficheNotes || []).filter((n) => n.id !== id) });
  };

  const printFiche = () => {
    const s = data.settings;
    const box = (checked: boolean) => (checked ? "&#9746;" : "&#9744;");
    const blankRows = Math.max(0, 12 - ficheNotes.length);
    const rowsHtml = [
      ...ficheNotes.map((n) => `<tr><td class="d">${esc(n.date ? fmtDate(n.date, "dd/MM/yyyy") : "")}</td><td>${esc(n.text)}</td></tr>`),
      ...Array.from({ length: blankRows }, () => `<tr><td class="d">&nbsp;</td><td>&nbsp;</td></tr>`),
    ].join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche — ${esc(patient.name)}</title>
<style>
@page{size:A4;margin:16mm}
*{box-sizing:border-box}
body{font-family:Georgia,"Times New Roman",serif;color:#0B1220;font-size:13px}
.card{border:1.5px solid #0B1220;padding:16px 20px}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #0B1220;padding-bottom:10px;margin-bottom:14px}
.head .name{font-weight:bold;font-size:15px}
.head .spec{font-size:12px}
.head .num{font-size:12px;white-space:nowrap}
.row{display:flex;gap:24px;margin-bottom:10px}
.f{flex:1;border-bottom:1px dotted #5B6472;padding-bottom:3px}
.f .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#5B6472;margin-right:6px}
.cnam{display:flex;align-items:center;gap:6px;border:1px solid #0B1220;padding:8px 10px;margin:14px 0}
.cnam b{font-size:11px;text-transform:uppercase;margin-right:8px}
.cnam span{margin-right:16px;font-size:12.5px;white-space:nowrap}
table{width:100%;border-collapse:collapse;margin-top:6px}
th{border:1px solid #0B1220;background:#F1F5F9;font-size:11px;text-transform:uppercase;padding:5px}
td{border:1px solid #0B1220;padding:6px 8px;font-size:12px;vertical-align:top;height:22px}
td.d{width:100px;white-space:nowrap}
</style></head><body>
<div class="card">
  <div class="head">
    <div><div class="name">${esc(s.doctorName)}</div><div class="spec">${esc(s.specialty)}</div></div>
    <div class="num">FICHE N° : ${esc(patient.fileNumber || patient.code)}</div>
  </div>
  <div class="row"><div class="f"><span class="lbl">Nom &amp; prénom</span>${esc(patient.name)}</div></div>
  <div class="row">
    <div class="f"><span class="lbl">Né(e) le</span>${patient.birthDate ? esc(fmtDate(patient.birthDate)) : ""}</div>
    <div class="f"><span class="lbl">Profession</span>${esc(patient.profession || "")}</div>
  </div>
  <div class="row">
    <div class="f"><span class="lbl">Adresse</span>${esc(patient.address || "")}</div>
    <div class="f"><span class="lbl">Tél</span>${esc(patient.phone || "")}</div>
  </div>
  <div class="cnam">
    <b>CNAM</b>
    ${(["N", "P", "R", "MF"] as CnamFiliere[])
      .map((k) => `<span>${box(!!patient.cnamFiliere?.includes(k))} ${k}</span>`)
      .join("")}
  </div>
  <table>
    <thead><tr><th>Date</th><th>Observations</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>
</body></html>`;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) {
      toast.error("Autorisez les fenêtres contextuelles pour générer le PDF");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => w.print(), 350);
    toast.success("Fenêtre d'impression ouverte — choisissez « Enregistrer au format PDF »");
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[#03045E]/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="shrink-0 border-b border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Retour"
              className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold sm:text-xl">{patient.name}</h2>
              <p className="num truncate text-xs text-muted-foreground sm:text-sm">
                <span className="font-semibold text-teal">{patient.code}</span> · {patient.phone}
              </p>
            </div>
            <button onClick={onClose} aria-label="Fermer" className="shrink-0 rounded-md p-2 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PrimaryButton onClick={exportPdf}>
              <Download className="h-4 w-4" /> Exporter en PDF
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                setImportState("idle");
                setImportOpen(true);
              }}
            >
              <FileUp className="h-4 w-4" /> Import de dossier
            </GhostButton>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-border sm:flex-wrap sm:overflow-visible">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  const el = document.getElementById(sectionId(t));
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${
                  tab === t ? "border-teal font-medium text-teal" : "border-transparent text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-10 overflow-y-auto p-4 pt-5 text-sm sm:p-6 sm:pt-5">
          {patient.allergies.length > 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="flex-1">Allergies : {patient.allergies.join(", ")}</span>
              <button onClick={() => setAllergyEdit(true)} aria-label="Modifier les allergies">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAllergyEdit(true)}
              className="w-full rounded-lg border border-dashed border-border-strong px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              Aucune allergie connue — Ajouter
            </button>
          )}
          <section id={sectionId("Aperçu")} className="scroll-mt-14">
            <h3 className="label-caps mb-3 text-teal">Aperçu</h3>
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Identifiant", patient.code],
                  ["Nom", patient.name],
                  ["Téléphone", patient.phone],
                  ["Date de naissance", patient.birthDate ? fmtDate(patient.birthDate) : "Non renseignée"],
                  ["Pays", patient.country || "Non renseigné"],
                  [
                    "Couverture",
                    patient.coverage === "assurance"
                      ? "Assurance privée"
                      : patient.coverage === "aucune"
                        ? "Aucune"
                        : "CNAM",
                  ],
                  patient.coverage === "assurance"
                    ? ["Assurance", patient.insurer || "Non renseignée"]
                    : ["Numéro CNAM", patient.cnam || "Non renseigné"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="label-caps">{k}</dt>
                    <dd className="mt-1 num">{v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <p className="label-caps mb-2">Antécédents et traitements en cours</p>
                <div className="flex flex-wrap items-center gap-2">
                  {patient.chronic.map((c) => (
                    <span key={c} className="rounded-full bg-frost px-3 py-1 text-xs text-twilight">
                      {c}
                    </span>
                  ))}
                  {patient.chronic.length === 0 && <span className="text-muted-foreground">Aucun antécédent noté</span>}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="Ajouter un antécédent"
                    value={chronic}
                    onChange={(e) => setChronic(e.target.value)}
                  />
                  <PrimaryButton
                    onClick={() => {
                      if (!chronic.trim()) return;
                      update(
                        (d) => ({
                          ...d,
                          patients: d.patients.map((p) =>
                            p.id === patient.id ? { ...p, chronic: [...p.chronic, chronic] } : p,
                          ),
                        }),
                        `Antécédent ajouté — ${patient.name}`,
                      );
                      setChronic("");
                      toast.success("Antécédent ajouté");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="label-caps">Prescriptions récentes</p>
                  <Link
                    to="/ordonnances"
                    search={{ patient: patient.id }}
                    className="inline-flex items-center gap-1 text-xs text-teal hover:underline"
                  >
                    <Pill className="h-3.5 w-3.5" /> Nouvelle / renouveler
                  </Link>
                </div>
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune ordonnance enregistrée.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {prescriptions.slice(0, 4).map((r) => (
                      <li key={r.id} className="flex items-start gap-2">
                        <span className="num shrink-0 text-xs text-muted-foreground">
                          {fmtDate(r.date, "dd/MM/yy")}
                        </span>
                        <span className="min-w-0 flex-1">{r.text.split("\n")[0]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section id={sectionId("Fiche")} className="scroll-mt-14">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="label-caps text-teal">Fiche patient</h3>
              <PrimaryButton onClick={printFiche}>
                <Download className="h-4 w-4" /> Exporter en PDF
              </PrimaryButton>
            </div>
            <div className="rounded-xl border-2 border-foreground/80 p-4 font-serif sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-foreground/60 pb-3">
                <div>
                  <p className="font-bold">{data.settings.doctorName}</p>
                  <p className="text-sm">{data.settings.specialty}</p>
                </div>
                <label className="flex items-center gap-1.5 text-sm">
                  <span className="num shrink-0">FICHE N° :</span>
                  <input
                    className="num w-32 border-b border-dotted border-muted-foreground bg-transparent px-1 py-0.5 outline-none focus:border-teal"
                    placeholder={patient.code}
                    defaultValue={patient.fileNumber || ""}
                    onBlur={(e) => patchPatient({ fileNumber: e.target.value.trim() })}
                  />
                </label>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block border-b border-dotted border-muted-foreground pb-1">
                  <span className="label-caps mr-2">Nom &amp; prénom</span>
                  <input
                    className="w-full bg-transparent outline-none"
                    defaultValue={patient.name}
                    onBlur={(e) => {
                      if (e.target.value.trim()) patchPatient({ name: e.target.value.trim() });
                      else e.target.value = patient.name;
                    }}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block border-b border-dotted border-muted-foreground pb-1">
                    <span className="label-caps mr-2">Né(e) le</span>
                    <input
                      type="date"
                      className="num bg-transparent outline-none"
                      defaultValue={patient.birthDate || ""}
                      onBlur={(e) => patchPatient({ birthDate: e.target.value })}
                    />
                  </label>
                  <label className="block border-b border-dotted border-muted-foreground pb-1">
                    <span className="label-caps mr-2">Profession</span>
                    <input
                      className="w-[60%] bg-transparent outline-none"
                      defaultValue={patient.profession || ""}
                      onBlur={(e) => patchPatient({ profession: e.target.value.trim() })}
                    />
                  </label>
                  <label className="block border-b border-dotted border-muted-foreground pb-1">
                    <span className="label-caps mr-2">Adresse</span>
                    <input
                      className="w-[60%] bg-transparent outline-none"
                      defaultValue={patient.address || ""}
                      onBlur={(e) => patchPatient({ address: e.target.value.trim() })}
                    />
                  </label>
                  <label className="block border-b border-dotted border-muted-foreground pb-1">
                    <span className="label-caps mr-2">Tél</span>
                    <input
                      className="num w-[60%] bg-transparent outline-none"
                      defaultValue={patient.phone || ""}
                      onBlur={(e) => patchPatient({ phone: e.target.value.trim() })}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-foreground/60 px-3 py-2.5">
                  <span className="label-caps">CNAM</span>
                  {(["N", "P", "R", "MF"] as CnamFiliere[]).map((k) => (
                    <label
                      key={k}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-sm"
                      title={cnamFiliereLabels[k]}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!patient.cnamFiliere?.includes(k)}
                        onChange={() => toggleCnamFiliere(k)}
                      />
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
                          patient.cnamFiliere?.includes(k)
                            ? "border-teal bg-teal text-white"
                            : "border-muted-foreground"
                        }`}
                      >
                        {patient.cnamFiliere?.includes(k) ? "✓" : ""}
                      </span>
                      {k}
                    </label>
                  ))}
                </div>
                <table className="mt-2 w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-foreground/60 px-2 py-1.5 text-left text-xs uppercase">Date</th>
                      <th className="border border-foreground/60 px-2 py-1.5 text-left text-xs uppercase">
                        Observations
                      </th>
                      <th className="w-8 border border-foreground/60" />
                    </tr>
                  </thead>
                  <tbody>
                    {ficheNotes.length === 0 ? (
                      <tr>
                        <td className="num border border-foreground/60 px-2 py-2 text-muted-foreground" colSpan={3}>
                          Aucune observation — utilisez « Ajouter une ligne » ci-dessous
                        </td>
                      </tr>
                    ) : (
                      ficheNotes.map((n) => (
                        <tr key={n.id}>
                          <td className="border border-foreground/60 p-0 align-top">
                            <input
                              type="date"
                              className="num w-full bg-transparent px-2 py-1.5 outline-none"
                              defaultValue={n.date}
                              onBlur={(e) => updateFicheNote(n.id, { date: e.target.value })}
                            />
                          </td>
                          <td className="border border-foreground/60 p-0 align-top">
                            <textarea
                              className="min-h-9 w-full resize-y bg-transparent px-2 py-1.5 outline-none"
                              defaultValue={n.text}
                              placeholder="Observation…"
                              onBlur={(e) => updateFicheNote(n.id, { text: e.target.value })}
                            />
                          </td>
                          <td className="border border-foreground/60 p-0 text-center align-top">
                            <button
                              onClick={() => removeFicheNote(n.id)}
                              aria-label="Supprimer la ligne"
                              className="p-1.5 text-muted-foreground hover:text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <GhostButton onClick={addFicheNote}>
                  <Plus className="h-4 w-4" /> Ajouter une ligne
                </GhostButton>
              </div>
            </div>
          </section>

          <section id={sectionId("Historique")} className="scroll-mt-14">
            <h3 className="label-caps mb-3 text-teal">Historique</h3>
            <HistoryList items={timeline.slice(0, 6)} />
            {timeline.length > 6 && (
              <div className="mt-3">
                <GhostButton onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4" /> Voir tout l'historique ({timeline.length})
                </GhostButton>
              </div>
            )}
          </section>

          <section id={sectionId("Consultations")} className="scroll-mt-14">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="label-caps text-teal">Consultations</h3>
              <GhostButton onClick={() => setDiag({ open: true, id: null })}>
                <ClipboardList className="h-4 w-4" /> Nouvelle consultation
              </GhostButton>
            </div>
            {diagnostics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune consultation. Démarrez une anamnèse dirigée : le brouillon reste modifiable et visible ici.
              </p>
            ) : (
              <div className="space-y-2">
                {diagnostics.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setDiag({ open: true, id: x.id })}
                    className="flex w-full flex-col gap-1 rounded-lg border border-border p-3 text-left transition-colors hover:border-teal hover:bg-cyan/30 dark:hover:bg-muted"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="num text-sm font-medium">{fmtDate(x.date, "dd/MM/yyyy")}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          x.status === "brouillon"
                            ? "bg-warning-soft text-warning"
                            : "bg-success-soft text-success"
                        }`}
                      >
                        {x.status === "brouillon" ? "Brouillon" : "Terminé"}
                      </span>
                    </div>
                    {x.reason && <p className="text-sm font-medium">{x.reason}</p>}
                    {x.content && <DiagnosticReportView content={x.content} maxLines={3} className="text-xs" />}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section id={sectionId("Notes")} className="scroll-mt-14">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="label-caps text-teal">Notes de consultation</h3>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[#0077B6]"
                  checked={structured}
                  onChange={(e) => setStructured(e.target.checked)}
                />
                Consultation structurée
              </label>
            </div>
            <div className="space-y-4">
              {structured && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                  <Field label="Motif de consultation">
                    <input
                      className={inputCls}
                      value={visit.motif}
                      onChange={(e) => setVisit({ ...visit, motif: e.target.value })}
                    />
                  </Field>
                  <Field label="Examen clinique">
                    <textarea
                      className={`${inputCls} min-h-20`}
                      value={visit.exam}
                      onChange={(e) => setVisit({ ...visit, exam: e.target.value })}
                    />
                  </Field>
                  <Field label="Diagnostic">
                    <input
                      className={inputCls}
                      value={visit.diagnosis}
                      onChange={(e) => setVisit({ ...visit, diagnosis: e.target.value })}
                    />
                  </Field>
                  <div>
                    <span className="label-caps mb-1.5 block">Codes CIM-10</span>
                    <IcdPicker value={icd} onChange={setIcd} />
                  </div>
                  <Field label="Conduite à tenir">
                    <textarea
                      className={`${inputCls} min-h-20`}
                      value={visit.plan}
                      onChange={(e) => setVisit({ ...visit, plan: e.target.value })}
                    />
                  </Field>
                </div>
              )}
              <textarea
                className={`${inputCls} min-h-24`}
                placeholder={structured ? "Synthèse ou remarques libres (facultatif)…" : "Nouvelle note de consultation…"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-frost hover:text-twilight">
                  <Paperclip className="h-4 w-4" /> Joindre un fichier (photo, PDF…)
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      const read = await Promise.all(
                        files.map(
                          (f) =>
                            new Promise<{ id: string; name: string; type: string; dataUrl: string }>((res) => {
                              const r = new FileReader();
                              r.onload = () =>
                                res({ id: newId(), name: f.name, type: f.type, dataUrl: String(r.result) });
                              r.readAsDataURL(f);
                            }),
                        ),
                      );
                      setFiles((prev) => [...prev, ...read]);
                      e.target.value = "";
                      if (read.length) toast.success(`${read.length} fichier(s) joint(s)`);
                    }}
                  />
                </label>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f) => (
                      <span
                        key={f.id}
                        className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs"
                      >
                        {f.type.startsWith("image/") ? (
                          <img src={f.dataUrl} alt={f.name} className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <FileUp className="h-4 w-4 text-teal" />
                        )}
                        {f.name}
                        <button onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <PrimaryButton
                onClick={() => {
                  const hasStructured =
                    structured &&
                    (visit.motif.trim() || visit.exam.trim() || visit.diagnosis.trim() || visit.plan.trim() || icd.length);
                  if (!note.trim() && files.length === 0 && !hasStructured) return;
                  update(
                    (d) => ({
                      ...d,
                      notes: [
                        ...d.notes,
                        {
                          id: newId(),
                          patientId: patient.id,
                          date: today(),
                          text: note,
                          attachments: files,
                          ...(hasStructured
                            ? {
                                ...(visit.motif.trim() ? { motif: visit.motif.trim() } : {}),
                                ...(visit.exam.trim() ? { exam: visit.exam.trim() } : {}),
                                ...(visit.diagnosis.trim() ? { diagnosis: visit.diagnosis.trim() } : {}),
                                ...(visit.plan.trim() ? { plan: visit.plan.trim() } : {}),
                                ...(icd.length ? { icd } : {}),
                                ...(currentUser ? { authorId: currentUser.id } : {}),
                              }
                            : {}),
                        },
                      ],
                    }),
                    `${hasStructured ? "Consultation" : "Note"} — ${patient.name}`,
                  );
                  setNote("");
                  setFiles([]);
                  setVisit({ motif: "", exam: "", diagnosis: "", plan: "" });
                  setIcd([]);
                  toast.success(hasStructured ? "Consultation enregistrée" : "Note enregistrée");
                }}
              >
                Enregistrer
              </PrimaryButton>
              <div className="border-l border-border pl-5">
                {notes.map((n) => (
                  <div key={n.id} className="relative pb-5">
                    <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-surf" />
                    <p className="num text-xs text-muted-foreground">{fmtDate(n.date)}</p>
                    {(n.motif || n.exam || n.diagnosis || n.plan || n.icd?.length) && (
                      <dl className="mt-1 space-y-1 rounded-lg bg-muted/40 p-2.5 text-sm">
                        {n.motif && (
                          <div>
                            <dt className="label-caps">Motif</dt>
                            <dd>{n.motif}</dd>
                          </div>
                        )}
                        {n.exam && (
                          <div>
                            <dt className="label-caps">Examen</dt>
                            <dd className="whitespace-pre-wrap">{n.exam}</dd>
                          </div>
                        )}
                        {n.diagnosis && (
                          <div>
                            <dt className="label-caps">Diagnostic</dt>
                            <dd>
                              {n.diagnosis}
                              {n.icd?.length ? (
                                <span className="num ml-2 text-xs text-muted-foreground">
                                  {n.icd.map((c) => c.code).join(", ")}
                                </span>
                              ) : null}
                            </dd>
                          </div>
                        )}
                        {n.plan && (
                          <div>
                            <dt className="label-caps">Conduite à tenir</dt>
                            <dd className="whitespace-pre-wrap">{n.plan}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                    {n.text && <p className="mt-1">{n.text}</p>}
                    {n.attachments && n.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {n.attachments.map((f) => (
                          <a
                            key={f.id}
                            href={f.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={f.name}
                            className="group relative flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-frost hover:text-twilight"
                          >
                            {f.type.startsWith("image/") ? (
                              <img src={f.dataUrl} alt={f.name} className="h-10 w-10 rounded object-cover" />
                            ) : (
                              <FileUp className="h-4 w-4 text-teal" />
                            )}
                            <span className="max-w-[180px] truncate">{f.name}</span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                update((d) => ({
                                  ...d,
                                  notes: d.notes.map((note) => {
                                    if (note.id !== n.id) return note;
                                    const remaining = note.attachments?.filter((a) => a.id !== f.id) ?? [];
                                    const { attachments, ...rest } = note;
                                    return remaining.length ? { ...rest, attachments: remaining } : rest;
                                  }),
                                }));
                                toast.success("Fichier supprimé");
                              }}
                              className="ml-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                              aria-label="Supprimer le fichier"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {notes.length === 0 && <p className="text-muted-foreground">Aucune note pour ce patient.</p>}
              </div>
            </div>
          </section>


          <section id={sectionId("Analyses")} className="scroll-mt-14">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="label-caps text-teal">Analyses</h3>
              <div className="flex gap-2">
                <GhostButton
                  onClick={() => {
                    setLabDate(today());
                    setLabRows([{ label: "", value: "", unit: "", ref: "", refMin: "" }]);
                    setLabOpen(true);
                  }}
                >
                  <FlaskConical className="h-4 w-4" /> Saisir un bilan
                </GhostButton>
              </div>
            </div>
            <div className="space-y-5">
              <button
                onClick={() => {
                  setScan("loading");
                  window.setTimeout(() => setScan("ready"), 1400);
                }}
                className="w-full rounded-xl border-2 border-dashed border-border-strong px-6 py-8 text-center text-muted-foreground hover:border-teal hover:text-teal"
              >
                Glissez un fichier ou une photo d'analyse, ou cliquez pour sélectionner
              </button>
              {scan === "loading" && (
                <div>
                  <p className="text-sm">Lecture du document en cours…</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 animate-softpulse rounded-full bg-surf" />
                  </div>
                </div>
              )}
              {scan === "ready" && (
                <div className="rounded-lg border border-border p-4">
                  <p className="label-caps mb-2">Valeurs extraites</p>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1">Glycémie</td>
                        <td className="num py-1 text-right">1.05 g/L</td>
                      </tr>
                      <tr>
                        <td className="py-1">Cholestérol total</td>
                        <td className="num py-1 text-right">1.90 g/L</td>
                      </tr>
                    </tbody>
                  </table>
                  <PrimaryButton
                    className="mt-3"
                    onClick={() => {
                      update((d) => ({
                        ...d,
                        analyses: [
                          ...d.analyses,
                          {
                            id: newId(),
                            patientId: patient.id,
                            date: today(),
                            values: [
                              { label: "Glycémie", value: 1.05, unit: "g/L", ref: 1.1 },
                              { label: "Cholestérol total", value: 1.9, unit: "g/L", ref: 2 },
                            ],
                          },
                        ],
                      }));
                      setScan("idle");
                      toast.success("Analyse ajoutée au dossier");
                    }}
                  >
                    Confirmer et ajouter au dossier
                  </PrimaryButton>
                </div>
              )}

              {glycemia.length >= 2 && (
                <div className="rounded-lg border border-border p-4">
                  <p className="label-caps mb-3">Évolution de la glycémie (g/L)</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={glycemia}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <YAxis domain={[0.8, 1.6]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <Tooltip
                          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                        />
                        <ReferenceLine y={1.1} stroke="#8B94A3" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="value" stroke="#0077B6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {analyses.length === 0 && <p className="text-muted-foreground">Aucune analyse enregistrée.</p>}
            </div>
          </section>

          <section id={sectionId("Certificats")} className="scroll-mt-14 pb-10">
            <h3 className="label-caps mb-3 text-teal">Certificats</h3>
            <div className="space-y-3">
              {certs.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <span>{c.type}</span>
                  <span className="num text-muted-foreground">{fmtDate(c.documentDate)}</span>
                </div>
              ))}
              {certs.length === 0 && <p className="text-muted-foreground">Aucun certificat émis pour ce patient.</p>}
              <PrimaryButton onClick={() => navigate({ to: "/certificats", search: { patient: patient.id } })}>
                <Plus className="h-4 w-4" /> Nouveau certificat
              </PrimaryButton>
            </div>
          </section>
        </div>
      </aside>

      <Modal open={allergyEdit} onClose={() => setAllergyEdit(false)} title="Allergies" width="max-w-md">
        <input
          className={inputCls}
          placeholder="Séparer par des virgules"
          defaultValue={patient.allergies.join(", ")}
          onChange={(e) => setAllergyValue(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setAllergyEdit(false)}>Annuler</GhostButton>
          <PrimaryButton
            onClick={() => {
              const list = (allergyValue || patient.allergies.join(", "))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              update((d) => ({
                ...d,
                patients: d.patients.map((p) => (p.id === patient.id ? { ...p, allergies: list } : p)),
              }));
              setAllergyEdit(false);
              toast.success("Allergies mises à jour");
            }}
          >
            Enregistrer
          </PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Historique complet — ${patient.name}`}
        width="max-w-3xl"
      >
        <HistoryList items={timeline} />
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import de dossier existant">
        {importState === "done" ? (
          <p className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
            4 consultations, 2 ordonnances et 1 note importées avec succès.
          </p>
        ) : (
          <>
            <button
              onClick={runImport}
              disabled={importState === "loading"}
              className="w-full rounded-xl border-2 border-dashed border-border-strong px-6 py-10 text-center text-sm text-muted-foreground hover:border-teal hover:text-teal"
            >
              Glissez un export PDF/CSV d'un ancien dossier, ou d'un autre logiciel
            </button>
            {importState === "loading" && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/2 animate-softpulse rounded-full bg-surf" />
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={labOpen} onClose={() => setLabOpen(false)} title="Saisir un bilan biologique" width="max-w-2xl">
        <Field label="Date du prélèvement">
          <input
            type="date"
            className={`${inputCls} num w-48`}
            value={labDate}
            onChange={(e) => setLabDate(e.target.value)}
          />
        </Field>
        <div className="mt-4 space-y-2">
          <div className="hidden grid-cols-[1fr_80px_70px_70px_70px_32px] gap-2 sm:grid">
            {["Marqueur", "Valeur", "Unité", "Réf. max", "Réf. min", ""].map((h) => (
              <span key={h} className="label-caps">
                {h}
              </span>
            ))}
          </div>
          {labRows.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_80px_70px_70px_70px_32px]">
              <input
                className={inputCls}
                placeholder="Glycémie"
                value={r.label}
                onChange={(e) =>
                  setLabRows((rows) => rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                placeholder="1.05"
                value={r.value}
                onChange={(e) =>
                  setLabRows((rows) => rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
              />
              <input
                className={inputCls}
                placeholder="g/L"
                value={r.unit}
                onChange={(e) =>
                  setLabRows((rows) => rows.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))
                }
              />
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                placeholder="1.1"
                value={r.ref}
                onChange={(e) => setLabRows((rows) => rows.map((x, j) => (j === i ? { ...x, ref: e.target.value } : x)))}
              />
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                placeholder="0.7"
                value={r.refMin}
                onChange={(e) =>
                  setLabRows((rows) => rows.map((x, j) => (j === i ? { ...x, refMin: e.target.value } : x)))
                }
              />
              <button
                onClick={() => setLabRows((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : rows))}
                aria-label="Retirer la ligne"
                className="flex items-center justify-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setLabRows((rows) => [...rows, { label: "", value: "", unit: "", ref: "", refMin: "" }])
          }
          className="mt-2 inline-flex items-center gap-1 text-sm text-teal hover:underline"
        >
          <Plus className="h-4 w-4" /> Ajouter un marqueur
        </button>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setLabOpen(false)}>Annuler</GhostButton>
          <PrimaryButton
            onClick={() => {
              const values: AnalysisValue[] = labRows
                .filter((r) => r.label.trim() && r.value.trim() && r.ref.trim())
                .map((r) => ({
                  label: r.label.trim(),
                  value: Number(r.value),
                  unit: r.unit.trim() || "",
                  ref: Number(r.ref),
                  ...(r.refMin.trim() ? { refMin: Number(r.refMin) } : {}),
                }));
              if (values.length === 0) {
                toast.error("Renseignez au moins un marqueur (nom, valeur, référence)");
                return;
              }
              update(
                (d) => ({
                  ...d,
                  analyses: [...d.analyses, { id: newId(), patientId: patient.id, date: labDate, values }],
                }),
                `Bilan biologique — ${patient.name}`,
              );
              setLabOpen(false);
              toast.success("Bilan enregistré");
            }}
          >
            Enregistrer le bilan
          </PrimaryButton>
        </div>
      </Modal>

      <DiagnosticModal
        open={diag.open}
        onClose={() => setDiag({ open: false, id: null })}
        patientId={patient.id}
        diagnosticId={diag.id}
      />
    </div>
  );
}
