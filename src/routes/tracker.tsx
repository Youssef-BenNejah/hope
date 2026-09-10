import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { ArrowRight, DoorOpen, LogIn, RotateCcw, Stethoscope, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Appointment, TrackerStatus } from "@/lib/cabinet/types";
import { fmtLong, today } from "@/lib/cabinet/utils";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { PaymentModal } from "@/components/cabinet/PaymentModal";

export const Route = createFileRoute("/tracker")({
  head: () => ({
    meta: [
      { title: "Salle d'attente — Cabinet" },
      { name: "description", content: "Tableau de suivi du flux patient : arrivée, salle d'attente, consultation, sortie." },
      { property: "og:title", content: "Salle d'attente — Cabinet" },
      { property: "og:description", content: "Flux des patients en temps réel dans le cabinet." },
    ],
  }),
  component: TrackerPage,
});

const columns: { key: TrackerStatus; label: string; tone: string }[] = [
  { key: "waiting", label: "Salle d'attente", tone: "bg-warning-soft text-warning" },
  { key: "in_consult", label: "En consultation", tone: "bg-frost text-twilight" },
  { key: "done", label: "Terminé", tone: "bg-success-soft text-success" },
];

function waitLabel(iso?: string) {
  if (!iso) return null;
  const min = differenceInMinutes(new Date(), new Date(iso));
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60}`;
}

function TrackerPage() {
  const { data, update, patientName } = useCabinet();
  const navigate = useNavigate();
  const day = today();
  const [payFor, setPayFor] = useState<string | null>(null);

  const list = useMemo(
    () => data.appointments.filter((a) => a.date === day).sort((a, b) => a.time.localeCompare(b.time)),
    [data.appointments, day],
  );

  const notArrived = list.filter((a) => !a.checkedInAt && a.status === "upcoming");
  const byCol = (k: TrackerStatus) => list.filter((a) => a.checkedInAt && (a.tracker ?? "waiting") === k);

  const setTracker = (appt: Appointment, tracker: TrackerStatus, msg: string) => {
    update(
      (d) => ({
        ...d,
        appointments: d.appointments.map((x) => (x.id === appt.id ? { ...x, tracker } : x)),
      }),
      `Flux patient — ${patientName(appt.patientId)} : ${msg}`,
    );
    toast.success(msg);
  };

  const checkIn = (appt: Appointment) => {
    update(
      (d) => ({
        ...d,
        appointments: d.appointments.map((x) =>
          x.id === appt.id ? { ...x, checkedInAt: new Date().toISOString(), tracker: "waiting" } : x,
        ),
      }),
      `Arrivée enregistrée — ${patientName(appt.patientId)}`,
    );
    toast.success(`${patientName(appt.patientId)} est arrivé(e)`);
  };

  const reopen = (appt: Appointment) => {
    update((d) => ({
      ...d,
      appointments: d.appointments.map((x) => {
        if (x.id !== appt.id) return x;
        const { checkedInAt: _c, tracker: _t, ...rest } = x;
        return rest;
      }),
    }));
    toast.success("Patient retiré du tableau");
  };

  return (
    <ScreenTransition>
      <PageHeader title="Salle d'attente" subtitle={`Flux des patients — ${fmtLong(new Date())}`} />

      {list.length === 0 ? (
        <EmptyState icon={<DoorOpen className="h-10 w-10" />} title="Aucun rendez-vous aujourd'hui." />
      ) : (
        <>
          <Card className="mb-4">
            <p className="label-caps mb-3">Attendus — non arrivés ({notArrived.length})</p>
            {notArrived.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tous les patients attendus sont arrivés.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {notArrived.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => checkIn(a)}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-teal hover:bg-cyan/40 dark:hover:bg-muted"
                  >
                    <LogIn className="h-4 w-4 text-teal" />
                    <span className="num text-xs text-muted-foreground">{a.time}</span>
                    <span className="font-medium">{patientName(a.patientId)}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {columns.map((col) => {
              const cards = byCol(col.key);
              return (
                <div key={col.key} className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${col.tone}`}>{col.label}</span>
                    <span className="num text-xs text-muted-foreground">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.length === 0 && (
                      <p className="px-1 py-6 text-center text-xs text-muted-foreground">—</p>
                    )}
                    {cards.map((a) => (
                      <div key={a.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => navigate({ to: "/patients", search: { p: a.patientId } })}
                            className="text-sm font-medium text-teal hover:underline"
                          >
                            {patientName(a.patientId)}
                          </button>
                          <span className="num text-xs text-muted-foreground">{a.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{a.reason}</p>
                        {col.key === "waiting" && (
                          <p className="num mt-1 text-[11px] text-warning">Attente : {waitLabel(a.checkedInAt)}</p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {col.key === "waiting" && (
                            <button
                              onClick={() => setTracker(a, "in_consult", "entré(e) en consultation")}
                              className="inline-flex items-center gap-1 rounded-md bg-teal px-2 py-1 text-xs font-medium text-white hover:bg-surf"
                            >
                              <Stethoscope className="h-3.5 w-3.5" /> Appeler
                            </button>
                          )}
                          {col.key === "in_consult" && (
                            <>
                              <button
                                onClick={() => setTracker(a, "done", "consultation terminée")}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                              >
                                <ArrowRight className="h-3.5 w-3.5" /> Terminer
                              </button>
                              <button
                                onClick={() => setPayFor(a.id)}
                                className="inline-flex items-center gap-1 rounded-md bg-teal px-2 py-1 text-xs font-medium text-white hover:bg-surf"
                              >
                                <Wallet className="h-3.5 w-3.5" /> Encaisser
                              </button>
                            </>
                          )}
                          {col.key === "done" && (
                            <button
                              onClick={() => reopen(a)}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Retirer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <PaymentModal appointmentId={payFor} onClose={() => setPayFor(null)} />
    </ScreenTransition>
  );
}
