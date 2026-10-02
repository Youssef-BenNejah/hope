import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import type { CabinetCreated } from "@/lib/api";
import { useCreateCabinet } from "./queries";

const EMAIL = /^\S+@\S+\.\S+$/;
const empty = {
  name: "",
  cabinetName: "",
  email: "",
  specialty: "",
  phone: "",
  licenseNumber: "",
  sendCredentialsByEmail: true,
};

/** "Ajouter un médecin": creates the doctor together with his own cabinet (POST /cabinets). */
export function AddDoctorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CabinetCreated) => void;
}) {
  const [form, setForm] = useState(empty);
  const create = useCreateCabinet();

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const t = (s: string) => s.trim();
    if (!t(form.name)) return void toast.error("Le nom du médecin est obligatoire");
    if (!t(form.cabinetName)) return void toast.error("Le nom du cabinet est obligatoire");
    if (!EMAIL.test(t(form.email))) return void toast.error("Une adresse email valide est obligatoire");

    create.mutate(
      {
        cabinetName: t(form.cabinetName),
        doctorName: t(form.name),
        doctorEmail: t(form.email),
        sendCredentialsByEmail: form.sendCredentialsByEmail,
        ...(t(form.phone) && { doctorPhone: t(form.phone) }),
        ...(t(form.specialty) && { doctorSpecialty: t(form.specialty) }),
        ...(t(form.licenseNumber) && { licenseNumber: t(form.licenseNumber) }),
      },
      {
        onSuccess: (res) => {
          onClose();
          onCreated(res);
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un médecin">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du médecin">
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Nom de son cabinet">
          <input className={inputCls} value={form.cabinetName} onChange={(e) => set("cabinetName", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Spécialité">
          <input className={inputCls} value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Numéro d'ordre">
          <input className={inputCls} value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.sendCredentialsByEmail}
          onChange={(e) => set("sendCredentialsByEmail", e.target.checked)}
          className="h-4 w-4 accent-[#0077B6]"
        />
        Envoyer les identifiants au médecin par email
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <GhostButton onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Création…" : "Ajouter le médecin"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
