import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, LockKeyhole, Mail, MoonStar, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/cabinet/Page";
import { GhostButton } from "@/components/cabinet/Modal";
import type { Attention, StaffCredentials } from "@/lib/api";
import { fmtAgo, fmtDateTime } from "@/lib/format";
import { CredentialsModal } from "./CredentialsModal";
import { Pill } from "./Badges";
import { useResetCredentials, useUnlock } from "./queries";

function Section({ icon, title, count, children }: { icon: ReactNode; title: string; count: number; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
        <span className={`num rounded-full px-2 text-xs ${count ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>
          {count}
        </span>
      </p>
      {count ? <ul className="divide-y divide-border text-sm">{children}</ul> : <p className="text-xs text-muted-foreground">Rien à signaler.</p>}
    </div>
  );
}

/** "Needs attention": stalled onboardings, lockouts, dormant cabinets and recent failed sign-ins. */
export function AttentionPanel({ data, loading }: { data: Attention | undefined; loading: boolean }) {
  const navigate = useNavigate();
  const reset = useResetCredentials();
  const unlock = useUnlock();
  const [credentials, setCredentials] = useState<StaffCredentials | null>(null);

  const openCabinet = (id: string) => void navigate({ to: "/cabinets", search: { open: id } });

  if (loading || !data) {
    return <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  }

  const resend = (cabinetId: string, userId: string) =>
    reset.mutate(
      { cabinetId, userId, email: true },
      { onSuccess: (c) => setCredentials(c) },
    );

  return (
    <Card className="mt-6">
      <p className="mb-4 flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 text-warning" /> À surveiller
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<Mail className="h-4 w-4 text-teal" />} title="Première connexion en attente" count={data.pendingOnboardings.length}>
          {data.pendingOnboardings.map((p) => (
            <li key={p.doctorId} className="flex items-center justify-between gap-3 py-2">
              <button className="min-w-0 text-left" onClick={() => openCabinet(p.cabinetId)}>
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.cabinetName} · {p.daysPending === 0 ? "créé aujourd'hui" : `en attente depuis ${p.daysPending} j`}
                </p>
              </button>
              <GhostButton
                className="shrink-0 !px-3 !py-1.5 text-xs"
                disabled={reset.isPending}
                onClick={() => resend(p.cabinetId, p.doctorId)}
              >
                Renvoyer
              </GhostButton>
            </li>
          ))}
        </Section>

        <Section icon={<LockKeyhole className="h-4 w-4 text-danger" />} title="Comptes bloqués ou en échec" count={data.lockedAccounts.length}>
          {data.lockedAccounts.map((a) => (
            <li key={a.userId} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.name || a.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.cabinetName} · {a.failedAttempts} échec(s) {a.locked && <Pill tone="danger">bloqué</Pill>}
                </p>
              </div>
              <GhostButton
                className="shrink-0 !px-3 !py-1.5 text-xs"
                disabled={unlock.isPending}
                onClick={() => unlock.mutate(a.userId, { onSuccess: () => toast.success(`${a.name || a.email} débloqué`) })}
              >
                Débloquer
              </GhostButton>
            </li>
          ))}
        </Section>

        <Section icon={<MoonStar className="h-4 w-4 text-muted-foreground" />} title="Cabinets sans activité (30 j)" count={data.inactiveCabinets.length}>
          {data.inactiveCabinets.map((c) => (
            <li key={c.id}>
              <button className="flex w-full items-center justify-between gap-3 py-2 text-left" onClick={() => openCabinet(c.id)}>
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.lastActivityAt ? `dernière activité ${fmtAgo(c.lastActivityAt)}` : "jamais utilisé"}
                </span>
              </button>
            </li>
          ))}
        </Section>

        <Section icon={<ShieldAlert className="h-4 w-4 text-danger" />} title={`Échecs de connexion (${data.failedLogins24h} sur 24 h)`} count={data.recentFailedLogins.length}>
          {data.recentFailedLogins.slice(0, 5).map((f, i) => (
            <li key={`${f.email}-${f.at}-${i}`} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{f.name || f.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {f.cabinetName} · {f.ipAddress ?? "IP inconnue"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(f.at)}</span>
            </li>
          ))}
        </Section>
      </div>

      <CredentialsModal credentials={credentials} title="Identifiants renvoyés" onClose={() => setCredentials(null)} />
    </Card>
  );
}
