import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ClipboardList, FlaskConical, History, Pencil, Pill, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { today } from "@/lib/cabinet/utils";
import { renderFavorite } from "@/lib/cabinet/prescriptions";
import { EXTENDABLE_GROUPS, RED_FLAGS, SYMPTOM_GROUPS } from "@/lib/cabinet/gi-interview";
import { DRUG_CLASSES, type CustomSymptomGroup, type Favorite, type Protocol } from "@/lib/cabinet/types";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { Combobox } from "@/components/cabinet/Combobox";

const emptyFav = { label: "", form: "", posology: "", duration: "", note: "", drugClass: "" };
const emptyProto = { name: "", category: "", note: "", linesText: "" };
const emptySymGroup = { title: "", itemsText: "", extendsGroupId: "" };

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Cabinet" },
      { name: "description", content: "Profil du cabinet, médicaments favoris, sécurité, sauvegarde et apparence." },
      { property: "og:title", content: "Paramètres — Cabinet" },
      { property: "og:description", content: "Profil du cabinet, sécurité, sauvegarde et apparence." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, setSettings, reset, update, newId, currentUser, role } = useCabinet();
  const s = data.settings;
  const [newPassword, setNewPassword] = useState("");
  const [favOpen, setFavOpen] = useState(false);
  const [favEditId, setFavEditId] = useState<string | null>(null);
  const [favForm, setFavForm] = useState(emptyFav);
  const [protoOpen, setProtoOpen] = useState(false);
  const [protoEditId, setProtoEditId] = useState<string | null>(null);
  const [protoForm, setProtoForm] = useState(emptyProto);
  const [symOpen, setSymOpen] = useState(false);
  const [symEditId, setSymEditId] = useState<string | null>(null);
  const [symForm, setSymForm] = useState(emptySymGroup);
  const [builtinOpen, setBuiltinOpen] = useState(false);
  const myGroups = currentUser?.customSymptomGroups ?? [];
  const builtinGroups = [{ id: "flags", title: "Red flags", items: RED_FLAGS.map((f) => f.label) }, ...SYMPTOM_GROUPS.map((g) => ({ id: g.id, title: g.title, items: g.items.map((i) => i.label) }))];
  const myOwnGroups = myGroups.filter((g) => !g.extendsGroupId && g.id !== symEditId);
  const cibleOptions = [
    ...EXTENDABLE_GROUPS,
    ...myOwnGroups.map((g) => ({ id: `custom:${g.id}`, title: g.title })),
  ];

  const favClasses = [...new Set([...DRUG_CLASSES, ...s.favorites.map((f) => f.drugClass ?? "")].filter(Boolean))];

  const openFav = (f?: Favorite) => {
    setFavEditId(f?.id ?? null);
    setFavForm(
      f
        ? {
            label: f.label,
            form: f.form ?? "",
            posology: f.posology,
            duration: f.duration ?? "",
            note: f.note ?? "",
            drugClass: f.drugClass ?? "",
          }
        : emptyFav,
    );
    setFavOpen(true);
  };
  const saveFav = () => {
    if (!favForm.label.trim() || !favForm.posology.trim()) {
      toast.error("Dénomination et posologie sont obligatoires");
      return;
    }
    const payload: Favorite = {
      id: favEditId ?? newId(),
      label: favForm.label.trim(),
      posology: favForm.posology.trim(),
      ...(favForm.form.trim() ? { form: favForm.form.trim() } : {}),
      ...(favForm.duration.trim() ? { duration: favForm.duration.trim() } : {}),
      ...(favForm.note.trim() ? { note: favForm.note.trim() } : {}),
      ...(favForm.drugClass.trim() ? { drugClass: favForm.drugClass.trim() } : {}),
    };
    setSettings({
      favorites: favEditId
        ? s.favorites.map((x) => (x.id === favEditId ? { ...x, ...payload } : x))
        : [...s.favorites, payload],
    });
    toast.success(favEditId ? "Favori modifié" : "Favori ajouté");
    setFavOpen(false);
  };

  const openProto = (p?: Protocol) => {
    setProtoEditId(p?.id ?? null);
    setProtoForm(
      p
        ? { name: p.name, category: p.category ?? "", note: p.note ?? "", linesText: p.lines.join("\n") }
        : emptyProto,
    );
    setProtoOpen(true);
  };
  const saveProto = () => {
    const lines = protoForm.linesText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!protoForm.name.trim() || lines.length === 0) {
      toast.error("Nom et au moins une ligne sont obligatoires");
      return;
    }
    const payload: Protocol = {
      id: protoEditId ?? newId(),
      name: protoForm.name.trim(),
      lines,
      ...(protoForm.category.trim() ? { category: protoForm.category.trim() } : {}),
      ...(protoForm.note.trim() ? { note: protoForm.note.trim() } : {}),
    };
    setSettings({
      protocols: protoEditId
        ? s.protocols.map((x) => (x.id === protoEditId ? payload : x))
        : [...s.protocols, payload],
    });
    toast.success(protoEditId ? "Ordonnance type modifiée" : "Ordonnance type ajoutée");
    setProtoOpen(false);
  };
  const openSym = (g?: CustomSymptomGroup) => {
    setSymEditId(g?.id ?? null);
    setSymForm(
      g
        ? { title: g.title, itemsText: g.items.join("\n"), extendsGroupId: g.extendsGroupId ?? "" }
        : emptySymGroup,
    );
    setSymOpen(true);
  };
  const saveSym = () => {
    if (!currentUser) return;
    const items = symForm.itemsText.split("\n").map((l) => l.trim()).filter(Boolean);
    const extending = !!symForm.extendsGroupId;
    if (!extending && !symForm.title.trim()) {
      toast.error("Le titre du groupe est obligatoire");
      return;
    }
    if (items.length === 0) {
      toast.error("Ajoutez au moins un élément");
      return;
    }
    const target = cibleOptions.find((t) => t.id === symForm.extendsGroupId);
    const payload: CustomSymptomGroup = extending
      ? { id: symEditId ?? newId(), title: target?.title ?? "", items, extendsGroupId: symForm.extendsGroupId }
      : { id: symEditId ?? newId(), title: symForm.title.trim(), items };
    const nextGroups = symEditId
      ? myGroups.map((x) => (x.id === symEditId ? payload : x))
      : [...myGroups, payload];
    update(
      (d) => ({
        ...d,
        doctors: d.doctors.map((x) => (x.id === currentUser.id ? { ...x, customSymptomGroups: nextGroups } : x)),
      }),
      `Groupe d'interrogatoire ${symEditId ? "modifié" : "ajouté"} — ${payload.title}`,
    );
    toast.success(symEditId ? "Groupe modifié" : "Groupe ajouté à votre interrogatoire");
    setSymOpen(false);
  };
  const deleteSym = (g: CustomSymptomGroup) => {
    if (!currentUser) return;
    update(
      (d) => ({
        ...d,
        doctors: d.doctors.map((x) =>
          x.id === currentUser.id
            ? { ...x, customSymptomGroups: myGroups.filter((y) => y.id !== g.id) }
            : x,
        ),
      }),
      `Groupe d'interrogatoire supprimé — ${g.title}`,
    );
    toast.success("Groupe supprimé");
  };
  const [cat, setCat] = useState({ label: "", color: "#0077B6" });
  const [res, setRes] = useState({ name: "", kind: "salle" as "salle" | "équipement" | "praticien" });
  const [holiday, setHoliday] = useState({ date: today(), label: "" });

  return (
    <ScreenTransition>
      <PageHeader title="Paramètres" subtitle="Configuration du cabinet et de l'application" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Profil du cabinet</h2>
          <div className="space-y-4">
            <Field label="Nom du médecin">
              <input className={inputCls} value={s.doctorName} onChange={(e) => setSettings({ doctorName: e.target.value })} />
            </Field>
            <Field label="Spécialité">
              <input className={inputCls} value={s.specialty} onChange={(e) => setSettings({ specialty: e.target.value })} />
            </Field>
            <Field label="Adresse du cabinet">
              <input className={inputCls} value={s.address} onChange={(e) => setSettings({ address: e.target.value })} />
            </Field>
            <Field label="Téléphone du cabinet">
              <input
                className={`${inputCls} num`}
                value={s.phone ?? ""}
                onChange={(e) => setSettings({ phone: e.target.value })}
              />
            </Field>
            <Field label="Numéro d'ordre">
              <input
                className={`${inputCls} num`}
                value={s.licenseNumber}
                onChange={(e) => setSettings({ licenseNumber: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Pill className="h-4 w-4 text-teal" /> Médicaments favoris
            </h2>
            <GhostButton onClick={() => openFav()}>
              <Plus className="h-4 w-4" /> Ajouter
            </GhostButton>
          </div>
          {s.favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun favori. Ils apparaissent en un clic dans l'éditeur d'ordonnances.</p>
          ) : (
            <div className="space-y-4">
              {favClasses
                .map((cls) => ({ cls, items: s.favorites.filter((f) => (f.drugClass ?? "Autre") === cls) }))
                .filter((g) => g.items.length)
                .map(({ cls, items }) => (
                  <div key={cls}>
                    <p className="label-caps mb-1.5 text-teal">{cls}</p>
                    <div className="space-y-1.5">
                      {items
                        .slice()
                        .sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0))
                        .map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="font-medium">{f.label}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                — {f.posology}
                                {f.duration ? `, ${f.duration}` : ""}
                                {f.note ? ` (${f.note})` : ""}
                              </span>
                            </span>
                            {f.uses ? (
                              <span className="num shrink-0 text-[11px] text-muted-foreground">{f.uses}×</span>
                            ) : null}
                            <button
                              onClick={() => openFav(f)}
                              aria-label={`Modifier ${f.label}`}
                              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-teal/10 hover:text-teal"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSettings({ favorites: s.favorites.filter((x) => x.id !== f.id) });
                                toast.success("Favori supprimé");
                              }}
                              aria-label={`Supprimer ${f.label}`}
                              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FlaskConical className="h-4 w-4 text-teal" /> Ordonnances types
            </h2>
            <GhostButton onClick={() => openProto()}>
              <Plus className="h-4 w-4" /> Ajouter
            </GhostButton>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Modèles multi-lignes pour les situations fréquentes — insérés en entier depuis l'éditeur d'ordonnances.
          </p>
          {s.protocols.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ordonnance type.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {s.protocols.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{p.name}</p>
                      {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => openProto(p)}
                        aria-label={`Modifier ${p.name}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-teal/10 hover:text-teal"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSettings({ protocols: s.protocols.filter((x) => x.id !== p.id) });
                          toast.success("Ordonnance type supprimée");
                        }}
                        aria-label={`Supprimer ${p.name}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {p.lines.map((l, i) => (
                      <li key={i} className="truncate">
                        • {l}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        {role === "medecin" && currentUser && (
          <Card className="xl:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ClipboardList className="h-4 w-4 text-teal" /> Interrogatoire structuré — mes groupes
              </h2>
              <GhostButton onClick={() => openSym()}>
                <Plus className="h-4 w-4" /> Ajouter
              </GhostButton>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Créez vos propres groupes de symptômes, ou ajoutez des éléments à un groupe déjà intégré (ex. « Douleur
              abdominale ») — ils apparaissent, sous votre compte uniquement, dans la grille de l'entretien avec le
              patient.
            </p>

            <button
              type="button"
              onClick={() => setBuiltinOpen((v) => !v)}
              className="mb-3 flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-sm font-medium hover:bg-muted"
            >
              Voir les groupes déjà intégrés (HGE)
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${builtinOpen ? "rotate-180" : ""}`} />
            </button>
            {builtinOpen && (
              <div className="mb-4 space-y-3 rounded-lg border border-border p-3">
                {builtinGroups.map((g) => (
                  <div key={g.id}>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">{g.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((it) => (
                        <span key={it} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {myGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun ajout personnalisé pour l'instant.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myGroups.map((g) => (
                  <div key={g.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{g.title}</p>
                        {g.extendsGroupId && (
                          <p className="text-xs text-muted-foreground">Ajout au groupe existant</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => openSym(g)}
                          aria-label={`Modifier ${g.title}`}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-teal/10 hover:text-teal"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSym(g)}
                          aria-label={`Supprimer ${g.title}`}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.items.map((it) => (
                        <span key={it} className="rounded-full bg-teal/10 px-2 py-0.5 text-xs text-teal">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Agenda</h2>
          <Field label="Durée d'une consultation">
            <select
              className={inputCls}
              value={s.consultDuration}
              onChange={(e) => {
                setSettings({ consultDuration: Number(e.target.value) });
                toast.success(`Créneaux de ${e.target.value} minutes appliqués à l'agenda`);
              }}
            >
              {[15, 20, 30, 45, 60].map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </Field>
          <p className="mt-2 text-sm text-muted-foreground">
            L'agenda découpe la journée en créneaux de cette durée (8h — 18h).
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Catégories de rendez-vous</h2>
          <div className="space-y-2">
            {s.appointmentCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) =>
                    setSettings({
                      appointmentCategories: s.appointmentCategories.map((x) =>
                        x.id === c.id ? { ...x, color: e.target.value } : x,
                      ),
                    })
                  }
                  className="h-6 w-6 shrink-0 cursor-pointer rounded border border-border bg-transparent"
                  aria-label={`Couleur ${c.label}`}
                />
                <input
                  className="flex-1 bg-transparent outline-none"
                  value={c.label}
                  onChange={(e) =>
                    setSettings({
                      appointmentCategories: s.appointmentCategories.map((x) =>
                        x.id === c.id ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  onClick={() =>
                    setSettings({ appointmentCategories: s.appointmentCategories.filter((x) => x.id !== c.id) })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  aria-label={`Supprimer ${c.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input type="color" value={cat.color} onChange={(e) => setCat({ ...cat, color: e.target.value })} className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent" aria-label="Couleur de la nouvelle catégorie" />
            <input className={inputCls} placeholder="Nom de la catégorie" value={cat.label} onChange={(e) => setCat({ ...cat, label: e.target.value })} />
            <PrimaryButton
              onClick={() => {
                if (!cat.label.trim()) return;
                setSettings({
                  appointmentCategories: [
                    ...s.appointmentCategories,
                    { id: newId(), label: cat.label.trim(), color: cat.color },
                  ],
                });
                setCat({ label: "", color: "#0077B6" });
                toast.success("Catégorie ajoutée");
              }}
            >
              <Plus className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Ressources</h2>
          <div className="space-y-2">
            {s.resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>
                  {r.name} <span className="text-xs text-muted-foreground">· {r.kind}</span>
                </span>
                <button
                  onClick={() => setSettings({ resources: s.resources.filter((x) => x.id !== r.id) })}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  aria-label={`Supprimer ${r.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {s.resources.length === 0 && <p className="text-sm text-muted-foreground">Aucune ressource définie.</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <input className={inputCls} placeholder="Salle 3, ECG, échographe…" value={res.name} onChange={(e) => setRes({ ...res, name: e.target.value })} />
            <select className={`${inputCls} w-auto`} value={res.kind} onChange={(e) => setRes({ ...res, kind: e.target.value as typeof res.kind })}>
              <option value="salle">Salle</option>
              <option value="équipement">Équipement</option>
              <option value="praticien">Praticien</option>
            </select>
            <PrimaryButton
              onClick={() => {
                if (!res.name.trim()) return;
                setSettings({ resources: [...s.resources, { id: newId(), name: res.name.trim(), kind: res.kind }] });
                setRes({ name: "", kind: "salle" });
                toast.success("Ressource ajoutée");
              }}
            >
              <Plus className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Jours fériés</h2>
          <p className="mb-3 text-sm text-muted-foreground">Les journées listées ici sont bloquées automatiquement dans l'agenda.</p>
          <div className="space-y-2">
            {[...data.holidays]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>
                    <span className="num text-muted-foreground">{h.date}</span> — {h.label}
                  </span>
                  <button
                    onClick={() => update((d) => ({ ...d, holidays: d.holidays.filter((x) => x.id !== h.id) }))}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    aria-label={`Supprimer ${h.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input type="date" className={`${inputCls} num`} value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} />
            <input className={inputCls} placeholder="Intitulé" value={holiday.label} onChange={(e) => setHoliday({ ...holiday, label: e.target.value })} />
            <PrimaryButton
              onClick={() => {
                if (!holiday.label.trim()) return;
                update((d) => ({ ...d, holidays: [...d.holidays, { id: newId(), date: holiday.date, label: holiday.label.trim() }] }));
                setHoliday({ date: today(), label: "" });
                toast.success("Jour férié ajouté");
              }}
            >
              <Plus className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Journal d'activité</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {data.audit.length} action{data.audit.length > 1 ? "s" : ""} tracée{data.audit.length > 1 ? "s" : ""} — dossiers,
            ordonnances, certificats, paiements, contacts.
          </p>
          <Link to="/journal">
            <GhostButton>
              <History className="h-4 w-4" /> Ouvrir le journal
            </GhostButton>
          </Link>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Sécurité</h2>
          <div className="space-y-4">
            <Field label="Nouveau mot de passe (au moins 6 caractères)">
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PrimaryButton
                  onClick={() => {
                    if (newPassword.trim().length < 6) {
                      toast.error("Le mot de passe doit contenir au moins 6 caractères");
                      return;
                    }
                    setSettings({ password: newPassword });
                    if (currentUser) {
                      update((d) => ({
                        ...d,
                        doctors: d.doctors.map((x) =>
                          x.id === currentUser.id ? { ...x, password: newPassword } : x,
                        ),
                      }));
                    }
                    setNewPassword("");
                    toast.success("Mot de passe mis à jour");
                  }}
                >
                  Changer
                </PrimaryButton>
              </div>
            </Field>
            <Field label="Verrouillage automatique">
              <select
                className={inputCls}
                value={s.lockDelay}
                onChange={(e) => setSettings({ lockDelay: Number(e.target.value) })}
              >
                <option value={1}>Après 1 minute</option>
                <option value={5}>Après 5 minutes</option>
                <option value={15}>Après 15 minutes</option>
                <option value={0}>Jamais</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Sauvegarde locale</h2>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "cabinet-sauvegarde.json";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Sauvegarde exportée");
              }}
            >
              Exporter une sauvegarde
            </PrimaryButton>
            <GhostButton onClick={() => toast.success("Sauvegarde restaurée (simulation)")}>
              Restaurer depuis un fichier
            </GhostButton>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Apparence</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ theme: t })}
                className={`rounded-xl border-2 p-3 text-left text-sm ${
                  s.theme === t ? "border-teal" : "border-border"
                }`}
              >
                <div
                  className="mb-2 h-16 rounded-lg border border-border"
                  style={{
                    background:
                      t === "dark"
                        ? "linear-gradient(135deg,#060A1F 60%,#0C1230)"
                        : t === "light"
                          ? "linear-gradient(135deg,#F7FAFC 60%,#CAF0F8)"
                          : "linear-gradient(135deg,#F7FAFC 50%,#060A1F 50%)",
                  }}
                />
                {t === "light" ? "Clair" : t === "dark" ? "Sombre" : "Système"}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Données de démonstration</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Restaure les patients, rendez-vous et recettes d'exemple pour rejouer la démonstration.
          </p>
          <GhostButton
            onClick={() => {
              reset();
              toast.success("Données de démonstration réinitialisées");
            }}
          >
            <RotateCcw className="h-4 w-4" /> Réinitialiser les données
          </GhostButton>
        </Card>
      </div>

      <Modal
        open={favOpen}
        onClose={() => setFavOpen(false)}
        title={favEditId ? "Modifier le favori" : "Nouveau médicament favori"}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <Field label="Dénomination + dosage">
            <input
              className={inputCls}
              autoFocus
              placeholder="Ex. Paracétamol 1 g"
              value={favForm.label}
              onChange={(e) => setFavForm({ ...favForm, label: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Forme">
              <Combobox
                value={favForm.form}
                onChange={(v) => setFavForm({ ...favForm, form: v })}
                options={["comprimé", "gélule", "sachet", "sirop", "solution buvable", "inhalateur", "suppositoire", "crème", "pommade", "collyre", "injectable"]}
                placeholder="comprimé, sirop…"
                addLabel={(t) => `Ajouter « ${t} »`}
              />
            </Field>
            <Field label="Classe thérapeutique">
              <Combobox
                value={favForm.drugClass}
                onChange={(v) => setFavForm({ ...favForm, drugClass: v })}
                options={[...DRUG_CLASSES]}
                placeholder="Antalgique, Antibiotique…"
                addLabel={(t) => `Ajouter la classe « ${t} »`}
              />
            </Field>
          </div>
          <Field label="Posologie">
            <input
              className={inputCls}
              placeholder="Ex. 1 cp x 3/j"
              value={favForm.posology}
              onChange={(e) => setFavForm({ ...favForm, posology: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Durée (facultatif)">
              <input
                className={inputCls}
                placeholder="5 jours, traitement de fond…"
                value={favForm.duration}
                onChange={(e) => setFavForm({ ...favForm, duration: e.target.value })}
              />
            </Field>
            <Field label="Remarque (facultatif)">
              <input
                className={inputCls}
                placeholder="au milieu du repas…"
                value={favForm.note}
                onChange={(e) => setFavForm({ ...favForm, note: e.target.value })}
              />
            </Field>
          </div>
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Ligne générée : <span className="text-foreground">{renderFavorite({ id: "", ...favForm })}</span>
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setFavOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={saveFav}>{favEditId ? "Enregistrer" : "Ajouter"}</PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={protoOpen}
        onClose={() => setProtoOpen(false)}
        title={protoEditId ? "Modifier l'ordonnance type" : "Nouvelle ordonnance type"}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_170px]">
            <Field label="Nom">
              <input
                className={inputCls}
                autoFocus
                placeholder="Ex. Angine bactérienne (adulte)"
                value={protoForm.name}
                onChange={(e) => setProtoForm({ ...protoForm, name: e.target.value })}
              />
            </Field>
            <Field label="Catégorie">
              <input
                className={inputCls}
                placeholder="ORL, Digestif…"
                value={protoForm.category}
                onChange={(e) => setProtoForm({ ...protoForm, category: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Lignes de l'ordonnance (une par ligne)">
            <textarea
              className={`${inputCls} min-h-36`}
              placeholder={"Amoxicilline 1 g - 1 cp matin et soir, 6 jours\nParacétamol 1 g - 1 cp x 3/j si fièvre, 5 jours"}
              value={protoForm.linesText}
              onChange={(e) => setProtoForm({ ...protoForm, linesText: e.target.value })}
            />
          </Field>
          {s.favorites.length > 0 && (
            <div>
              <p className="label-caps mb-1.5 text-muted-foreground">Insérer un favori</p>
              <div className="flex flex-wrap gap-1.5">
                {s.favorites.slice(0, 12).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setProtoForm((p) => ({
                        ...p,
                        linesText: p.linesText ? `${p.linesText}\n${renderFavorite(f)}` : renderFavorite(f),
                      }))
                    }
                    className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-teal hover:bg-teal/10 hover:text-teal"
                  >
                    + {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field label="Note (facultatif)">
            <input
              className={inputCls}
              placeholder="Conditions d'usage, rappel de suivi…"
              value={protoForm.note}
              onChange={(e) => setProtoForm({ ...protoForm, note: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setProtoOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={saveProto}>{protoEditId ? "Enregistrer" : "Ajouter"}</PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={symOpen}
        onClose={() => setSymOpen(false)}
        title={symEditId ? "Modifier le groupe" : "Nouveau groupe de symptômes"}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <Field label="Cible">
            <select
              className={inputCls}
              value={symForm.extendsGroupId}
              onChange={(e) => setSymForm({ ...symForm, extendsGroupId: e.target.value })}
            >
              <option value="">Nouveau groupe indépendant</option>
              {cibleOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  Ajouter à « {t.title} »
                </option>
              ))}
            </select>
          </Field>
          {!symForm.extendsGroupId && (
            <Field label="Titre du groupe">
              <input
                className={inputCls}
                autoFocus
                placeholder="Ex. Symptômes urinaires"
                value={symForm.title}
                onChange={(e) => setSymForm({ ...symForm, title: e.target.value })}
              />
            </Field>
          )}
          <Field label={symForm.extendsGroupId ? "Éléments à ajouter (un par ligne)" : "Éléments à cocher (un par ligne)"}>
            <textarea
              className={`${inputCls} min-h-36`}
              placeholder={"Brûlures mictionnelles\nPollakiurie\nHématurie"}
              value={symForm.itemsText}
              onChange={(e) => setSymForm({ ...symForm, itemsText: e.target.value })}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            {symForm.extendsGroupId
              ? "Ces éléments s'ajoutent à la liste existante du groupe choisi, sans le dupliquer."
              : "Une fois enregistré, ce groupe apparaît dans la grille de l'entretien (Début / Évolution / EVA se complètent automatiquement, comme pour les groupes intégrés)."}
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setSymOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={saveSym}>{symEditId ? "Enregistrer" : "Ajouter"}</PrimaryButton>
        </div>
      </Modal>
    </ScreenTransition>
  );
}
