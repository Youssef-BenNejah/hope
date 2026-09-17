import { useEffect, useState } from "react";
import { ClipboardList, X } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Diagnostic } from "@/lib/cabinet/types";
import { today } from "@/lib/cabinet/utils";
import { Field, GhostButton, PrimaryButton, inputCls } from "./Modal";
import { GiInterviewForm } from "./GiInterviewForm";

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

  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [content, setContent] = useState("");
  const [assist, setAssist] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? today());
    setReason(existing?.reason ?? "");
    setContent(existing?.content ?? "");
    setAssist(false);
  }, [open, diagnosticId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const insertStructured = (text: string) => {
    if (!text.trim()) return;
    setContent((c) => (c.trim() ? `${c.trim()}\n\n${text}` : text));
    toast.success("Interrogatoire structuré inséré dans les réponses");
  };

  const persist = (status: Diagnostic["status"]) => {
    if (!patientId) return;
    if (!content.trim() && !reason.trim()) {
      toast.error("Notez au moins une réponse du patient");
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
                  content: content.trim(),
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
              content: content.trim(),
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
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-4 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold sm:text-xl">
              {existing ? "Entretien avec le patient" : "Nouvel entretien"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{patientId ? patientName(patientId) : "—"}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="shrink-0 rounded-md p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className={`grid gap-6 ${assist ? "lg:grid-cols-[1fr_440px]" : ""}`}>
            <div className="space-y-5">
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  Interrogez le patient et notez ici uniquement ses réponses. Le brouillon reste modifiable et visible
                  dans le dossier et l'historique.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <Field label="Date de l'entretien">
                  <input
                    type="date"
                    className={`${inputCls} num`}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
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

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="label-caps">Réponses du patient</span>
                  <button
                    type="button"
                    onClick={() => setAssist((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      assist ? "bg-teal text-white" : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Aide à la saisie structurée (HGE)
                  </button>
                </div>
                <textarea
                  className={`${inputCls} min-h-72 leading-relaxed`}
                  placeholder={
                    "Notez librement ce que le patient répond…\n\nEx.\nDouleur depuis 3 jours, bas du dos à droite.\nPas d'irradiation dans la jambe, pas de fièvre.\nAggravée en se penchant, soulagée allongé."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>

            {assist && (
              <div className="lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto lg:pr-1">
                <p className="mb-2 text-xs text-muted-foreground">
                  Cochez les éléments retrouvés à l'interrogatoire, puis insérez-les dans les réponses ci-contre. Le
                  texte reste ensuite librement modifiable.
                </p>
                <GiInterviewForm onInsert={insertStructured} />
              </div>
            )}
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
