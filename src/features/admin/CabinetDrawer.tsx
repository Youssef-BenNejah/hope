import { useState } from "react";
import { Archive, Check, KeyRound, LockOpen, Pause, Pencil, Play } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "@/components/cabinet/Drawer";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import type { CabinetSummary, StaffCredentials, TeamMember } from "@/lib/api";
import { fmtAgo, fmtDate, fmtDateTime } from "@/lib/format";
import { Pill, StatusBadge } from "./Badges";
import { CredentialsModal } from "./CredentialsModal";
import {
  useArchiveCabinet,
  useCabinetDetail,
  useRenameCabinet,
  useResetCredentials,
  useSetSuspension,
  useUnlock,
} from "./queries";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border p-3">
    <p className="label-caps">{label}</p>
    <p className="num mt-1 text-lg font-semibold">{value}</p>
  </div>
);

/** Cabinet detail: identity, team (with credential reset / unlock), recent activity and lifecycle actions. */
export function CabinetDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detail = useCabinetDetail(id);
  const rename = useRenameCabinet();
  const suspension = useSetSuspension();
  const archive = useArchiveCabinet();
  const reset = useResetCredentials();
  const unlock = useUnlock();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [credentials, setCredentials] = useState<StaffCredentials | null>(null);

  const cabinet: CabinetSummary | undefined = detail.data?.cabinet;
  /** Own cabinet and archived cabinets can't be suspended or archived. */
  const manageable = !!cabinet && !cabinet.current && cabinet.status !== "ARCHIVED";

  const saveName = () => {
    if (!cabinet || !name.trim()) return;
    rename.mutate(
      { id: cabinet.id, name: name.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Cabinet renommé");
        },
      },
    );
  };

  return (
    <>
      <Drawer
        open={!!id}
        onClose={onClose}
        title={
          cabinet ? (
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                  <PrimaryButton onClick={saveName} disabled={rename.isPending} aria-label="Enregistrer">
                    <Check className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              ) : (
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <span className="truncate">{cabinet.name}</span>
                  <button
                    aria-label="Renommer"
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    onClick={() => {
                      setName(cabinet.name);
                      setEditing(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </h2>
              )}
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={cabinet.status} />
                {cabinet.current && <Pill tone="info">Mon cabinet</Pill>}
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-semibold">Cabinet</h2>
          )
        }
      >
        {detail.isPending && <div className="h-40 animate-pulse rounded-lg bg-muted" />}
        {detail.isError && <p className="text-sm text-danger">{detail.error.message}</p>}
        {detail.data && cabinet && (
          <div className="space-y-6">
            {cabinet.suspensionReason && (
              <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
                Suspendu : {cabinet.suspensionReason}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Médecins" value={cabinet.doctors} />
              <Stat label="Secrétaires" value={cabinet.secretaries} />
              <Stat label="Patients" value={cabinet.patients} />
            </div>
            <p className="text-xs text-muted-foreground">
              Créé le {fmtDate(cabinet.createdAt)} · dernière activité {fmtAgo(cabinet.lastActivityAt)}
            </p>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Équipe</h3>
              <ul className="divide-y divide-border text-sm">
                {detail.data.team.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.name || m.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.role === "DOCTOR" ? "Médecin" : "Secrétaire"} · {m.email}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!m.active && <Pill tone="warning">Désactivé</Pill>}
                        {m.pendingFirstLogin && <Pill tone="warning">1ère connexion en attente</Pill>}
                        {m.locked && <Pill tone="danger">Bloqué</Pill>}
                        <span className="text-xs text-muted-foreground">
                          Dernière connexion : {m.lastLoginAt ? fmtAgo(m.lastLoginAt) : "jamais"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {m.locked && (
                        <button
                          title="Débloquer"
                          aria-label="Débloquer"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          onClick={() => unlock.mutate(m.id, { onSuccess: () => toast.success(`${m.name} débloqué`) })}
                        >
                          <LockOpen className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        title="Réinitialiser / renvoyer les identifiants"
                        aria-label="Réinitialiser les identifiants"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-teal/10 hover:text-teal"
                        onClick={() => {
                          setSendEmail(true);
                          setResetTarget(m);
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
                {!detail.data.team.length && <li className="py-3 text-muted-foreground">Aucun membre</li>}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Activité récente</h3>
              <ul className="space-y-1.5 text-sm">
                {detail.data.recentActivity.map((a, i) => (
                  <li key={`${a.at}-${i}`} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{a.actorName || "—"}</span>{" "}
                      <span className="text-muted-foreground">{a.summary}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(a.at)}</span>
                  </li>
                ))}
                {!detail.data.recentActivity.length && <li className="text-muted-foreground">Aucune activité</li>}
              </ul>
            </section>

            {manageable ? (
              <section className="flex flex-wrap gap-2 border-t border-border pt-4">
                {cabinet.status === "SUSPENDED" ? (
                  <PrimaryButton
                    disabled={suspension.isPending}
                    onClick={() =>
                      suspension.mutate(
                        { id: cabinet.id, suspended: false },
                        { onSuccess: () => toast.success("Cabinet réactivé") },
                      )
                    }
                  >
                    <Play className="h-4 w-4" /> Réactiver
                  </PrimaryButton>
                ) : (
                  <GhostButton
                    onClick={() => {
                      setReason("");
                      setSuspendOpen(true);
                    }}
                  >
                    <Pause className="h-4 w-4" /> Suspendre
                  </GhostButton>
                )}
                <GhostButton
                  className="text-danger"
                  onClick={() => {
                    setConfirmText("");
                    setArchiveOpen(true);
                  }}
                >
                  <Archive className="h-4 w-4" /> Archiver
                </GhostButton>
              </section>
            ) : (
              cabinet.current && (
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  Votre propre cabinet ne peut être ni suspendu ni archivé.
                </p>
              )
            )}
          </div>
        )}
      </Drawer>

      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="Suspendre le cabinet" width="max-w-md">
        <p className="text-sm text-muted-foreground">
          Les médecins et secrétaires de « {cabinet?.name} » ne pourront plus se connecter et leurs sessions seront fermées.
        </p>
        <div className="mt-4">
          <Field label="Motif (facultatif)">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setSuspendOpen(false)}>Annuler</GhostButton>
          <PrimaryButton
            disabled={suspension.isPending}
            onClick={() =>
              cabinet &&
              suspension.mutate(
                { id: cabinet.id, suspended: true, ...(reason.trim() && { reason: reason.trim() }) },
                {
                  onSuccess: () => {
                    setSuspendOpen(false);
                    toast.success("Cabinet suspendu");
                  },
                },
              )
            }
          >
            Suspendre
          </PrimaryButton>
        </div>
      </Modal>

      <Modal open={archiveOpen} onClose={() => setArchiveOpen(false)} title="Archiver le cabinet" width="max-w-md">
        <p className="text-sm text-muted-foreground">
          L'archivage est définitif depuis cette console : les données sont conservées mais le cabinet et son personnel
          n'ont plus accès. Tapez <span className="font-semibold text-foreground">{cabinet?.name}</span> pour confirmer.
        </p>
        <div className="mt-4">
          <input
            className={inputCls}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label="Confirmer le nom du cabinet"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setArchiveOpen(false)}>Annuler</GhostButton>
          <button
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={archive.isPending || confirmText.trim() !== cabinet?.name}
            onClick={() =>
              cabinet &&
              archive.mutate(cabinet.id, {
                onSuccess: () => {
                  setArchiveOpen(false);
                  toast.success("Cabinet archivé");
                  onClose();
                },
              })
            }
          >
            Archiver
          </button>
        </div>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Nouveaux identifiants" width="max-w-md">
        <p className="text-sm text-muted-foreground">
          Un nouveau mot de passe temporaire sera généré pour {resetTarget?.name || resetTarget?.email}. L'ancien cesse
          de fonctionner.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 accent-[#0077B6]"
          />
          Envoyer les identifiants par email
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setResetTarget(null)}>Annuler</GhostButton>
          <PrimaryButton
            disabled={reset.isPending}
            onClick={() =>
              cabinet &&
              resetTarget &&
              reset.mutate(
                { cabinetId: cabinet.id, userId: resetTarget.id, email: sendEmail },
                {
                  onSuccess: (c) => {
                    setResetTarget(null);
                    setCredentials(c);
                  },
                },
              )
            }
          >
            {reset.isPending ? "Génération…" : "Générer"}
          </PrimaryButton>
        </div>
      </Modal>

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
