import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
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
  const { data, setSettings, reset } = useCabinet();
  const s = data.settings;
  const [fav, setFav] = useState("");
  const [pin, setPin] = useState("");

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
          <div className="grid grid-cols-3 gap-3">
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
