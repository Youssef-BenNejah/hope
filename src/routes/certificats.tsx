import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Baby, Copy, Dumbbell, FileText, GraduationCap, Syringe } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, today } from "@/lib/cabinet/utils";
import type { CertificateType } from "@/lib/cabinet/types";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
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

const templates: { type: CertificateType; icon: typeof FileText; base: string }[] = [
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
  const { data, update, newId, patientName } = useCabinet();
  const { patient: presetPatient } = Route.useSearch();
  const [active, setActive] = useState<CertificateType | null>(null);
  const [patientId, setPatientId] = useState<string | null>(presetPatient ?? null);
  const [startDate, setStartDate] = useState(today());
  const [days, setDays] = useState(3);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [detail, setDetail] = useState<(typeof data.certificates)[number] | null>(null);

  const endDate = format(addDays(parseISO(startDate), days), "yyyy-MM-dd");
  const isSick = active === "Arrêt de travail";
  const body = isSick
    ? `Je soussigné ${data.settings.doctorName} certifie que l'état de santé de ${
        patientId ? patientName(patientId) : "…"
      } nécessite un arrêt de travail de ${days} jour(s), du ${fmtDate(startDate)} au ${fmtDate(endDate)}.`
    : text;

  const openTemplate = (t: (typeof templates)[number]) => {
    setActive(t.type);
    setText(t.base);
    setPreview(false);
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

  return (
    <ScreenTransition>
      <PageHeader title="Certificats" subtitle="Générez un document à partir d'un modèle" />

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {templates.map((t) => (
          <button
            key={t.type}
            onClick={() => openTemplate(t)}
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-teal hover:bg-cyan/40 dark:hover:bg-muted"
          >
            <t.icon className="h-6 w-6 text-teal" />
            <span className="text-sm font-medium">{t.type}</span>
          </button>
        ))}
      </div>

      <Card className="mt-8">
        <p className="mb-3 font-semibold">Journal des certificats</p>
        <table className="w-full text-sm">
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
            {data.certificates.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
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
                    onClick={() => {
                      update((d) => ({
                        ...d,
                        certificates: [
                          ...d.certificates,
                          { ...c, id: newId(), documentDate: today(), createdAt: new Date().toISOString() },
                        ],
                      }));
                      toast.success("Certificat dupliqué");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" /> Dupliquer / Renouveler
                  </button>
                </td>
              </tr>
            ))}
            {data.certificates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Aucun certificat émis pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title={active ?? ""} width="max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Patient">
              <PatientPicker value={patientId} onSelect={setPatientId} allowCreate={false} />
            </Field>
            {isSick ? (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                  setGenerating(true);
                  window.setTimeout(() => {
                    setGenerating(false);
                    setPreview(true);
                  }, 900);
                }}
              >
                {generating ? "Génération…" : "Générer le PDF"}
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
          <div className="mt-6 flex justify-end gap-2 rounded-lg bg-success-soft px-4 py-3">
            <span className="mr-auto text-sm text-success">Document généré avec succès.</span>
            <GhostButton onClick={() => toast.success("Téléchargement simulé du document")}>Télécharger</GhostButton>
            <PrimaryButton onClick={save}>Enregistrer dans le dossier du patient</PrimaryButton>
          </div>
        )}
      </Modal>
    </ScreenTransition>
  );
}
