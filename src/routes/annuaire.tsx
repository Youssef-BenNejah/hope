import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { Contact } from "@/lib/cabinet/types";
import { matches } from "@/lib/cabinet/utils";
import { EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { ConfirmModal, Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";

const kindMeta: Record<Contact["kind"], { avatar: string; badge: string; plural: string }> = {
  Confrère: { avatar: "bg-teal text-white", badge: "bg-frost text-twilight", plural: "Confrères" },
  Laboratoire: { avatar: "bg-surf text-white", badge: "bg-cyan text-twilight", plural: "Laboratoires" },
  Fournisseur: { avatar: "bg-warning text-white", badge: "bg-warning-soft text-warning", plural: "Fournisseurs" },
  Autre: { avatar: "bg-muted-foreground text-white", badge: "bg-muted text-muted-foreground", plural: "Autres" },
};
const groupOrder: Contact["kind"][] = ["Confrère", "Laboratoire", "Fournisseur", "Autre"];
const initials = (name: string) =>
  name
    .replace(/^(Dr\.?|Pr\.?)\s+/i, "")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

export const Route = createFileRoute("/annuaire")({
  head: () => ({
    meta: [
      { title: "Annuaire — Cabinet" },
      { name: "description", content: "Carnet d'adresses des contacts externes : confrères, laboratoires et fournisseurs." },
      { property: "og:title", content: "Annuaire — Cabinet" },
      { property: "og:description", content: "Répertoire des correspondants du cabinet." },
    ],
  }),
  component: DirectoryPage,
});

const kinds: Contact["kind"][] = ["Confrère", "Laboratoire", "Fournisseur", "Autre"];
const empty = {
  name: "",
  kind: "Confrère" as Contact["kind"],
  specialty: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function DirectoryPage() {
  const { data, update, newId } = useCabinet();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Tous" | Contact["kind"]>("Tous");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<Contact | null>(null);

  const list = useMemo(
    () =>
      [...data.contacts]
        .filter((c) => filter === "Tous" || c.kind === filter)
        .filter(
          (c) =>
            !q ||
            matches(c.name, q) ||
            matches(c.specialty ?? "", q) ||
            matches(c.phone ?? "", q) ||
            matches(c.email ?? "", q),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.contacts, filter, q],
  );

  const groups = useMemo(
    () => groupOrder.map((k) => ({ kind: k, items: list.filter((c) => c.kind === k) })).filter((g) => g.items.length),
    [list],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      kind: c.kind,
      specialty: c.specialty ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const payload = {
      name: form.name.trim(),
      kind: form.kind,
      ...(form.specialty.trim() ? { specialty: form.specialty.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };
    if (editing) {
      const id = editing.id;
      update(
        (d) => ({ ...d, contacts: d.contacts.map((x) => (x.id === id ? { id, ...payload } : x)) }),
        `Contact modifié — ${payload.name}`,
      );
      toast.success("Contact mis à jour");
    } else {
      update((d) => ({ ...d, contacts: [...d.contacts, { id: newId(), ...payload }] }), `Contact ajouté — ${payload.name}`);
      toast.success("Contact ajouté");
    }
    setOpen(false);
  };

  return (
    <ScreenTransition>
      <PageHeader
        title="Annuaire"
        subtitle={`${data.contacts.length} contact${data.contacts.length > 1 ? "s" : ""} externe${
          data.contacts.length > 1 ? "s" : ""
        }`}
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau contact
          </PrimaryButton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Nom, spécialité, téléphone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["Tous", ...kinds] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === k ? "bg-teal text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<UsersRound className="h-10 w-10" />} title="Aucun contact ne correspond." />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.kind}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${kindMeta[g.kind].badge}`}>
                  {kindMeta[g.kind].plural}
                </span>
                <span className="num text-xs text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {g.items.map((c) => (
                  <div
                    key={c.id}
                    className="group flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${kindMeta[c.kind].avatar}`}
                    >
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.specialty || c.kind}
                        {c.address ? ` · ${c.address}` : ""}
                      </p>
                      {c.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{c.notes}</p>}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {c.phone && (
                        <a
                          href={telHref(c.phone)}
                          title={`Appeler ${c.phone}`}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-teal hover:bg-teal/10 hover:text-teal"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span className="num hidden sm:inline">{c.phone}</span>
                          <span className="sm:hidden">Appeler</span>
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          title={`Écrire à ${c.email}`}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-teal hover:bg-teal/10 hover:text-teal"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {c.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Voir sur la carte"
                          className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-teal hover:bg-teal/10 hover:text-teal"
                        >
                          <MapPin className="h-4 w-4" />
                        </a>
                      )}
                      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                      <button
                        onClick={() => openEdit(c)}
                        aria-label="Modifier"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-teal"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setToDelete(c)}
                        aria-label="Supprimer"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifier le contact" : "Nouveau contact"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <select
              className={inputCls}
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as Contact["kind"] })}
            >
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Spécialité / activité">
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
          <Field label="Adresse">
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                className={`${inputCls} min-h-20`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={save}>{editing ? "Enregistrer" : "Ajouter"}</PrimaryButton>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        message={`Supprimer le contact « ${toDelete?.name} » ?`}
        onConfirm={() => {
          if (!toDelete) return;
          const id = toDelete.id;
          update((d) => ({ ...d, contacts: d.contacts.filter((x) => x.id !== id) }), `Contact supprimé — ${toDelete.name}`);
          toast.success("Contact supprimé");
        }}
      />
    </ScreenTransition>
  );
}
