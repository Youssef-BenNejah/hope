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
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [resourceId, setResourceId] = useState("");

  useEffect(() => {
    if (!open) return;
    setPatientId(editing?.patientId ?? defaults?.patientId ?? null);
    setCreatingNew(false);
    setNewName("");
    setPhone("");
    setDate(editing?.date ?? defaults?.date ?? today());
    setTime(editing?.time ?? defaults?.time ?? "09:00");
    setReason(editing?.reason ?? "");
    setCategory(editing?.category ?? "");
    setResourceId(editing?.resourceId ?? "");
  }, [open, editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    let pid = patientId;
    if (!pid && !newName.trim()) {
      toast.error("Sélectionnez un patient ou saisissez le nom du nouveau patient");
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
            code: makePatientCode(newName.trim(), d.patients.map((p) => p.code)),
            name: newName.trim(),
            phone,
            birthDate: "",
            cnam: "",
            allergies: [],
            chronic: [],
            createdAt: today(),
          },
        ];
      }
      const extra = {
        ...(category ? { category } : {}),
        ...(resourceId ? { resourceId } : {}),
      };
      if (editing) {
        next.appointments = d.appointments.map((a) => {
          if (a.id !== editing.id) return a;
          const { category: _c, resourceId: _r, ...base } = a;
          return { ...base, patientId: pid!, date, time, reason, ...extra };
        });
      } else {
        next.appointments = [
          ...next.appointments,
          { id: newId(), patientId: pid!, date, time, reason: reason || "Consultation", status: "upcoming", ...extra },
        ];
      }
      return next;
    });
    const label = patientId ? patientName(patientId) : newName.trim();
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
              setCreatingNew(false);
              setNewName("");
            }}
            onCreate={(name) => {
              setNewName(name);
              setCreatingNew(true);
              setPatientId(null);
            }}
          />
        </Field>

        {creatingNew && (
          <div className="animate-in fade-in slide-in-from-top-1 space-y-3 rounded-lg bg-cyan/60 p-3 dark:bg-muted">
            <p className="text-xs font-medium uppercase tracking-wide text-twilight dark:text-frost">
              Nouveau patient
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom complet">
                <input
                  className={inputCls}
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Prénom Nom"
                />
              </Field>
              <Field label="Téléphone">
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 ..."
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreatingNew(false);
                setNewName("");
                setPhone("");
              }}
              className="text-xs text-muted-foreground hover:text-danger"
            >
              Annuler la création
            </button>
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Catégorie">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— Aucune —</option>
              {data.settings.appointmentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ressource">
            <select className={inputCls} value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
              <option value="">— Aucune —</option>
              {data.settings.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
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
