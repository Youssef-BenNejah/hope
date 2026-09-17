import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Diagnostic } from "@/lib/cabinet/types";
import { ageFrom, sexLabel, today } from "@/lib/cabinet/utils";
import { Field, GhostButton, PrimaryButton, inputCls } from "./Modal";
import { GiInterviewForm } from "./GiInterviewForm";
import { DiagnosticReportView } from "./DiagnosticReportView";

export function DiagnosticModal({
  open,
  onClose,
  patientId,
  diagnosticId,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
  diagnosticId: string | null;
}) {
  const { data, update, newId, currentUser, patientName } = useCabinet();
  const existing = diagnosticId ? data.diagnostics.find((x) => x.id === diagnosticId) : undefined;
  const patient = patientId ? data.patients.find((p) => p.id === patientId) : undefined;

  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [structured, setStructured] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? today());
    setReason(existing?.reason ?? "");
    setStructured("");
    setNotes("");
  }, [open, diagnosticId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const finalContent = () => [existing?.content.trim(), structured.trim(), notes.trim()].filter(Boolean).join("\n\n");

  const persist = (status: Diagnostic["status"]) => {
    if (!patientId) return;
    const content = finalContent();
    if (!content && !reason.trim()) {
      toast.error("Renseignez l'interrogatoire ou au moins une note");
      return;
    }
    const now = new Date().toISOString();
    if (existing) {
      const id = existing.id;
      update(
        (d) => ({
          ...d,
          diagnostics: d.diagnostics.map((x) =>
            x.id === id
              ? {
                  ...x,
                  date,
                  ...(reason.trim() ? { reason: reason.trim() } : {}),
                  content,
                  status,
                  updatedAt: now,
                }
              : x,
          ),
        }),
        `Entretien ${status === "termine" ? "terminé" : "mis à jour"} — ${patientName(patientId)}`,
      );
    } else {
      update(
        (d) => ({
          ...d,
          diagnostics: [
            ...d.diagnostics,
            {
              id: newId(),
              patientId,
              date,
              ...(reason.trim() ? { reason: reason.trim() } : {}),
              content,
              status,
              ...(currentUser ? { authorId: currentUser.id } : {}),
              createdAt: now,
              updatedAt: now,
            },
          ],
        }),
        `Entretien ${status === "termine" ? "terminé" : "créé (brouillon)"} — ${patientName(patientId)}`,
      );
    }
    toast.success(status === "termine" ? "Entretien terminé et classé au dossier" : "Brouillon enregistré au dossier");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#03045E]/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold sm:text-xl">
              {existing ? "Entretien avec le patient" : "Nouvel entretien"}
            </h2>
            {patient ? (
              <>
                <p className="truncate text-sm font-medium">{patient.name}</p>
                <p className="num truncate text-xs text-muted-foreground sm:text-sm">
                  <span className="font-semibold text-teal">{patient.code}</span>
                  {patient.phone && ` · ${patient.phone}`}
                  {ageFrom(patient.birthDate) !== null && ` · ${ageFrom(patient.birthDate)} ans`}
                  {patient.sex && ` · ${sexLabel(patient.sex)}`}
                </p>
                {patient.allergies.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Allergies : {patient.allergies.join(", ")}
                  </p>
                )}
              </>
            ) : (
              <p className="truncate text-sm text-muted-foreground">{patientId ? patientName(patientId) : "—"}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="shrink-0 rounded-md p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Interrogez le patient à l'aide de la grille ci-dessous. Cochez ce qui est retrouvé — le compte-rendu se
                construit automatiquement à partir de vos réponses. Le brouillon reste modifiable et visible dans le
                dossier et l'historique.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <Field label="Date de l'entretien">
                <input type="date" className={`${inputCls} num`} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Motif (facultatif)">
                <input
                  className={inputCls}
                  placeholder="Ex. douleur thoracique à l'effort depuis 1 semaine"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            </div>

            {existing?.content && (
              <div>
                <span className="label-caps mb-1.5 block">Compte-rendu enregistré</span>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <DiagnosticReportView content={existing.content} />
                </div>
              </div>
            )}

            <div>
              <span className="label-caps mb-1.5 block">
                {existing?.content ? "Compléter l'interrogatoire (HGE)" : "Interrogatoire structuré (HGE)"}
              </span>
              <GiInterviewForm onChange={setStructured} customGroups={currentUser?.customSymptomGroups ?? []} />
            </div>

            <Field label="Notes complémentaires (facultatif)">
              <textarea
                className={`${inputCls} min-h-28 leading-relaxed`}
                placeholder="Toute réponse du patient non couverte par la grille ci-dessus…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-4 sm:p-6">
          <GhostButton onClick={onClose}>Fermer</GhostButton>
          <GhostButton onClick={() => persist("brouillon")}>Enregistrer le brouillon</GhostButton>
          <PrimaryButton onClick={() => persist("termine")}>Terminer l'entretien</PrimaryButton>
        </div>
      </aside>
    </div>
  );
}
