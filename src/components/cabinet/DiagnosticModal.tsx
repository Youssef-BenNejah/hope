import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Diagnostic } from "@/lib/cabinet/types";
import { today } from "@/lib/cabinet/utils";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "./Modal";

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

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? today());
    setReason(existing?.reason ?? "");
    setContent(existing?.content ?? "");
  }, [open, diagnosticId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Entretien avec le patient" : "Nouvel entretien"}
      width="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium">{patientId ? patientName(patientId) : "—"}</p>
          <p className="text-xs text-muted-foreground">
            Interrogez le patient et notez ici uniquement ses réponses. Le brouillon reste modifiable et visible dans
            le dossier et l'historique.
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

        <Field label="Réponses du patient">
          <textarea
            className={`${inputCls} min-h-72 leading-relaxed`}
            placeholder={
              "Notez librement ce que le patient répond…\n\nEx.\nDouleur depuis 3 jours, bas du dos à droite.\nPas d'irradiation dans la jambe, pas de fièvre.\nAggravée en se penchant, soulagée allongé."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <GhostButton onClick={onClose}>Fermer</GhostButton>
        <GhostButton onClick={() => persist("brouillon")}>Enregistrer le brouillon</GhostButton>
        <PrimaryButton onClick={() => persist("termine")}>Terminer l'entretien</PrimaryButton>
      </div>
    </Modal>
  );
}
