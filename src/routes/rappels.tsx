import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Bell, CalendarPlus, CheckCircle2, Phone, Pill, Syringe, Wallet } from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, today } from "@/lib/cabinet/utils";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { GhostButton } from "@/components/cabinet/Modal";
import { AppointmentModal } from "@/components/cabinet/AppointmentModal";

export const Route = createFileRoute("/rappels")({
  head: () => ({
    meta: [
      { title: "Rappels — Cabinet" },
      {
        name: "description",
        content: "Rappels cliniques et administratifs déduits automatiquement : RDV, vaccins, suivis, ordonnances, CNAM.",
      },
      { property: "og:title", content: "Rappels — Cabinet" },
      { property: "og:description", content: "RDV à confirmer, vaccins à rappeler, suivis en retard, dossiers CNAM." },
    ],
  }),
  component: RemindersPage,
});

type Item = {
  id: string;
  patientId?: string;
  title: string;
  detail: string;
  when?: string;
};

const daysAgo = (iso: string) => differenceInCalendarDays(new Date(), parseISO(iso));

function Section({
  icon,
  title,
  tone,
  items,
  empty,
  render,
}: {
  icon: React.ReactNode;
  title: string;
  tone: string;
  items: Item[];
  empty: string;
  render: (it: Item) => React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
        <p className="font-semibold">{title}</p>
        <span className="num ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y divide-border">{items.map((it) => render(it))}</div>
      )}
    </Card>
  );
}

