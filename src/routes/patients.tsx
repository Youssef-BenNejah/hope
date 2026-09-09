import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, levenshtein, makePatientCode, matches, today } from "@/lib/cabinet/utils";
import { EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientDrawer } from "@/components/cabinet/PatientDrawer";

export const Route = createFileRoute("/patients")({
  validateSearch: (s: Record<string, unknown>) => ({
    p: typeof s["p"] === "string" ? (s["p"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Patients — Cabinet" },
      { name: "description", content: "Répertoire des patients du cabinet : dossiers, allergies et historique." },
      { property: "og:title", content: "Patients — Cabinet" },
      { property: "og:description", content: "Répertoire des patients : dossiers, allergies et historique." },
    ],
  }),
  component: PatientsPage,
});

const empty = {
  name: "",
  phone: "",
  birthDate: "",
  country: "Tunisie",
  coverage: "cnam" as "cnam" | "assurance" | "aucune",
  insurer: "",
  cnam: "",
  allergies: "",
};

const countries = [
  "Tunisie",
  "Algérie",
  "Maroc",
  "Libye",
  "France",
  "Italie",
  "Allemagne",
  "Canada",
  "Autre",
];

function PatientsPage() {
  const { data, update, newId } = useCabinet();
  const navigate = useNavigate();
  const { p } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [dup, setDup] = useState<string | null>(null);

  const list = data.patients.filter(
    (x) => matches(x.name, query) || matches(x.phone, query) || matches(x.code ?? "", query),
  );

  const lastVisit = (id: string) => {
    const visits = data.appointments.filter((a) => a.patientId === id && a.status === "done");
    if (!visits.length) return "—";
    return fmtDate(visits.sort((a, b) => b.date.localeCompare(a.date))[0]!.date, "dd/MM/yyyy");
  };

  const create = (force = false) => {
    if (!form.name.trim()) return;
    if (!force) {
      const similar = data.patients.find((x) => levenshtein(x.name, form.name) <= 2);
      if (similar) {
        setDup(similar.id);
        return;
      }
    }
    const id = newId();
    update((d) => ({
      ...d,
      patients: [
        ...d.patients,
        {
          id,
          code: makePatientCode(form.name, d.patients.map((x) => x.code)),
          name: form.name,
          phone: form.phone,
          birthDate: form.birthDate,
          country: form.country,
          coverage: form.coverage,
          insurer: form.coverage === "assurance" ? form.insurer : "",
          cnam: form.coverage === "cnam" ? form.cnam : "",
          allergies: form.allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          chronic: [],
          createdAt: today(),
        },
      ],
    }));
    setForm(empty);
    setDup(null);
    setOpen(false);
    toast.success("Patient créé");
  };

  const duplicate = dup ? data.patients.find((x) => x.id === dup) : null;

  return (
    <ScreenTransition>
      <PageHeader
        title="Patients"
        subtitle={`${data.patients.length} dossiers dans le répertoire`}
        actions={
          <PrimaryButton onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nouveau patient
          </PrimaryButton>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Rechercher par nom, téléphone ou identifiant"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Aucun patient ne correspond à cette recherche"
          action={
            <PrimaryButton onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Nouveau patient
            </PrimaryButton>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[140px_minmax(0,1fr)_140px_130px_100px] items-center gap-4 bg-twilight px-5 py-2.5 sm:grid">
            <span className="label-caps text-left text-[#CAF0F8]">Identifiant</span>
            <span className="label-caps text-left text-[#CAF0F8]">Nom</span>
            <span className="label-caps text-left text-[#CAF0F8]">Téléphone</span>
            <span className="label-caps text-left text-[#CAF0F8]">Dernière visite</span>
            <span className="label-caps text-right text-[#CAF0F8]">Statut</span>
          </div>
          {list.map((x) => (
            <button
              key={x.id}
              onClick={() => navigate({ to: "/patients", search: { p: x.id } })}
              className="flex w-full flex-col gap-1 border-b border-border px-4 py-3.5 text-left text-sm transition-colors last:border-0 hover:bg-cyan/40 dark:hover:bg-muted sm:grid sm:grid-cols-[140px_minmax(0,1fr)_140px_130px_100px] sm:items-center sm:gap-4 sm:px-5"
            >
              <span className="order-2 num text-xs font-semibold tracking-wide text-teal sm:order-none">{x.code}</span>
              <span className="order-1 truncate font-medium sm:order-none">{x.name}</span>
              <span className="order-3 num text-xs text-muted-foreground sm:order-none sm:text-sm">{x.phone}</span>
              <span className="num order-4 text-left text-xs text-muted-foreground sm:order-none sm:text-sm">
                <span className="sm:hidden">Dernière visite : </span>
                {lastVisit(x.id)}
              </span>
              <span className="order-5 sm:order-none sm:text-right">
                {x.allergies.length > 0 && (
                  <span className="inline-block rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
                    Allergies
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>


      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau patient">
        <div className="space-y-4">
          <Field label="Nom complet">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">

            <Field label="Téléphone">
              <input
                className={`${inputCls} num`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Date de naissance">
              <input
                type="date"
                className={`${inputCls} num`}
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pays">
              <select
                className={inputCls}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Couverture">
              <select
                className={inputCls}
                value={form.coverage}
                onChange={(e) => setForm({ ...form, coverage: e.target.value as typeof form.coverage })}
              >
                <option value="cnam">CNAM</option>
                <option value="assurance">Assurance privée</option>
                <option value="aucune">Aucune couverture</option>
              </select>
            </Field>
          </div>
          {form.coverage === "cnam" && (
            <Field label="Numéro CNAM">
              <input
                className={`${inputCls} num`}
                value={form.cnam}
                onChange={(e) => setForm({ ...form, cnam: e.target.value })}
              />
            </Field>
          )}
          {form.coverage === "assurance" && (
            <Field label="Nom de l'assurance et numéro d'adhérent">
              <input
                className={inputCls}
                value={form.insurer}
                onChange={(e) => setForm({ ...form, insurer: e.target.value })}
                placeholder="STAR — 123456"
              />
            </Field>
          )}
          <Field label="Allergies (séparées par des virgules)">
            <input
              className={inputCls}
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
          </Field>

          {duplicate && (
            <div className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
              <p>
                Un patient similaire existe déjà : {duplicate.name}, <span className="num">{duplicate.phone}</span>.
                Continuer quand même ?
              </p>
              <div className="mt-3 flex gap-2">
                <GhostButton
                  onClick={() => {
                    setOpen(false);
                    setDup(null);
                    navigate({ to: "/patients", search: { p: duplicate.id } });
                  }}
                >
                  Voir la fiche existante
                </GhostButton>
                <PrimaryButton onClick={() => create(true)}>Créer un nouveau patient</PrimaryButton>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={() => create()}>Enregistrer le patient</PrimaryButton>
        </div>
      </Modal>

      {p && <PatientDrawer patientId={p} onClose={() => navigate({ to: "/patients", search: { p: undefined } })} />}
    </ScreenTransition>
  );
}
