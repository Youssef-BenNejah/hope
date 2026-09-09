import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { makePatientCode, slots, today } from "@/lib/cabinet/utils";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "./Modal";
import { PatientPicker } from "./PatientPicker";

const suggestions = ["Contrôle", "Première consultation", "Suivi", "Renouvellement d'ordonnance"];

export function AppointmentModal({
  open,
  onClose,
  defaults,
  editId,
}: {
  open: boolean;
  onClose: () => void;
  defaults?: { date?: string | undefined; time?: string | undefined; patientId?: string | undefined };
  editId?: string | null;
}) {
  const { data, update, newId, patientName } = useCabinet();
  const editing = editId ? data.appointments.find((a) => a.id === editId) : undefined;

  const [patientId, setPatientId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setPatientId(editing?.patientId ?? defaults?.patientId ?? null);
    setNewName("");
    setPhone("");
    setDate(editing?.date ?? defaults?.date ?? today());
    setTime(editing?.time ?? defaults?.time ?? "09:00");
    setReason(editing?.reason ?? "");
  }, [open, editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    let pid = patientId;
    if (!pid && !newName) {
      toast.error("Sélectionnez un patient");
      return;
    }
    update((d) => {
      const next = { ...d };
      if (!pid) {
        pid = newId();
        next.patients = [
          ...d.patients,
          {
            id: pid,
            code: makePatientCode(newName, d.patients.map((p) => p.code)),
            name: newName,
            phone,
            birthDate: "",
            cnam: "",
            allergies: [],
            chronic: [],
            createdAt: today(),
          },
        ];
      }
      if (editing) {
        next.appointments = d.appointments.map((a) =>
          a.id === editing.id ? { ...a, patientId: pid!, date, time, reason } : a,
        );
      } else {
        next.appointments = [
          ...next.appointments,
          { id: newId(), patientId: pid!, date, time, reason: reason || "Consultation", status: "upcoming" },
        ];
      }
      return next;
    });
    const label = patientId ? patientName(patientId) : newName;
    toast.success(
      editing ? `Rendez-vous modifié pour ${label}` : `Rendez-vous ajouté pour ${label} à ${time}`,
    );
    onClose();
  };

  const cancelAppointment = () => {
    if (!editing) return;
    update((d) => ({ ...d, appointments: d.appointments.filter((a) => a.id !== editing.id) }));
    toast.success("Rendez-vous annulé");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}>
      <div className="space-y-4">
        <Field label="Patient">
          <PatientPicker
            value={patientId}
            onSelect={(id) => {
              setPatientId(id);
              setNewName("");
            }}
            onCreate={(name) => {
              setNewName(name);
              setPatientId(null);
            }}
          />
        </Field>

        {newName && (
          <div className="animate-in fade-in slide-in-from-top-1 space-y-2 rounded-lg bg-cyan/60 p-3 dark:bg-muted">
            <p className="text-sm text-twilight dark:text-foreground">
              Nouveau patient : <strong>{newName}</strong>
            </p>
            <Field label="Téléphone">
              <input
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 ..."
              />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" className={`${inputCls} num`} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Heure">
            <select className={`${inputCls} num`} value={time} onChange={(e) => setTime(e.target.value)}>
              {slots(data.settings.consultDuration || 30).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Motif de consultation">
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setReason(s)}
              className="rounded-full bg-frost/50 px-3 py-1 text-xs font-medium text-twilight transition-colors hover:bg-frost dark:bg-muted dark:text-frost"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        {editing ? (
          <button onClick={cancelAppointment} className="rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft">
            Annuler le rendez-vous
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <GhostButton onClick={onClose}>Annuler</GhostButton>
          <PrimaryButton onClick={save}>Enregistrer le rendez-vous</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
