import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { History, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { today } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, PrimaryButton, inputCls } from "@/components/cabinet/Modal";

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
  const { data, setSettings, reset, update, newId } = useCabinet();
  const s = data.settings;
  const [fav, setFav] = useState("");
  const [pin, setPin] = useState("");
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

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Médicaments favoris</h2>
          <div className="space-y-2">
            {s.favorites.map((f) => (
              <div key={f} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{f}</span>
                <button
                  onClick={() => {
                    setSettings({ favorites: s.favorites.filter((x) => x !== f) });
                    toast.success("Favori supprimé");
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  aria-label={`Supprimer ${f}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className={inputCls}
              placeholder="Ex. Doliprane 500mg — 3x/j"
              value={fav}
              onChange={(e) => setFav(e.target.value)}
            />
            <PrimaryButton
              onClick={() => {
                if (!fav.trim()) return;
                setSettings({ favorites: [...s.favorites, fav] });
                setFav("");
                toast.success("Favori ajouté");
              }}
            >
              <Plus className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </Card>

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
            <Field label="Nouveau code PIN (4 chiffres)">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} num`}
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
                <PrimaryButton
                  onClick={() => {
                    if (pin.length !== 4) {
                      toast.error("Le code doit contenir 4 chiffres");
                      return;
                    }
                    setSettings({ pin });
                    setPin("");
                    toast.success("Code PIN mis à jour");
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
    </ScreenTransition>
  );
}
