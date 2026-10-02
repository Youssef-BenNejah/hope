import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { GhostButton, Modal } from "@/components/cabinet/Modal";
import type { StaffCredentials } from "@/lib/api";

/** One-time credentials: the backend never returns this password again after this response. */
export function CredentialsModal({
  credentials,
  title = "Identifiants du compte",
  onClose,
}: {
  credentials: StaffCredentials | null;
  title?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`${credentials.email}\n${credentials.temporaryPassword}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the values stay selectable on screen */
    }
  };

  return (
    <Modal open={!!credentials} onClose={onClose} title={title} width="max-w-md">
      {credentials && (
        <div className="space-y-4">
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
            Ce mot de passe temporaire n'est affiché qu'une seule fois. Il devra être changé à la première connexion.
          </p>
          <dl className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <div>
              <dt className="label-caps">Identifiant</dt>
              <dd className="mt-1 break-all font-medium">{credentials.email}</dd>
            </div>
            <div>
              <dt className="label-caps">Mot de passe temporaire</dt>
              <dd className="num mt-1 select-all break-all text-base font-semibold">{credentials.temporaryPassword}</dd>
            </div>
          </dl>
          <p className={`text-xs ${credentials.emailSent ? "text-success" : "text-muted-foreground"}`}>
            {credentials.emailSent
              ? `Identifiants envoyés par email à ${credentials.email}.`
              : "Aucun email envoyé : transmettez ces identifiants par un canal sûr."}
          </p>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
            </GhostButton>
            <GhostButton onClick={onClose}>Fermer</GhostButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
