import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, addMonths, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtLong, slots, today } from "@/lib/cabinet/utils";
import { PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { AppointmentModal } from "@/components/cabinet/AppointmentModal";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Cabinet" },
      { name: "description", content: "Agenda du cabinet en vue jour, semaine ou mois avec créneaux bloqués." },
      { property: "og:title", content: "Agenda — Cabinet" },
      { property: "og:description", content: "Agenda du cabinet en vue jour, semaine ou mois." },
    ],
  }),
  component: AgendaPage,
});

const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
const statusColor = {
  upcoming: "bg-frost text-twilight",
  done: "bg-success-soft text-success",
  absent: "bg-danger-soft text-danger",
} as const;

function AgendaPage() {
  const { data, update, patientName, newId } = useCabinet();
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [cursor, setCursor] = useState(new Date());
  const [modal, setModal] = useState<{ open: boolean; date?: string; time?: string; editId?: string | null }>({
    open: false,
  });
  const [blockOpen, setBlockOpen] = useState(false);
  const [block, setBlock] = useState({ date: today(), start: "12:00", end: "14:00", reason: "Pause déjeuner" });

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const apptAt = (date: string, hour: number) =>
    data.appointments.filter((a) => a.date === date && Number(a.time.slice(0, 2)) === hour);
  const blockAt = (date: string, hour: number) =>
    data.blocks.find((b) => b.date === date && hour >= Number(b.start.slice(0, 2)) && hour < Number(b.end.slice(0, 2)));

  const shift = (dir: number) => setCursor((c) => (view === "month" ? addMonths(c, dir) : addDays(c, dir * (view === "week" ? 7 : 1))));

  const days = view === "day" ? [cursor] : weekDays;

  return (
    <ScreenTransition>
      <PageHeader
        title="Agenda"
        subtitle={
          view === "month" ? format(cursor, "MMMM yyyy", { locale: fr }) : fmtLong(view === "day" ? cursor : weekDays[0]!)
        }
        actions={
          <>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {(["day", "week", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 text-sm ${view === v ? "bg-teal text-white" : "hover:bg-muted"}`}
                >
                  {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
                </button>
              ))}
            </div>
            <GhostButton onClick={() => shift(-1)} aria-label="Précédent">
              <ChevronLeft className="h-4 w-4" />
            </GhostButton>
            <GhostButton onClick={() => shift(1)} aria-label="Suivant">
              <ChevronRight className="h-4 w-4" />
            </GhostButton>
            <PrimaryButton onClick={() => setBlockOpen(true)}>
              <Ban className="h-4 w-4" /> Bloquer un créneau
            </PrimaryButton>
          </>
        }
      />

      {view === "month" ? (
        <MonthView
          cursor={cursor}
          onPick={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div
            className="grid min-w-[720px]"
            style={{ gridTemplateColumns: `70px repeat(${days.length}, minmax(0,1fr))` }}
          >
            <div className="border-b border-border bg-twilight px-2 py-2 text-xs text-[#EAF2FA]">Heure</div>
            {days.map((d) => (
              <div
                key={d.toISOString()}
                className="border-b border-l border-border bg-twilight px-2 py-2 text-xs font-medium capitalize text-[#EAF2FA]"
              >
                {format(d, "EEEE d", { locale: fr })}
              </div>
            ))}
            {hours.map((h) => (
              <FragmentRow key={h}>
                <div className="num border-b border-border px-2 py-3 text-xs text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </div>
                {days.map((d) => {
                  const ds = format(d, "yyyy-MM-dd");
                  const blocked = blockAt(ds, h);
                  const appts = apptAt(ds, h);
                  return (
                    <div
                      key={ds + h}
                      title={blocked ? `Créneau bloqué : ${blocked.reason}` : undefined}
                      onClick={() => !blocked && setModal({ open: true, date: ds, time: `${String(h).padStart(2, "0")}:00` })}
                      className={`min-h-14 cursor-pointer border-b border-l border-border p-1 ${
                        blocked
                          ? "cursor-not-allowed bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)6px,transparent_6px,transparent_12px)]"
                          : "hover:bg-cyan/40 dark:hover:bg-muted"
                      }`}
                    >
                      {[...appts]
                        .sort((x, y) => x.time.localeCompare(y.time))
                        .map((a) => (
                          <button
                            key={a.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ open: true, editId: a.id });
                            }}
                            className={`mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs ${statusColor[a.status]}`}
                          >
                            <span className="num shrink-0 rounded bg-white/60 px-1 py-0.5 font-semibold dark:bg-black/20">
                              {a.time}
                            </span>
                            <span className="truncate">{patientName(a.patientId)}</span>
                          </button>
                        ))}
                      {!blocked && appts.length === 0 && (
                        <span className="num block px-2 py-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          + {String(h).padStart(2, "0")}:00
                        </span>
                      )}
                    </div>
                  );
                })}
              </FragmentRow>
            ))}
          </div>
        </div>
      )}

      <AppointmentModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        defaults={{ date: modal.date, time: modal.time }}
        editId={modal.editId ?? null}
      />

      <Modal open={blockOpen} onClose={() => setBlockOpen(false)} title="Bloquer un créneau" width="max-w-md">
        <div className="space-y-4">
          <Field label="Date">
            <input
              type="date"
              className={`${inputCls} num`}
              value={block.date}
              onChange={(e) => setBlock({ ...block, date: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Début">
              <select
                className={`${inputCls} num`}
                value={block.start}
                onChange={(e) => setBlock({ ...block, start: e.target.value })}
              >
                {slots().map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Fin">
              <select
                className={`${inputCls} num`}
                value={block.end}
                onChange={(e) => setBlock({ ...block, end: e.target.value })}
              >
                {slots().map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Motif">
            <input
              className={inputCls}
              value={block.reason}
              onChange={(e) => setBlock({ ...block, reason: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setBlockOpen(false)}>Annuler</GhostButton>
          <PrimaryButton
            onClick={() => {
              update((d) => ({ ...d, blocks: [...d.blocks, { id: newId(), ...block }] }));
              toast.success("Créneau bloqué");
              setBlockOpen(false);
            }}
          >
            Bloquer
          </PrimaryButton>
        </div>
      </Modal>
    </ScreenTransition>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function MonthView({ cursor, onPick }: { cursor: Date; onPick: (d: Date) => void }) {
  const { data } = useCabinet();
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfMonth(cursor);
  const cells: Date[] = [];
  let cur = start;
  while (cur <= end || cells.length % 7 !== 0) {
    cells.push(cur);
    cur = addDays(cur, 1);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-7 gap-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="label-caps text-center">
            {d}
          </div>
        ))}
        {cells.map((d) => {
          const ds = format(d, "yyyy-MM-dd");
          const count = data.appointments.filter((a) => a.date === ds).length;
          const inMonth = d.getMonth() === cursor.getMonth();
          return (
            <button
              key={ds}
              onClick={() => onPick(d)}
              className={`flex h-20 flex-col items-start rounded-lg border border-border p-2 text-left transition-colors hover:bg-cyan/50 dark:hover:bg-muted ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <span className="num text-sm">{format(d, "d")}</span>
              {count > 0 && (
                <span className="mt-auto flex items-center gap-1 text-xs text-teal">
                  <span className="h-2 w-2 rounded-full bg-surf" /> {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
