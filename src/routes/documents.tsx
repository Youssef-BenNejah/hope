import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, Eye, FileText, FolderClosed, Image as ImageIcon, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { CabinetDocument } from "@/lib/cabinet/types";
import { fmtDateTime, matches } from "@/lib/cabinet/utils";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { ConfirmModal, Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientPicker } from "@/components/cabinet/PatientPicker";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Cabinet" },
      { name: "description", content: "Dépôt central de documents : analyses, imagerie, courriers et pièces administratives." },
      { property: "og:title", content: "Documents — Cabinet" },
      { property: "og:description", content: "Classez et retrouvez les documents du cabinet, rattachés ou non à un patient." },
    ],
  }),
  component: DocumentsPage,
});

const categories = ["Analyse", "Imagerie", "Courrier", "Compte rendu", "Administratif", "Autre"];

function DocumentsPage() {
  const { data, update, newId } = useCabinet();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");
  const [pending, setPending] = useState<{ name: string; mime: string; dataUrl: string } | null>(null);
  const [form, setForm] = useState({ category: categories[0]!, patientId: null as string | null });
  const [toDelete, setToDelete] = useState<CabinetDocument | null>(null);
  const [preview, setPreview] = useState<CabinetDocument | null>(null);

  const list = useMemo(
    () =>
      [...data.documents]
        .filter((d) => cat === "Tous" || d.category === cat)
        .filter((d) => {
          if (!q) return true;
          const p = data.patients.find((x) => x.id === d.patientId);
          return matches(d.name, q) || matches(p?.name ?? "", q) || matches(d.category, q);
        })
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [data.documents, data.patients, cat, q],
  );

  const onPick = (file: File) => {
    const r = new FileReader();
    r.onload = () => setPending({ name: file.name, mime: file.type || "application/octet-stream", dataUrl: String(r.result) });
    r.readAsDataURL(file);
  };

  const commit = () => {
    if (!pending) return;
    update(
      (d) => ({
        ...d,
        documents: [
          ...d.documents,
          {
            id: newId(),
            name: pending.name,
            mime: pending.mime,
            dataUrl: pending.dataUrl,
            category: form.category,
            uploadedAt: new Date().toISOString(),
            ...(form.patientId ? { patientId: form.patientId } : {}),
          },
        ],
      }),
      `Document ajouté — ${pending.name}`,
    );
    toast.success("Document classé");
    setPending(null);
    setForm({ category: categories[0]!, patientId: null });
  };

  return (
    <ScreenTransition>
      <PageHeader
        title="Documents"
        subtitle={`${data.documents.length} document${data.documents.length > 1 ? "s" : ""} classé${
          data.documents.length > 1 ? "s" : ""
        }`}
        actions={
          <PrimaryButton onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Ajouter un document
          </PrimaryButton>
        }
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Nom, patient, catégorie…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Tous", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                cat === c ? "bg-teal text-white" : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<FolderClosed className="h-10 w-10" />}
          title="Aucun document ne correspond."
          action={
            <PrimaryButton onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Ajouter un document
            </PrimaryButton>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {list.map((d) => {
            const patient = data.patients.find((p) => p.id === d.patientId);
            const isImg = d.mime.startsWith("image/");
            return (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-0 sm:px-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {isImg ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.category}
                    {patient ? ` · ${patient.name}` : " · non rattaché"} · {fmtDateTime(d.uploadedAt)}
                  </p>
                </div>
                {d.dataUrl ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreview(d)}
                      aria-label={`Voir ${d.name}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/10 hover:text-teal"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a
                      href={d.dataUrl}
                      download={d.name}
                      aria-label={`Télécharger ${d.name}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <span className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                    Exemple
                  </span>
                )}
                <button
                  onClick={() => setToDelete(d)}
                  aria-label="Supprimer"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!pending} onClose={() => setPending(null)} title="Classer le document" width="max-w-md">
        {pending && <p className="mb-4 truncate rounded-lg bg-muted px-3 py-2 text-sm">{pending.name}</p>}
        <div className="space-y-4">
          <Field label="Catégorie">
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Rattacher à un patient (facultatif)">
            <PatientPicker
              value={form.patientId}
              onSelect={(id) => setForm({ ...form, patientId: id })}
              allowCreate={false}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setPending(null)}>Annuler</GhostButton>
          <PrimaryButton onClick={commit}>Classer</PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Aperçu"}
        width="max-w-4xl"
      >
        {preview && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {preview.category}
              {preview.patientId
                ? ` · ${data.patients.find((p) => p.id === preview.patientId)?.name ?? ""}`
                : " · non rattaché"}
            </p>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-muted/30">
              {preview.mime.startsWith("image/") ? (
                <img src={preview.dataUrl} alt={preview.name} className="mx-auto max-h-[68vh] w-auto" />
              ) : preview.mime === "application/pdf" ? (
                <iframe title={preview.name} src={preview.dataUrl} className="h-[68vh] w-full" />
              ) : preview.mime.startsWith("text/") ? (
                <iframe title={preview.name} src={preview.dataUrl} className="h-[50vh] w-full bg-white" />
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Aperçu non disponible pour ce type de fichier.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <a
                href={preview.dataUrl}
                download={preview.name}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Télécharger
              </a>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        message={`Supprimer « ${toDelete?.name} » ? Cette action est irréversible.`}
        onConfirm={() => {
          if (!toDelete) return;
          const id = toDelete.id;
          update((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== id) }), `Document supprimé — ${toDelete.name}`);
          toast.success("Document supprimé");
        }}
      />
    </ScreenTransition>
  );
}
