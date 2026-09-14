import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  Power,
  Printer,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Doctor } from "@/lib/cabinet/types";
import { fmtDate, resizeImage, today } from "@/lib/cabinet/utils";
import { randomPassword } from "@/lib/cabinet/credentials";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { ConfirmModal, Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { SendCredentialsModal } from "@/components/cabinet/SendCredentialsModal";

export const Route = createFileRoute("/personnel")({
  head: () => ({
    meta: [
      { title: "Personnel — Cabinet" },
      { name: "description", content: "Gestion du personnel du cabinet : dossiers, coordonnées bancaires (RIB) et accès." },
      { property: "og:title", content: "Personnel — Cabinet" },
      { property: "og:description", content: "Fiches du personnel non médical et comptes de connexion." },
    ],
  }),
  component: PersonnelPage,
});

const empty = {
  name: "",
  specialty: "Secrétariat médical",
  email: "",
  phone: "",
  password: "",
  photo: "",
  birthDate: "",
  cin: "",
  address: "",
  hiredAt: today(),
  contractType: "CDI" as NonNullable<Doctor["contractType"]>,
  bank: "",
  rib: "",
  emergencyContact: "",
  notes: "",
};

function PersonnelPage() {
  const { data, update, newId, role } = useCabinet();
  const fileRef = useRef<HTMLInputElement>(null);
  const staff = data.doctors.filter((d) => d.role === "secretaire");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);
  const [resetTarget, setResetTarget] = useState<Doctor | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [detail, setDetail] = useState<Doctor | null>(null);
  const [sendTarget, setSendTarget] = useState<Doctor | null>(null);
  const [sendPassword, setSendPassword] = useState("");

  if (role === "secretaire") {
    return (
      <ScreenTransition>
        <PageHeader title="Personnel" subtitle="Accès réservé au médecin" />
        <EmptyState icon={<Users className="h-10 w-10" />} title="Vous n'avez pas accès à la gestion du personnel." />
      </ScreenTransition>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, hiredAt: today(), password: randomPassword() });
    setFormOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      name: d.name,
      specialty: d.specialty || "Secrétariat médical",
      email: d.email,
      phone: d.phone,
      password: d.password,
      photo: d.photo ?? "",
      birthDate: d.birthDate ?? "",
      cin: d.cin ?? "",
      address: d.address ?? "",
      hiredAt: d.hiredAt ?? "",
      contractType: d.contractType ?? "CDI",
      bank: d.bank ?? "",
      rib: d.rib ?? "",
      emergencyContact: d.emergencyContact ?? "",
      notes: d.notes ?? "",
    });
    setFormOpen(true);
  };

  const pickPhoto = async (file: File) => {
    try {
      const dataUrl = await resizeImage(file, 400);
      setForm((f) => ({ ...f, photo: dataUrl }));
    } catch {
      toast.error("Image non prise en charge");
    }
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error("Une adresse email valide est obligatoire (identifiant de connexion)");
      return;
    }
    if (data.doctors.some((d) => d.email.trim().toLowerCase() === form.email.trim().toLowerCase() && d.id !== editing?.id)) {
      toast.error("Cet email est déjà utilisé par un autre compte");
      return;
    }
    if (form.password.trim().length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    const opt = (v: string) => v.trim();
    const fields = {
      name: form.name.trim(),
      specialty: form.specialty.trim() || "Secrétariat médical",
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: "secretaire" as const,
      ...(form.photo ? { photo: form.photo } : {}),
      ...(opt(form.birthDate) ? { birthDate: form.birthDate } : {}),
      ...(opt(form.cin) ? { cin: form.cin.trim() } : {}),
      ...(opt(form.address) ? { address: form.address.trim() } : {}),
      ...(opt(form.hiredAt) ? { hiredAt: form.hiredAt } : {}),
      contractType: form.contractType,
      ...(opt(form.bank) ? { bank: form.bank.trim() } : {}),
      ...(opt(form.rib) ? { rib: form.rib.trim() } : {}),
      ...(opt(form.emergencyContact) ? { emergencyContact: form.emergencyContact.trim() } : {}),
      ...(opt(form.notes) ? { notes: form.notes.trim() } : {}),
    };

    if (editing) {
      const id = editing.id;
      update(
        (d) => ({
          ...d,
          doctors: d.doctors.map((x) => {
            if (x.id !== id) return x;
            const {
              photo,
              birthDate,
              cin,
              address,
              hiredAt,
              bank,
              rib,
              emergencyContact,
              notes,
              ...base
            } = x;
            return { ...base, ...fields };
          }),
        }),
        `Fiche personnel modifiée — ${fields.name}`,
      );
      toast.success("Fiche mise à jour");
    } else {
      const newDoc: Doctor = { id: newId(), licenseNumber: "—", active: true, createdAt: today(), ...fields };
      update(
        (d) => ({
          ...d,
          doctors: [...d.doctors, newDoc],
        }),
        `Personnel ajouté — ${fields.name}`,
      );
      toast.success(`${fields.name} ajouté(e) — mot de passe ${fields.password}`);
      setSendTarget(newDoc);
      setSendPassword(newDoc.password);
    }
    setFormOpen(false);
  };

  const toggleActive = (d: Doctor) => {
    update(
      (data2) => ({
        ...data2,
        doctors: data2.doctors.map((x) => (x.id === d.id ? { ...x, active: !x.active } : x)),
      }),
      `${d.active ? "Compte personnel désactivé" : "Compte personnel réactivé"} — ${d.name}`,
    );
    toast.success(d.active ? `${d.name} désactivé(e)` : `${d.name} réactivé(e)`);
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    if (newPassword.trim().length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    const id = resetTarget.id;
    update(
      (d) => ({
        ...d,
        doctors: d.doctors.map((x) => (x.id === id ? { ...x, password: newPassword, lastPasswordResetAt: today() } : x)),
      }),
      `Mot de passe réinitialisé — ${resetTarget.name}`,
    );
    toast.success(`Nouveau mot de passe pour ${resetTarget.name} : ${newPassword}`);
    setSendTarget(resetTarget);
    setSendPassword(newPassword);
    setResetTarget(null);
  };

  const printFiche = (d: Doctor) => {
    const esc = (t: string) => (t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const row = (k: string, v?: string) =>
      `<tr><th>${esc(k)}</th><td>${v ? esc(v) : "—"}</td></tr>`;
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche personnel — ${esc(d.name)}</title>
<style>@page{size:A4;margin:18mm}body{font-family:Arial,Helvetica,sans-serif;color:#0B1220;font-size:12px}
h1{font-size:18px;margin:0 0 2px}.muted{color:#5B6472;font-size:11px}
.head{border-bottom:2px solid #0077B6;padding-bottom:10px;margin-bottom:18px}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #E2E8F0;padding:6px 4px;text-align:left;vertical-align:top}
th{width:38%;color:#0077B6;font-weight:600}</style></head><body>
<div class="head"><h1>${esc(data.settings.doctorName)}</h1>
<p class="muted">${esc(data.settings.specialty)} — ${esc(data.settings.address)}</p></div>
<h1>Fiche personnel — ${esc(d.name)}</h1>
<p class="muted">Éditée le ${fmtDate(today())}</p>
<table>
${row("Poste", d.specialty)}
${row("Type de contrat", d.contractType)}
${row("Date d'embauche", d.hiredAt ? fmtDate(d.hiredAt) : "")}
${row("Date de naissance", d.birthDate ? fmtDate(d.birthDate) : "")}
${row("CIN", d.cin)}
${row("Téléphone", d.phone)}
${row("Email", d.email)}
${row("Adresse", d.address)}
${row("Contact d'urgence", d.emergencyContact)}
${row("Banque", d.bank)}
${row("RIB", d.rib)}
${row("Notes", d.notes)}
</table></body></html>`;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) {
      toast.error("Autorisez les fenêtres contextuelles pour imprimer la fiche");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => w.print(), 300);
  };

  return (
    <ScreenTransition>
      <PageHeader
        title="Personnel"
        subtitle={`${staff.length} membre${staff.length > 1 ? "s" : ""} du personnel · comptes de connexion`}
        actions={
          <PrimaryButton onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Ajouter un membre
          </PrimaryButton>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickPhoto(f);
          e.target.value = "";
        }}
      />

      {staff.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Aucun membre du personnel enregistré."
          action={
            <PrimaryButton onClick={openCreate}>
              <UserPlus className="h-4 w-4" /> Ajouter un membre
            </PrimaryButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((d) => (
            <Card key={d.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {d.photo ? (
                  <img src={d.photo} alt={d.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-frost text-lg font-semibold text-twilight">
                    {d.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialty}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        d.active ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                      }`}
                    >
                      {d.active ? "Actif" : "Désactivé"}
                    </span>
                    {d.contractType && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{d.contractType}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 text-sm text-muted-foreground">
                {d.phone && <p className="num">{d.phone}</p>}
                {d.email && <p className="truncate">{d.email}</p>}
                {d.rib && <p className="num text-xs">RIB {d.rib}</p>}
              </div>

              <div className="mt-auto flex flex-wrap gap-1">
                <button
                  onClick={() => setDetail(d)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                >
                  Fiche
                </button>
                <button
                  onClick={() => openEdit(d)}
                  title="Modifier"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setResetTarget(d);
                    setNewPassword(randomPassword());
                  }}
                  title="Réinitialiser le mot de passe"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSendTarget(d);
                    setSendPassword(d.password);
                  }}
                  title="Envoyer les identifiants par email"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleActive(d)}
                  title={d.active ? "Désactiver" : "Réactiver"}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-warning-soft hover:text-warning"
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setToDelete(d)}
                  title="Supprimer"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Modifier la fiche personnel" : "Nouveau membre du personnel"}
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {form.photo ? (
              <img src={form.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users className="h-6 w-6" />
              </span>
            )}
            <div className="flex gap-2">
              <GhostButton type="button" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Photo
              </GhostButton>
              {form.photo && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, photo: "" })}
                  className="text-sm text-muted-foreground hover:text-danger"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Poste / fonction">
              <input
                className={inputCls}
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              />
            </Field>
            <Field label="Téléphone">
              <input
                className={`${inputCls} num`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Date de naissance">
              <input
                type="date"
                className={`${inputCls} num`}
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </Field>
            <Field label="CIN (carte d'identité)">
              <input
                className={`${inputCls} num`}
                value={form.cin}
                onChange={(e) => setForm({ ...form, cin: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adresse">
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Date d'embauche">
              <input
                type="date"
                className={`${inputCls} num`}
                value={form.hiredAt}
                onChange={(e) => setForm({ ...form, hiredAt: e.target.value })}
              />
            </Field>
            <Field label="Type de contrat">
              <select
                className={inputCls}
                value={form.contractType}
                onChange={(e) =>
                  setForm({ ...form, contractType: e.target.value as NonNullable<Doctor["contractType"]> })
                }
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Temps partiel">Temps partiel</option>
                <option value="Stage">Stage</option>
              </select>
            </Field>
            <Field label="Banque">
              <input className={inputCls} value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
            </Field>
            <Field label="RIB (20 chiffres)">
              <input
                className={`${inputCls} num`}
                value={form.rib}
                onChange={(e) => setForm({ ...form, rib: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Contact d'urgence">
                <input
                  className={inputCls}
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="Nom (lien de parenté) — téléphone"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  className={`${inputCls} min-h-20`}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Mot de passe de connexion">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    className={`${inputCls} pr-10`}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <GhostButton type="button" onClick={() => setForm({ ...form, password: randomPassword() })}>
                  Générer
                </GhostButton>
              </div>
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setFormOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={save}>{editing ? "Enregistrer" : "Ajouter le membre"}</PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Fiche — ${detail.name}` : ""}
        width="max-w-lg"
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              {detail.photo ? (
                <img src={detail.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-frost text-lg font-semibold text-twilight">
                  {detail.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </span>
              )}
              <div>
                <p className="font-medium">{detail.name}</p>
                <p className="text-xs text-muted-foreground">
                  {detail.specialty} · {detail.contractType ?? "—"}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
              {[
                ["Téléphone", detail.phone],
                ["Email", detail.email],
                ["Date de naissance", detail.birthDate ? fmtDate(detail.birthDate) : ""],
                ["CIN", detail.cin],
                ["Adresse", detail.address],
                ["Date d'embauche", detail.hiredAt ? fmtDate(detail.hiredAt) : ""],
                ["Banque", detail.bank],
                ["RIB", detail.rib],
                ["Contact d'urgence", detail.emergencyContact],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-caps">{k}</dt>
                  <dd className="mt-0.5 num break-words">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {detail.notes && (
              <div>
                <p className="label-caps mb-1">Notes</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{detail.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => printFiche(detail)}>
                <Printer className="h-4 w-4" /> Imprimer la fiche
              </GhostButton>
              <PrimaryButton
                onClick={() => {
                  openEdit(detail);
                  setDetail(null);
                }}
              >
                <Pencil className="h-4 w-4" /> Modifier
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Réinitialiser le mot de passe" width="max-w-md">
        <p className="text-sm text-muted-foreground">
          Un nouveau mot de passe sera attribué à {resetTarget?.name}. Communiquez-le à la personne concernée (par email).
        </p>
        <div className="mt-4">
          <Field label="Nouveau mot de passe">
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <GhostButton type="button" onClick={() => setNewPassword(randomPassword())}>
                Générer
              </GhostButton>
            </div>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setResetTarget(null)}>Annuler</GhostButton>
          <PrimaryButton onClick={confirmReset}>
            <BadgeCheck className="h-4 w-4" /> Réinitialiser
          </PrimaryButton>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        message={`Supprimer définitivement la fiche et l'accès de ${toDelete?.name} ?`}
        onConfirm={() => {
          if (!toDelete) return;
          const id = toDelete.id;
          update((d) => ({ ...d, doctors: d.doctors.filter((x) => x.id !== id) }), `Personnel supprimé — ${toDelete.name}`);
          toast.success("Fiche supprimée");
        }}
      />

      <SendCredentialsModal
        open={!!sendTarget}
        onClose={() => setSendTarget(null)}
        doc={sendTarget}
        password={sendPassword}
        cabinetName={data.settings.doctorName}
      />
    </ScreenTransition>
  );
}
