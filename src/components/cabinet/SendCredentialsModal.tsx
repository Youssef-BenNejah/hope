import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { buildCredentialsEmail } from "@/lib/cabinet/credentials";
import { Field, GhostButton, Modal, PrimaryButton } from "@/components/cabinet/Modal";

export function SendCredentialsModal({
  open,
  onClose,
  doc,
  password,
  cabinetName,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  doc: { name: string; email: string } | null;
  password: string;
  cabinetName: string;
  onSent?: () => void;
}) {
  const [sent, setSent] = useState(false);
  const email = doc ? buildCredentialsEmail(doc, password, cabinetName) : null;

  const close = () => {
    setSent(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Envoyer les identifiants par email" width="max-w-lg">
      {doc && email && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aperçu du message qui sera envoyé à <span className="font-medium text-foreground">{doc.name}</span>.
          </p>
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <Field label="À">
              <p className="truncate">{email.to || "—"}</p>
            </Field>
            <Field label="Objet">
              <p>{email.subject}</p>
            </Field>
            <Field label="Message">
              <pre className="whitespace-pre-wrap rounded-md bg-card p-3 text-xs leading-relaxed">{email.body}</pre>
            </Field>
          </div>
          {!email.to && <p className="text-xs text-warning">Aucune adresse email enregistrée pour ce compte.</p>}
          {sent && <p className="text-sm font-medium text-success">Email envoyé (simulation) à {email.to}.</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <GhostButton onClick={close}>Fermer</GhostButton>
            <a
              href={`mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Mail className="h-4 w-4" /> Ouvrir dans mon client mail
            </a>
            <PrimaryButton
              disabled={!email.to}
              onClick={() => {
                setSent(true);
                toast.success(`Email envoyé à ${email.to}`);
                onSent?.();
              }}
            >
              <Send className="h-4 w-4" /> Envoyer (simulation)
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
