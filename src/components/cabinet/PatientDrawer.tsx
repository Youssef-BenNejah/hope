import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowLeft, Download, FileUp, History, Paperclip, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCabinet } from "@/lib/cabinet/store";
import type { NoteAttachment } from "@/lib/cabinet/types";
import { ageFrom, fmtDate, sexLabel, statusMeta, today } from "@/lib/cabinet/utils";
import { GhostButton, Modal, PrimaryButton, inputCls } from "./Modal";

const tabs = ["Aperçu", "Historique", "Notes", "Analyses", "Certificats"] as const;
type Tab = (typeof tabs)[number];
const sectionId = (t: Tab) => `patient-section-${tabs.indexOf(t)}`;

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
  const { data, update, newId } = useCabinet();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Aperçu");
  const [note, setNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [files, setFiles] = useState<NoteAttachment[]>([]);
  
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
  const certs = data.certificates.filter((c) => c.patientId === patient.id);

  const payments = data.payments.filter((p) => p.patientId === patient.id);

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
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      date: p.date,
      label: `Paiement — ${p.amount} DT`,
      badge: p.method === "cash" ? "Espèces" : p.method === "cnam_paid" ? "CNAM payé" : "CNAM en attente",
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

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[#03045E]/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200 md:max-w-[560px] xl:max-w-[60%]">
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
                      update((d) => ({
                        ...d,
                        patients: d.patients.map((p) =>
                          p.id === patient.id ? { ...p, chronic: [...p.chronic, chronic] } : p,
                        ),
                      }));
                      setChronic("");
                      toast.success("Antécédent ajouté");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </PrimaryButton>
                </div>
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


          <section id={sectionId("Notes")} className="scroll-mt-14">
            <h3 className="label-caps mb-3 text-teal">Notes</h3>
            <div className="space-y-4">
              <textarea
                className={`${inputCls} min-h-24`}
                placeholder="Nouvelle note de consultation…"
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
                  if (!note.trim() && files.length === 0) return;
                  update((d) => ({
                    ...d,
                    notes: [
                      ...d.notes,
                      { id: newId(), patientId: patient.id, date: today(), text: note, attachments: files },
                    ],
                  }));
                  setNote("");
                  setFiles([]);
                  toast.success("Note enregistrée");
                }}
              >
                Enregistrer
              </PrimaryButton>
              <div className="border-l border-border pl-5">
                {notes.map((n) => (
                  <div key={n.id} className="relative pb-5">
                    <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-surf" />
                    <p className="num text-xs text-muted-foreground">{fmtDate(n.date)}</p>
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
              <GhostButton onClick={() => navigate({ to: "/suivi/$id", params: { id: patient.id } })}>
                <Activity className="h-4 w-4" /> Suivi & courbes
              </GhostButton>
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
    </div>
  );
}
