import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Check, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { dt, fmtLong, statusMeta, today } from "@/lib/cabinet/utils";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { AppointmentModal } from "@/components/cabinet/AppointmentModal";
import { PaymentModal } from "@/components/cabinet/PaymentModal";
import { ConfirmModal, PrimaryButton } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aujourd'hui — Cabinet" },
      { name: "description", content: "Vue du jour : rendez-vous, présence et recettes du cabinet." },
      { property: "og:title", content: "Aujourd'hui — Cabinet" },
      { property: "og:description", content: "Vue du jour : rendez-vous, présence et recettes du cabinet." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { data, update, patientName, role } = useCabinet();
  const navigate = useNavigate();
  const showRevenue = role !== "secretaire";
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const day = today();
  const list = useMemo(
    () => data.appointments.filter((a) => a.date === day).sort((a, b) => a.time.localeCompare(b.time)),
    [data.appointments, day],
  );

  const last30 = data.appointments.filter((a) => a.status !== "upcoming");
  const rate = last30.length
    ? Math.round((last30.filter((a) => a.status === "done").length / last30.length) * 100)
    : 100;
  const revenue = data.payments.filter((p) => p.date === day).reduce((s, p) => s + p.amount, 0);

  const isNewPatient = (patientId: string) =>
    data.appointments.filter((a) => a.patientId === patientId).length <= 1;

  return (
    <ScreenTransition>
      <PageHeader
        title="Bonjour, Dr. Belhaj"
        subtitle={fmtLong(new Date())}
        actions={
          <PrimaryButton
            onClick={() => {
              setEditId(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouveau rendez-vous
          </PrimaryButton>
        }
      />

      <div className={`grid gap-4 ${showRevenue ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <Card>
          <p className="label-caps">Rendez-vous aujourd'hui</p>
          <p className="mt-2 num text-4xl font-semibold text-twilight dark:text-frost">{list.length}</p>
        </Card>
        <Card>
          <p className="label-caps">Taux de présence (30 j)</p>
          <p className="mt-2 num text-4xl font-semibold text-twilight dark:text-frost">{rate}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-surf" style={{ width: `${rate}%` }} />
          </div>
        </Card>
        {showRevenue && (
          <Card>
            <p className="label-caps">Recettes du jour</p>
            <p className="mt-2 num text-4xl font-semibold text-twilight dark:text-frost">{dt(revenue)}</p>
          </Card>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Rendez-vous du jour</h2>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title="Aucun rendez-vous aujourd'hui"
          action={
            <PrimaryButton onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Ajouter un rendez-vous
            </PrimaryButton>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {list.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-0 transition-colors hover:bg-cyan/40 dark:hover:bg-muted"
            >
              <span className="num w-14 text-sm font-medium">{a.time}</span>
              <button
                onClick={() => navigate({ to: "/patients", search: { p: a.patientId } })}
                className="text-sm font-medium text-teal hover:underline"
              >
                {patientName(a.patientId)}
              </button>
              {isNewPatient(a.patientId) && (
                <span className="rounded-full bg-frost px-2 py-0.5 text-[11px] font-medium text-twilight">
                  Nouveau patient
                </span>
              )}
              <span className="flex-1 text-sm text-muted-foreground">{a.reason}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusMeta[a.status].className}`}>
                {statusMeta[a.status].label}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Actions"
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted data-[state=open]:bg-muted"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {a.status === "upcoming" && (
                    <>
                      <DropdownMenuItem onSelect={() => setPayFor(a.id)}>
                        <Check className="h-4 w-4 text-success" /> Marquer terminé
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          update((d) => ({
                            ...d,
                            appointments: d.appointments.map((x) => (x.id === a.id ? { ...x, status: "absent" } : x)),
                          }));
                          toast.success("Patient marqué absent");
                        }}
                      >
                        <X className="h-4 w-4 text-danger" /> Marquer absent
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditId(a.id);
                      setModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleteId(a.id)}
                    className="text-danger focus:bg-danger-soft focus:text-danger"
                  >
                    <Trash2 className="h-4 w-4" /> Annuler le rendez-vous
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          ))}
        </div>
      )}


      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} editId={editId} />
      <PaymentModal appointmentId={payFor} onClose={() => setPayFor(null)} />
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        message="Cette action est irréversible. Confirmer la suppression du rendez-vous ?"
        onConfirm={() => {
          update((d) => ({ ...d, appointments: d.appointments.filter((a) => a.id !== deleteId) }));
          toast.success("Rendez-vous supprimé");
        }}
      />
    </ScreenTransition>
  );
}
