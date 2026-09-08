import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, FileUp, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, statusMeta, today } from "@/lib/cabinet/utils";
import { GhostButton, Modal, PrimaryButton, inputCls } from "./Modal";

const tabs = ["Aperçu", "Historique", "Notes", "Analyses", "Certificats"] as const;
type Tab = (typeof tabs)[number];

export function PatientDrawer({ patientId, onClose }: { patientId: string | null; onClose: () => void }) {
  const { data, update, newId } = useCabinet();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Aperçu");
  const [note, setNote] = useState("");
  
  const [chronic, setChronic] = useState("");
  const [allergyEdit, setAllergyEdit] = useState(false);
  const [allergyValue, setAllergyValue] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importState, setImportState] = useState<"idle" | "loading" | "done">("idle");
  const [scan, setScan] = useState<"idle" | "loading" | "ready">("idle");

  const patient = data.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const visits = data.appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const notes = data.notes.filter((n) => n.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const analyses = data.analyses.filter((a) => a.patientId === patient.id).sort((a, b) => a.date.localeCompare(b.date));
  const certs = data.certificates.filter((c) => c.patientId === patient.id);

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

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[#03045E]/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[60%] flex-col overflow-y-auto border-l border-border bg-card p-6 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{patient.name}</h2>
            <p className="num text-sm text-muted-foreground">
              <span className="font-semibold text-teal">{patient.code}</span> · {patient.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GhostButton
              onClick={() => {
                setImportState("idle");
                setImportOpen(true);
              }}
            >
              <FileUp className="h-4 w-4" /> Import de dossier existant
            </GhostButton>
            <button onClick={onClose} aria-label="Fermer" className="rounded-md p-2 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {patient.allergies.length > 0 ? (
          <div className="mt-5 flex items-center gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="flex-1">Allergies : {patient.allergies.join(", ")}</span>
            <button onClick={() => setAllergyEdit(true)} aria-label="Modifier les allergies">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAllergyEdit(true)}
            className="mt-5 w-full rounded-lg border border-dashed border-border-strong px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            Aucune allergie connue — Ajouter
          </button>
        )}

        <div className="sticky top-0 z-10 mt-5 flex flex-wrap gap-1 border-b border-border bg-card">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                document.getElementById(sectionId(t))?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                tab === t ? "border-teal font-medium text-teal" : "border-transparent text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 flex-1 space-y-10 text-sm">
          <section id={sectionId("Aperçu")} className="scroll-mt-14">
            <h3 className="label-caps mb-3 text-teal">Aperçu</h3>
            <div className="space-y-5">
              <dl className="grid grid-cols-2 gap-4">
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
            <div className="divide-y divide-border">
              {visits.map((v) => (
                <div key={v.id} className="flex items-center gap-4 py-3">
                  <span className="num w-32 text-muted-foreground">
                    {fmtDate(v.date, "dd/MM/yyyy")} {v.time}
                  </span>
                  <span className="flex-1">{v.reason}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${statusMeta[v.status].className}`}>
                    {statusMeta[v.status].label}
                  </span>
                </div>
              ))}
              {visits.length === 0 && <p className="text-muted-foreground">Aucune visite enregistrée.</p>}
            </div>
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
              <PrimaryButton
                onClick={() => {
                  if (!note.trim()) return;
                  update((d) => ({
                    ...d,
                    notes: [...d.notes, { id: newId(), patientId: patient.id, date: today(), text: note }],
                  }));
                  setNote("");
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
                    <p className="mt-1">{n.text}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-muted-foreground">Aucune note pour ce patient.</p>}
              </div>
            </div>
          </section>

          <section id={sectionId("Analyses")} className="scroll-mt-14">
            <h3 className="label-caps mb-3 text-teal">Analyses</h3>
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
          )}

          {tab === "Certificats" && (
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
          )}
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