function RemindersPage() {
  const { data, patientName } = useCabinet();
  const navigate = useNavigate();
  const [apptOpen, setApptOpen] = useState(false);
  const [apptPatient, setApptPatient] = useState<string | undefined>(undefined);
  const [done, setDone] = useState<Set<string>>(new Set());
  const day = today();

  const openAppt = (patientId?: string) => {
    setApptPatient(patientId);
    setApptOpen(true);
  };

  const confirmAppts = useMemo<Item[]>(
    () =>
      data.appointments
        .filter((a) => a.status === "upcoming" && a.date >= day && daysAgo(a.date) >= -2)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map((a) => ({
          id: `c-${a.id}`,
          patientId: a.patientId,
          title: patientName(a.patientId),
          detail: a.reason,
          when: `${fmtDate(a.date, "dd/MM")} · ${a.time}`,
        })),
    [data.appointments, day, patientName],
  );

  const noShows = useMemo<Item[]>(
    () =>
      data.appointments
        .filter((a) => a.status === "absent" && daysAgo(a.date) <= 21)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((a) => ({
          id: `n-${a.id}`,
          patientId: a.patientId,
          title: patientName(a.patientId),
          detail: `Absent le ${fmtDate(a.date, "dd/MM/yyyy")} — ${a.reason}`,
        })),
    [data.appointments, patientName],
  );

  const vaccines = useMemo<Item[]>(
    () =>
      data.vaccinations
        .filter((v) => v.nextDue && daysAgo(v.nextDue) >= -45)
        .sort((a, b) => (a.nextDue ?? "").localeCompare(b.nextDue ?? ""))
        .map((v) => ({
          id: `v-${v.id}`,
          patientId: v.patientId,
          title: patientName(v.patientId),
          detail: `${v.vaccine} — rappel prévu le ${fmtDate(v.nextDue!, "dd/MM/yyyy")}`,
          when: daysAgo(v.nextDue!) > 0 ? "en retard" : "à venir",
        })),
    [data.vaccinations, patientName],
  );

  const followUps = useMemo<Item[]>(() => {
    return data.patients
      .filter((p) => p.chronic.length > 0)
      .map((p) => {
        const last = data.checkups
          .filter((c) => c.patientId === p.id)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        const gap = last ? daysAgo(last.date) : 999;
        return { p, last, gap };
      })
      .filter((x) => x.gap >= 90)
      .sort((a, b) => b.gap - a.gap)
      .map((x) => ({
        id: `f-${x.p.id}`,
        patientId: x.p.id,
        title: x.p.name,
        detail: `${x.p.chronic.join(", ")} — dernier contrôle ${
          x.last ? `il y a ${x.gap} j` : "jamais enregistré"
        }`,
      }));
  }, [data.patients, data.checkups]);

  const renewals = useMemo<Item[]>(() => {
    return data.patients
      .filter((p) => p.chronic.length > 0)
      .map((p) => {
        const last = data.prescriptions
          .filter((r) => r.patientId === p.id)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        const gap = last ? daysAgo(last.date) : 999;
        return { p, last, gap };
      })
      .filter((x) => x.gap >= 25)
      .sort((a, b) => b.gap - a.gap)
      .map((x) => ({
        id: `r-${x.p.id}`,
        patientId: x.p.id,
        title: x.p.name,
        detail: x.last
          ? `Dernière ordonnance il y a ${x.gap} j — ${x.last.text.split("\n")[0]}`
          : "Traitement chronique sans ordonnance enregistrée",
      }));
  }, [data.patients, data.prescriptions]);

  const cnam = useMemo<Item[]>(
    () =>
      data.payments
        .filter((pmt) => pmt.method === "cnam_pending" && daysAgo(pmt.date) >= 30)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((pmt) => ({
          id: `p-${pmt.id}`,
          patientId: pmt.patientId,
          title: patientName(pmt.patientId),
          detail: `${pmt.amount} DT en attente depuis le ${fmtDate(pmt.date, "dd/MM/yyyy")} (${daysAgo(pmt.date)} j)`,
        })),
    [data.payments, patientName],
  );

  const total =
    confirmAppts.length + noShows.length + vaccines.length + followUps.length + renewals.length + cnam.length;

  const row = (it: Item, action?: React.ReactNode) =>
    done.has(it.id) ? null : (
      <div key={it.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {it.patientId ? (
              <button
                onClick={() => navigate({ to: "/patients", search: { p: it.patientId } })}
                className="text-teal hover:underline"
              >
                {it.title}
              </button>
            ) : (
              it.title
            )}
            {it.when && <span className="num ml-2 text-xs text-muted-foreground">{it.when}</span>}
          </p>
          <p className="text-muted-foreground">{it.detail}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {action}
          <button
            onClick={() => setDone((s) => new Set(s).add(it.id))}
            title="Marquer comme traité"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-success-soft hover:text-success"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );

  return (
    <ScreenTransition>
      <PageHeader
        title="Rappels"
        subtitle={
          total === 0 ? "Rien à signaler aujourd'hui" : `${total} rappel${total > 1 ? "s" : ""} à traiter`
        }
      />

      {total === 0 ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="Aucun rappel en attente — tout est à jour." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section
            icon={<CalendarPlus className="h-4 w-4 text-twilight" />}
            tone="bg-frost"
            title="Rendez-vous à confirmer (48 h)"
            items={confirmAppts}
            empty="Aucun rendez-vous imminent."
            render={(it) =>
              row(
                it,
                <GhostButton className="!px-2 !py-1 text-xs" onClick={() => openAppt(it.patientId)}>
                  <Phone className="h-3.5 w-3.5" /> Confirmer
                </GhostButton>,
              )
            }
          />
          <Section
            icon={<Phone className="h-4 w-4 text-danger" />}
            tone="bg-danger-soft"
            title="Absences à recontacter"
            items={noShows}
            empty="Aucune absence récente."
            render={(it) => row(it)}
          />
          <Section
            icon={<Syringe className="h-4 w-4 text-teal" />}
            tone="bg-cyan"
            title="Vaccins à rappeler"
            items={vaccines}
            empty="Aucun rappel vaccinal à programmer."
            render={(it) =>
              row(
                it,
                <Link to="/vaccinations">
                  <GhostButton className="!px-2 !py-1 text-xs">Registre</GhostButton>
                </Link>,
              )
            }
          />
          <Section
            icon={<Bell className="h-4 w-4 text-warning" />}
            tone="bg-warning-soft"
            title="Suivis chroniques en retard (> 90 j)"
            items={followUps}
            empty="Tous les patients chroniques ont été vus récemment."
            render={(it) =>
              row(
                it,
                <button
                  onClick={() => navigate({ to: "/suivi/$id", params: { id: it.patientId! } })}
                  className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  Suivi
                </button>,
              )
            }
          />
          <Section
            icon={<Pill className="h-4 w-4 text-teal" />}
            tone="bg-cyan"
            title="Ordonnances chroniques à renouveler"
            items={renewals}
            empty="Aucun renouvellement en attente."
            render={(it) =>
              row(
                it,
                <button
                  onClick={() => navigate({ to: "/ordonnances", search: { patient: it.patientId } })}
                  className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  Renouveler
                </button>,
              )
            }
          />
          <Section
            icon={<Wallet className="h-4 w-4 text-danger" />}
            tone="bg-danger-soft"
            title="Dossiers CNAM en attente (> 30 j)"
            items={cnam}
            empty="Aucun dossier CNAM en souffrance."
            render={(it) =>
              row(
                it,
                <Link to="/patients" search={{ p: it.patientId }}>
                  <GhostButton className="!px-2 !py-1 text-xs">Voir le dossier</GhostButton>
                </Link>,
              )
            }
          />
        </div>
      )}

      <AppointmentModal
        open={apptOpen}
        onClose={() => setApptOpen(false)}
        editId={null}
        defaults={{ patientId: apptPatient }}
      />
    </ScreenTransition>
  );
}
