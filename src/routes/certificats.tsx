import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Baby, Copy, Dumbbell, FilePlus2, FileText, GraduationCap, Syringe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, today } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { ConfirmModal, Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientPicker } from "@/components/cabinet/PatientPicker";

export const Route = createFileRoute("/certificats")({
  validateSearch: (s: Record<string, unknown>) => ({
    patient: typeof s["patient"] === "string" ? (s["patient"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Certificats — Cabinet" },
      { name: "description", content: "Modèles de certificats médicaux et journal des documents émis." },
      { property: "og:title", content: "Certificats — Cabinet" },
      { property: "og:description", content: "Modèles de certificats médicaux et journal des documents émis." },
    ],
  }),
  component: CertificatesPage,
});

const builtinTemplates: { type: string; icon: typeof FileText; base: string }[] = [
  { type: "Arrêt de travail", icon: FileText, base: "" },
  {
    type: "Aptitude sportive",
    icon: Dumbbell,
    base: "Je soussigné certifie que le patient ne présente aucune contre-indication apparente à la pratique du sport en compétition.",
  },
  {
    type: "Certificat scolaire",
    icon: GraduationCap,
    base: "Je soussigné certifie que l'état de santé du patient justifie son absence scolaire.",
  },
  {
    type: "Certificat de grossesse",
    icon: Baby,
    base: "Je soussigné certifie que la patiente est enceinte, grossesse évolutive constatée ce jour.",
  },
  {
    type: "Certificat de vaccination",
    icon: Syringe,
    base: "Je soussigné certifie que le patient a reçu les vaccinations obligatoires à jour.",
  },
];

function CertificatesPage() {
  const { data, update, setSettings, newId, patientName } = useCabinet();
  const { patient: presetPatient } = Route.useSearch();
  const [active, setActive] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(presetPatient ?? null);
  const [startDate, setStartDate] = useState(today());
  const [days, setDays] = useState(3);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(false);
  const [detail, setDetail] = useState<(typeof data.certificates)[number] | null>(null);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [newTplOpen, setNewTplOpen] = useState(false);
  const [newTpl, setNewTpl] = useState({ type: "", text: "" });
  const [tplToDelete, setTplToDelete] = useState<string | null>(null);

  const customTemplates = data.settings.certificateTemplates ?? [];
  const allTemplates = [
    ...builtinTemplates.map((t) => ({ ...t, custom: false })),
    ...customTemplates.map((t) => ({ type: t.type, icon: FileText, base: t.text, custom: true })),
  ];

  const shownCertificates = month
    ? data.certificates.filter((c) => c.documentDate.startsWith(month))
    : data.certificates;

  const endDate = format(addDays(parseISO(startDate), days), "yyyy-MM-dd");
  const isSick = active === "Arrêt de travail";
  const body = isSick
    ? `Je soussigné ${data.settings.doctorName} certifie que l'état de santé de ${
        patientId ? patientName(patientId) : "…"
      } nécessite un arrêt de travail de ${days} jour(s), du ${fmtDate(startDate)} au ${fmtDate(endDate)}.`
    : text;

  const openTemplate = (t: { type: string; base: string }) => {
    setActive(t.type);
    setText(t.base);
    setPreview(false);
  };

  const saveTemplate = () => {
    const type = newTpl.type.trim();
    if (!type) {
      toast.error("Donnez un nom au modèle");
      return;
    }
    if (
      [...builtinTemplates.map((b) => b.type), ...customTemplates.map((c) => c.type)].some(
        (t) => t.toLowerCase() === type.toLowerCase(),
      )
    ) {
      toast.error("Ce modèle existe déjà");
      return;
    }
    setSettings({ certificateTemplates: [...customTemplates, { type, text: newTpl.text.trim() }] });
    toast.success("Modèle ajouté");
    setNewTpl({ type: "", text: "" });
    setNewTplOpen(false);
  };

  const printCertificate = (type: string, content: string, docDate: string, patient?: string) => {
    const s = data.settings;
    const esc = (t: string) => (t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(type)}${
      patient ? " — " + esc(patient) : ""
    }</title>
<style>
@page{size:A4;margin:22mm}
*{box-sizing:border-box}
body{font-family:Georgia,"Times New Roman",serif;color:#0B1220;font-size:13.5px;line-height:1.7}
.head{border-bottom:2px solid #0077B6;padding-bottom:12px;margin-bottom:32px}
.head .name{font-size:16px;font-weight:bold;color:#0077B6}
.head .muted{color:#5B6472;font-size:11.5px}
h1{text-align:center;font-size:16px;letter-spacing:.08em;text-transform:uppercase;margin:36px 0}
.body{white-space:pre-wrap;margin:0 8px}
.sign{margin-top:64px;text-align:right}
.sign .place{color:#5B6472;font-size:12px}
.sign .who{margin-top:48px;font-weight:bold}
.foot{position:fixed;bottom:12mm;left:22mm;right:22mm;border-top:1px solid #E2E8F0;padding-top:6px;color:#8B94A3;font-size:10px;text-align:center}
</style></head><body>
<div class="head">
  <div class="name">${esc(s.doctorName)}</div>
  <div class="muted">${esc(s.specialty)}</div>
  <div class="muted">${esc(s.address)}${s.phone ? " · Tél. " + esc(s.phone) : ""}</div>
  <div class="muted">N° d'ordre : ${esc(s.licenseNumber)}</div>
</div>
<h1>${esc(type)}</h1>
<p class="body">${esc(content) || "…"}</p>
<div class="sign">
  <div class="place">Sousse, le ${esc(fmtDate(docDate))}</div>
  <div class="who">${esc(s.doctorName)}</div>
  <div class="muted" style="color:#5B6472;font-size:11px">Signature et cachet</div>
</div>
<div class="foot">${esc(s.address)} · Tél. ${esc(s.phone ?? "")} · N° d'ordre ${esc(s.licenseNumber)}</div>
</body></html>`;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) {
      toast.error("Autorisez les fenêtres contextuelles pour générer le PDF");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => w.print(), 350);
    toast.success("Fenêtre d'impression ouverte — choisissez « Enregistrer au format PDF »");
  };

  const save = () => {
    if (!patientId || !active) {
      toast.error("Sélectionnez un patient");
      return;
    }
    update((d) => ({
      ...d,
      certificates: [
        ...d.certificates,
        {
          id: newId(),
          patientId,
          type: active,
          documentDate: today(),
          ...(isSick ? { startDate, days, endDate } : {}),
          text: body,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    toast.success("Certificat enregistré dans le dossier du patient");
    setActive(null);
    setPreview(false);
  };

  const duplicateCertificate = (c: (typeof data.certificates)[number]) => {
    update((d) => ({
      ...d,
      certificates: [
        ...d.certificates,
        { ...c, id: newId(), documentDate: today(), createdAt: new Date().toISOString() },
      ],
    }));
    toast.success("Certificat dupliqué");
  };

  return (
    <ScreenTransition>
      <PageHeader title="Certificats" subtitle="Générez un document à partir d'un modèle" />

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {allTemplates.map((t) => (
          <div
            key={t.type}
            className="group relative flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-teal hover:bg-cyan/40 dark:hover:bg-muted"
          >
            <button onClick={() => openTemplate(t)} className="flex flex-col items-start gap-3 text-left">
              <t.icon className="h-6 w-6 text-teal" />
              <span className="text-sm font-medium">{t.type}</span>
            </button>
            {t.custom && (
              <button
                onClick={() => setTplToDelete(t.type)}
                aria-label={`Supprimer le modèle ${t.type}`}
                className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => {
            setNewTpl({ type: "", text: "" });
            setNewTplOpen(true);
          }}
          className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong bg-card p-5 text-left text-muted-foreground transition-colors hover:border-teal hover:text-teal"
        >
          <FilePlus2 className="h-6 w-6" />
          <span className="text-sm font-medium">Nouveau modèle</span>
        </button>
      </div>

      <Card className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">Journal des certificats</p>
          <div className="flex items-center gap-2">
            <input
              type="month"
              className={`${inputCls} num w-auto`}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <GhostButton onClick={() => setMonth(month ? "" : today().slice(0, 7))}>
              {month ? "Tous les mois" : "Ce mois-ci"}
            </GhostButton>
          </div>
        </div>
        <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[640px] text-sm">

          <thead>
            <tr className="bg-twilight text-left">
              {["Patient", "Type", "Date d'émission", "Date du document", ""].map((h) => (
                <th key={h} className="label-caps px-3 py-2 text-[#CAF0F8]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shownCertificates.map((c) => (
              <tr
                key={c.id}
                onClick={() => setDetail(c)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-cyan/40 dark:hover:bg-muted"
              >
                <td className="px-3 py-2.5">{patientName(c.patientId)}</td>
                <td className="px-3 py-2.5">{c.type}</td>
                <td
                  className="num px-3 py-2.5 text-muted-foreground"
                  title={`Émis le ${format(new Date(c.createdAt), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}`}
                >
                  {fmtDate(c.documentDate, "dd/MM/yyyy")}
                </td>
                <td className="num px-3 py-2.5 text-muted-foreground">
                  {c.startDate ? fmtDate(c.startDate, "dd/MM/yyyy") : fmtDate(c.documentDate, "dd/MM/yyyy")}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateCertificate(c);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" /> Dupliquer / Renouveler
                  </button>
                </td>
              </tr>
            ))}
            {shownCertificates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  {month ? "Aucun certificat pour ce mois." : "Aucun certificat émis pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>


      <Modal open={!!active} onClose={() => setActive(null)} title={active ?? ""} width="max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Patient">
              <PatientPicker value={patientId} onSelect={setPatientId} allowCreate={false} />
            </Field>
            {isSick ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date de début">
                    <input
                      type="date"
                      className={`${inputCls} num`}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Nombre de jours">
                    <input
                      type="number"
                      min={1}
                      className={`${inputCls} num`}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    />
                  </Field>
                </div>
                <p className="rounded-lg bg-cyan px-4 py-2.5 text-sm text-twilight dark:bg-muted dark:text-frost">
                  Fin de l'arrêt : <span className="num">{fmtDate(endDate)}</span>
                </p>
              </>
            ) : (
              <Field label="Texte du certificat">
                <textarea className={`${inputCls} min-h-32`} value={text} onChange={(e) => setText(e.target.value)} />
              </Field>
            )}
            <div className="flex gap-2">
              <PrimaryButton
                onClick={() => {
                  if (!patientId) {
                    toast.error("Sélectionnez un patient");
                    return;
                  }
                  printCertificate(active ?? "", body, today(), patientName(patientId));
                  setPreview(true);
                }}
              >
                Générer le PDF
              </PrimaryButton>
              <GhostButton onClick={save}>Enregistrer dans le dossier</GhostButton>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-6 text-[#0B1220] shadow-inner">
            <p className="text-sm font-semibold">{data.settings.doctorName}</p>
            <p className="text-xs text-[#5B6472]">{data.settings.specialty}</p>
            <p className="text-xs text-[#5B6472]">{data.settings.address}</p>
            <p className="text-xs text-[#5B6472]">N° d'ordre : {data.settings.licenseNumber}</p>
            <hr className="my-4 border-[#E2E8F0]" />
            <p className="text-center text-sm font-semibold uppercase tracking-wide">{active}</p>
            <p className="mt-6 text-sm leading-relaxed">{body || "…"}</p>
            <p className="mt-8 text-right text-xs">
              Sousse, le {fmtDate(today())}
              <br />
              {data.settings.doctorName}
            </p>
          </div>
        </div>

        {preview && (
          <div className="mt-6 flex flex-wrap justify-end gap-2 rounded-lg bg-success-soft px-4 py-3">
            <span className="mr-auto text-sm text-success">Fenêtre d'impression ouverte.</span>
            <GhostButton
              onClick={() => printCertificate(active ?? "", body, today(), patientId ? patientName(patientId) : undefined)}
            >
              Ré-ouvrir le PDF
            </GhostButton>
            <PrimaryButton onClick={save}>Enregistrer dans le dossier du patient</PrimaryButton>
          </div>
        )}
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.type ?? "Détail du certificat"} width="max-w-2xl">
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
              <div>
                <p className="label-caps">Patient</p>
                <p className="mt-1 font-medium">{patientName(detail.patientId)}</p>
              </div>
              <div>
                <p className="label-caps">Type</p>
                <p className="mt-1 font-medium">{detail.type}</p>
              </div>
              <div>
                <p className="label-caps">Date d'émission</p>
                <p className="mt-1 num">
                  {format(new Date(detail.createdAt), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="label-caps">Date du document</p>
                <p className="mt-1 num">{fmtDate(detail.documentDate, "dd/MM/yyyy")}</p>
              </div>
              {detail.startDate && (
                <div>
                  <p className="label-caps">Début</p>
                  <p className="mt-1 num">{fmtDate(detail.startDate, "dd/MM/yyyy")}</p>
                </div>
              )}
              {detail.endDate && (
                <div>
                  <p className="label-caps">Fin</p>
                  <p className="mt-1 num">{fmtDate(detail.endDate, "dd/MM/yyyy")}</p>
                </div>
              )}
              {detail.days && (
                <div>
                  <p className="label-caps">Durée</p>
                  <p className="mt-1 num">{detail.days} jour(s)</p>
                </div>
              )}
            </div>

            <div>
              <p className="label-caps mb-2">Contenu</p>
              <div className="rounded-lg border border-border bg-white p-5 text-[#0B1220] shadow-inner">
                <p className="text-sm font-semibold">{data.settings.doctorName}</p>
                <p className="text-xs text-[#5B6472]">{data.settings.specialty}</p>
                <p className="text-xs text-[#5B6472]">{data.settings.address}</p>
                <p className="text-xs text-[#5B6472]">N° d'ordre : {data.settings.licenseNumber}</p>
                <hr className="my-4 border-[#E2E8F0]" />
                <p className="text-center text-sm font-semibold uppercase tracking-wide">{detail.type}</p>
                <p className="mt-6 whitespace-pre-wrap leading-relaxed">{detail.text}</p>
                <p className="mt-8 text-right text-xs">
                  Sousse, le {fmtDate(detail.documentDate)}
                  <br />
                  {data.settings.doctorName}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton
                onClick={() => {
                  duplicateCertificate(detail);
                  setDetail(null);
                }}
              >
                <Copy className="h-4 w-4" /> Dupliquer / Renouveler
              </GhostButton>
              <PrimaryButton
                onClick={() =>
                  printCertificate(detail.type, detail.text, detail.documentDate, patientName(detail.patientId))
                }
              >
                Générer le PDF
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={newTplOpen} onClose={() => setNewTplOpen(false)} title="Nouveau modèle de certificat" width="max-w-lg">
        <div className="space-y-4">
          <Field label="Nom du modèle">
            <input
              className={inputCls}
              autoFocus
              placeholder="Ex. Certificat de non contre-indication au voyage"
              value={newTpl.type}
              onChange={(e) => setNewTpl({ ...newTpl, type: e.target.value })}
            />
          </Field>
          <Field label="Texte par défaut">
            <textarea
              className={`${inputCls} min-h-32`}
              placeholder="Je soussigné certifie que…"
              value={newTpl.text}
              onChange={(e) => setNewTpl({ ...newTpl, text: e.target.value })}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Le texte reste modifiable à chaque édition de certificat. Les champs comme le nom du patient sont ajoutés
            automatiquement à l'impression.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setNewTplOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={saveTemplate}>Ajouter le modèle</PrimaryButton>
        </div>
      </Modal>

      <ConfirmModal
        open={!!tplToDelete}
        onClose={() => setTplToDelete(null)}
        message={`Supprimer le modèle « ${tplToDelete} » ? Les certificats déjà émis ne sont pas affectés.`}
        onConfirm={() => {
          if (!tplToDelete) return;
          setSettings({ certificateTemplates: customTemplates.filter((t) => t.type !== tplToDelete) });
          toast.success("Modèle supprimé");
        }}
      />
    </ScreenTransition>
  );
}
