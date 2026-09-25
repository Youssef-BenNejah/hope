import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, EyeOff, KeyRound, Mail, Pencil, Plus, Power, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Doctor, UserRole } from "@/lib/cabinet/types";
import { fmtDate, today } from "@/lib/cabinet/utils";
import { randomPassword } from "@/lib/cabinet/credentials";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { ConfirmModal, Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { SendCredentialsModal } from "@/components/cabinet/SendCredentialsModal";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Cabinet" },
      {
        name: "description",
        content: "Gérez les comptes médecins du cabinet, réinitialisez leurs mots de passe et suivez les statistiques.",
      },
      { property: "og:title", content: "Administration — Cabinet" },
      { property: "og:description", content: "Comptes médecins, mots de passe et statistiques du cabinet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const emptyDoctor = {
  name: "",
  specialty: "",
  email: "",
  phone: "",
  licenseNumber: "",
  password: "",
  role: "medecin" as UserRole,
};

function AdminPage() {
  const { data, update, newId } = useCabinet();
  const doctors = data.doctors ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyDoctor);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);
  const [resetTarget, setResetTarget] = useState<Doctor | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendTarget, setSendTarget] = useState<Doctor | null>(null);
  const [sendPassword, setSendPassword] = useState("");

  const stats = useMemo(
    () => ({
      doctors: doctors.filter((d) => d.active).length,
      patients: data.patients.length,
      appointments: data.appointments.length,
      prescriptions: data.prescriptions.length,
      certificates: data.certificates.length,
    }),
    [data, doctors],
  );

  const activity = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const day = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
        return {
          date: format(subDays(new Date(), 13 - i), "dd/MM", { locale: fr }),
          consultations: data.appointments.filter((a) => a.date === day).length,
        };
      }),
    [data.appointments],
  );

  const specialties = useMemo(() => {
    const map = new Map<string, number>();
    doctors.forEach((d) => map.set(d.specialty || "Non renseignée", (map.get(d.specialty || "Non renseignée") ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [doctors]);

  const colors = ["#0077B6", "#00B4D8", "#90E0EF", "#03045E", "#48CAE4"];

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyDoctor, password: randomPassword() });
    setFormOpen(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    setForm({
      name: doc.name,
      specialty: doc.specialty,
      email: doc.email,
      phone: doc.phone,
      licenseNumber: doc.licenseNumber,
      password: doc.password,
      role: doc.role ?? "medecin",
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Le nom du médecin est obligatoire");
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
    if (editing) {
      const id = editing.id;
      update((d) => ({
        ...d,
        doctors: d.doctors.map((x) => (x.id === id ? { ...x, ...form } : x)),
      }));
      toast.success("Compte médecin mis à jour");
    } else {
      const doc: Doctor = {
        id: newId(),
        ...form,
        active: true,
        createdAt: today(),
      };
      update((d) => ({ ...d, doctors: [...d.doctors, doc] }));
      toast.success(`${doc.name} ajouté — mot de passe ${doc.password}`);
      setSendTarget(doc);
      setSendPassword(doc.password);
    }
    setFormOpen(false);
  };

  const toggleActive = (doc: Doctor) => {
    update((d) => ({
      ...d,
      doctors: d.doctors.map((x) => (x.id === doc.id ? { ...x, active: !x.active } : x)),
    }));
    toast.success(doc.active ? `${doc.name} désactivé` : `${doc.name} réactivé`);
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    if (newPassword.trim().length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    const id = resetTarget.id;
    update((d) => ({
      ...d,
      doctors: d.doctors.map((x) =>
        x.id === id ? { ...x, password: newPassword, lastPasswordResetAt: today() } : x,
      ),
      settings: d.doctors.find((x) => x.id === id)?.name === d.settings.doctorName
        ? { ...d.settings, password: newPassword }
        : d.settings,
    }));
    toast.success(`Nouveau mot de passe pour ${resetTarget.name} : ${newPassword}`);
    setSendTarget(resetTarget);
    setSendPassword(newPassword);
    setResetTarget(null);
  };

  const tiles = [
    { label: "Médecins actifs", value: `${stats.doctors}/${doctors.length}` },
    { label: "Patients", value: String(stats.patients) },
    { label: "Rendez-vous", value: String(stats.appointments) },
    { label: "Ordonnances", value: String(stats.prescriptions) },
    { label: "Certificats", value: String(stats.certificates) },
  ];

  return (
    <ScreenTransition>
      <PageHeader
        title="Administration"
        subtitle="Comptes médecins, codes d'accès et statistiques du cabinet"
        actions={
          <PrimaryButton onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Ajouter un médecin
          </PrimaryButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="label-caps">{t.label}</p>
            <p className="mt-2 num text-3xl font-semibold text-twilight dark:text-frost">{t.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-4 font-semibold">Activité des 14 derniers jours</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                />
                <Bar dataKey="consultations" fill="#0077B6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="mb-4 font-semibold">Répartition par spécialité</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={specialties} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {specialties.map((s, i) => (
                    <Cell key={s.name} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-teal" /> Comptes médecins
          </p>
          <GhostButton onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Nouveau
          </GhostButton>
        </div>

        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-twilight text-left text-[#EAF2FA]">
                <th className="label-caps rounded-l-lg px-3 py-2 text-[#CAF0F8]">Médecin</th>
                <th className="label-caps px-3 py-2 text-[#CAF0F8]">Spécialité</th>
                <th className="label-caps px-3 py-2 text-[#CAF0F8]">Rôle</th>
                <th className="label-caps px-3 py-2 text-[#CAF0F8]">Contact</th>
                <th className="label-caps px-3 py-2 text-[#CAF0F8]">Mot de passe</th>
                <th className="label-caps px-3 py-2 text-[#CAF0F8]">Statut</th>
                <th className="label-caps rounded-r-lg px-3 py-2 text-right text-[#CAF0F8]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <p className="font-medium">{doc.name}</p>
                    <p className="num text-xs text-muted-foreground">{doc.licenseNumber}</p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{doc.specialty}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {doc.role === "secretaire" ? "Secrétaire" : "Médecin"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="truncate">{doc.email}</p>
                    <p className="num text-xs text-muted-foreground">{doc.phone}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="num rounded-md bg-muted px-2 py-1 tracking-[0.15em]">••••••••</span>
                    {doc.lastPasswordResetAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        réinit. {fmtDate(doc.lastPasswordResetAt, "dd/MM/yyyy")}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        doc.active ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                      }`}
                    >
                      {doc.active ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setResetTarget(doc);
                          setNewPassword(randomPassword());
                        }}
                        title="Réinitialiser le mot de passe"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSendTarget(doc);
                          setSendPassword(doc.password);
                        }}
                        title="Envoyer les identifiants par email"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(doc)}
                        title="Modifier"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(doc)}
                        title={doc.active ? "Désactiver" : "Réactiver"}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-warning-soft hover:text-warning"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setToDelete(doc)}
                        title="Supprimer"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Modifier le compte médecin" : "Ajouter un médecin"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Nom Prénom"
            />
          </Field>
          <Field label="Spécialité">
            <input
              className={inputCls}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Médecine générale"
            />
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nom@cabinet.tn"
            />
          </Field>
          <Field label="Téléphone">
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+216 ..."
            />
          </Field>
          <Field label="Numéro d'ordre">
            <input
              className={inputCls}
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder="MG-2020-0000"
            />
          </Field>
          <Field label="Rôle">
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              <option value="medecin">Médecin</option>
              <option value="secretaire">Secrétaire</option>
            </select>
          </Field>
          <Field label="Mot de passe">
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
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setFormOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={save}>{editing ? "Enregistrer" : "Ajouter le médecin"}</PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Réinitialiser le mot de passe"
        width="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Un nouveau mot de passe sera attribué à {resetTarget?.name}. Communiquez-le au médecin concerné (par email).
        </p>
        <div className="mt-4">
          <Field label="Nouveau mot de passe">
            <div className="flex gap-2">
              <input
                className={`${inputCls} num`}
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
          <PrimaryButton onClick={confirmReset}>Réinitialiser</PrimaryButton>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          const id = toDelete.id;
          update((d) => ({ ...d, doctors: d.doctors.filter((x) => x.id !== id) }));
          toast.success("Compte médecin supprimé");
        }}
        message={`Supprimer définitivement le compte de ${toDelete?.name} ?`}
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
