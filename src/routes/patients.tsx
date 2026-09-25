import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, ClipboardList, FolderOpen, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCabinet } from "@/lib/cabinet/store";
import { ageFrom, fmtDate, levenshtein, makePatientCode, matches, sexLabel, today } from "@/lib/cabinet/utils";
import { EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientDrawer } from "@/components/cabinet/PatientDrawer";
import { DiagnosticModal } from "@/components/cabinet/DiagnosticModal";

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

const emptyForm = {
  name: "",
  phone: "",
  birthDate: "",
  sex: "femme" as "homme" | "femme",
  country: "Tunisie",
  coverage: "cnam" as "cnam" | "assurance" | "aucune",
  insurer: "",
  cnam: "",
  allergies: "",
  profession: "",
  address: "",
};

const countries = ["Tunisie", "Algérie", "Maroc", "Libye", "France", "Italie", "Allemagne", "Canada", "Autre"];
const pageSizes = [10, 25, 50];
type SortKey = "name" | "age" | "visit";

function PatientsPage() {
  const { data, update, newId, role } = useCabinet();
  const navigate = useNavigate();
  const { p } = Route.useSearch();
  const [diag, setDiag] = useState<{ patientId: string; id: string | null } | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "recent">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dup, setDup] = useState<string | null>(null);

  const lastVisitDate = (id: string) => {
    const visits = data.appointments.filter((a) => a.patientId === id && a.status === "done");
    return visits.length ? visits.sort((a, b) => b.date.localeCompare(a.date))[0]!.date : "";
  };
  const lastActivity = (id: string) => {
    const dates = [
      ...data.appointments.filter((a) => a.patientId === id).map((a) => a.date),
      ...data.notes.filter((n) => n.patientId === id).map((n) => n.date),
      data.patients.find((x) => x.id === id)?.createdAt ?? "",
    ].filter(Boolean);
    return dates.sort().at(-1) ?? "";
  };

  const filtered = useMemo(() => {
    let list = data.patients.filter(
      (x) => matches(x.name, query) || matches(x.phone, query) || matches(x.code ?? "", query),
    );
    if (tab === "recent") {
      list = [...list].sort((a, b) => lastActivity(b.id).localeCompare(lastActivity(a.id))).slice(0, 10);
    } else {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sort.key === "name") cmp = a.name.localeCompare(b.name);
        else if (sort.key === "age") cmp = (ageFrom(a.birthDate) ?? -1) - (ageFrom(b.birthDate) ?? -1);
        else cmp = lastVisitDate(a.id).localeCompare(lastVisitDate(b.id));
        return cmp * sort.dir;
      });
    }
    return list;
  }, [data.patients, data.appointments, data.notes, query, tab, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, pageCount);
  const shown = tab === "recent" ? filtered : filtered.slice((safePage - 1) * size, safePage * size);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

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
    update(
      (d) => ({
        ...d,
        patients: [
          ...d.patients,
          {
            id,
            code: makePatientCode(form.name, d.patients.map((x) => x.code)),
            name: form.name,
            phone: form.phone,
            birthDate: form.birthDate,
            sex: form.sex,
            country: form.country,
            coverage: form.coverage,
            insurer: form.coverage === "assurance" ? form.insurer : "",
            cnam: form.coverage === "cnam" ? form.cnam : "",
            allergies: form.allergies.split(",").map((s) => s.trim()).filter(Boolean),
            chronic: [],
            createdAt: today(),
            profession: form.profession.trim(),
            address: form.address.trim(),
          },
        ],
      }),
      `Patient créé — ${form.name.trim()}`,
    );
    setForm(emptyForm);
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Rechercher par nom, téléphone ou identifiant"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1.5">
          {(
            [
              ["all", "Tous"],
              ["recent", "Patients récents"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === k ? "bg-teal text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
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
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="hidden grid-cols-[140px_minmax(0,1fr)_140px_70px_90px_130px_170px] items-center gap-4 bg-twilight px-5 py-2.5 sm:grid">
              <span className="label-caps text-left text-[#CAF0F8]">Identifiant</span>
              <button
                onClick={() => toggleSort("name")}
                className="label-caps flex items-center gap-1 text-left text-[#CAF0F8] hover:text-white"
              >
                Nom <ArrowUpDown className="h-3 w-3" />
              </button>
              <span className="label-caps text-left text-[#CAF0F8]">Téléphone</span>
              <button
                onClick={() => toggleSort("age")}
                className="label-caps flex items-center gap-1 text-left text-[#CAF0F8] hover:text-white"
              >
                Âge <ArrowUpDown className="h-3 w-3" />
              </button>
              <span className="label-caps text-left text-[#CAF0F8]">Sexe</span>
              <button
                onClick={() => toggleSort("visit")}
                className="label-caps flex items-center gap-1 text-left text-[#CAF0F8] hover:text-white"
              >
                Dernière visite <ArrowUpDown className="h-3 w-3" />
              </button>
              <span className="label-caps text-center text-[#CAF0F8]">Actions</span>
            </div>
            {shown.map((x) => (
              <div
                key={x.id}
                className="flex w-full flex-col gap-1 border-b border-border px-4 py-3.5 text-sm transition-colors last:border-0 hover:bg-cyan/40 dark:hover:bg-muted sm:grid sm:grid-cols-[140px_minmax(0,1fr)_140px_70px_90px_130px_170px] sm:items-center sm:gap-4 sm:px-5"
              >
                <button
                  onClick={() => navigate({ to: "/patients", search: { p: x.id } })}
                  className="contents text-left"
                >
                  <span className="order-2 num text-xs font-semibold tracking-wide text-teal sm:order-none">{x.code}</span>
                  <span className="order-1 truncate font-medium sm:order-none">{x.name}</span>
                  <span className="order-3 num text-xs text-muted-foreground sm:order-none sm:text-sm">{x.phone}</span>
                  <span className="order-4 num text-left text-xs text-muted-foreground sm:order-none sm:text-sm">
                    <span className="sm:hidden">Âge : </span>
                    {ageFrom(x.birthDate) !== null ? `${ageFrom(x.birthDate)} ans` : "—"}
                  </span>
                  <span className="order-4 text-left text-xs text-muted-foreground sm:order-none sm:text-sm">
                    <span className="sm:hidden">Sexe : </span>
                    {sexLabel(x.sex)}
                  </span>
                  <span className="num order-4 text-left text-xs text-muted-foreground sm:order-none sm:text-sm">
                    <span className="sm:hidden">Dernière visite : </span>
                    {lastVisitDate(x.id) ? fmtDate(lastVisitDate(x.id), "dd/MM/yyyy") : "—"}
                  </span>
                </button>
                <div className="order-6 flex items-center justify-end gap-2 sm:order-none sm:justify-center">
                  {role !== "secretaire" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDiag({ patientId: x.id, id: null });
                      }}
                      title="Nouvel entretien diagnostic"
                      aria-label={`Nouvel entretien diagnostic pour ${x.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-teal hover:bg-teal/10 hover:text-teal"
                    >
                      <ClipboardList className="h-3.5 w-3.5" /> Entretien
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Actions pour ${x.name}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted data-[state=open]:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuItem onSelect={() => navigate({ to: "/patients", search: { p: x.id } })}>
                        <FolderOpen className="h-4 w-4" /> Ouvrir le dossier
                      </DropdownMenuItem>
                      {role !== "secretaire" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setDiag({ patientId: x.id, id: null })}>
                            <ClipboardList className="h-4 w-4" /> Nouvel entretien diagnostic
                          </DropdownMenuItem>
                          {data.diagnostics
                            .filter((d) => d.patientId === x.id)
                            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                            .slice(0, 3)
                            .map((d) => (
                              <DropdownMenuItem
                                key={d.id}
                                onSelect={() => setDiag({ patientId: x.id, id: d.id })}
                              >
                                <span className="num text-xs text-muted-foreground">
                                  {fmtDate(d.date, "dd/MM/yy")}
                                </span>
                                <span className="truncate">
                                  {d.reason || (d.status === "brouillon" ? "Brouillon" : "Entretien")}
                                </span>
                              </DropdownMenuItem>
                            ))}
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => navigate({ to: "/suivi/$id", params: { id: x.id } })}>
                        Suivi &amp; courbes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {tab === "all" && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Par page</span>
                <select
                  className={`${inputCls} w-auto py-1`}
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {pageSizes.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <span>
                  {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GhostButton
                  className="!px-3 !py-1"
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  disabled={safePage <= 1}
                >
                  Précédent
                </GhostButton>
                <span className="num">
                  {safePage} / {pageCount}
                </span>
                <GhostButton
                  className="!px-3 !py-1"
                  onClick={() => setPage((n) => Math.min(pageCount, n + 1))}
                  disabled={safePage >= pageCount}
                >
                  Suivant
                </GhostButton>
              </div>
            </div>
          )}
        </>
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
          <Field label="Sexe">
            <select
              className={inputCls}
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value as typeof form.sex })}
            >
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </select>
          </Field>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Profession">
              <input
                className={inputCls}
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              />
            </Field>
            <Field label="Adresse">
              <input
                className={inputCls}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
          </div>
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

      <DiagnosticModal
        open={!!diag}
        onClose={() => setDiag(null)}
        patientId={diag?.patientId ?? null}
        diagnosticId={diag?.id ?? null}
      />
    </ScreenTransition>
  );
}
