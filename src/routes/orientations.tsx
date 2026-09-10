import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { Copy, Printer, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, today } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientPicker } from "@/components/cabinet/PatientPicker";
import caduceus from "@/assets/caduceus.png";

export const Route = createFileRoute("/orientations")({
  validateSearch: (s: Record<string, unknown>) => ({
    patient: typeof s["patient"] === "string" ? (s["patient"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Orientations — Cabinet" },
      { name: "description", content: "Rédigez un courrier d'orientation vers un spécialiste et gardez la trace des envois." },
      { property: "og:title", content: "Orientations — Cabinet" },
      { property: "og:description", content: "Courrier d'adressage vers un confrère, pré-rempli et imprimable." },
    ],
  }),
  component: ReferralsPage,
});

const specialties = [
  "Cardiologie",
  "Pneumologie",
  "Gastro-entérologie",
  "Endocrinologie",
  "Néphrologie",
  "Neurologie",
  "Rhumatologie",
  "Dermatologie",
  "ORL",
  "Ophtalmologie",
  "Gynécologie",
  "Urologie",
  "Chirurgie générale",
  "Orthopédie",
  "Psychiatrie",
  "Radiologie",
];

function ReferralsPage() {
  const { data, update, newId, patientName } = useCabinet();
  const { patient: presetPatient } = Route.useSearch();
  const s = data.settings;

  const [patientId, setPatientId] = useState<string | null>(presetPatient ?? null);
  const [specialty, setSpecialty] = useState(specialties[0]!);
  const [contactId, setContactId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(today());

  const patient = data.patients.find((p) => p.id === patientId);
  const contacts = data.contacts.filter((c) => c.kind === "Confrère");
  const contact = data.contacts.find((c) => c.id === contactId);
  const name = patientId ? patientName(patientId) : "";

  const body = useMemo(() => {
    const dest = contact ? contact.name : `au spécialiste en ${specialty.toLowerCase()}`;
    return `Cher confrère,\n\nJe vous adresse ${name || "…"}${
      patient?.birthDate ? `, né(e) le ${fmtDate(patient.birthDate, "dd/MM/yyyy")}` : ""
    }, pour avis et prise en charge en ${specialty.toLowerCase()}.\n\nMotif : ${
      reason || "…"
    }\n\n${
      patient && patient.chronic.length ? `Antécédents : ${patient.chronic.join(", ")}.\n` : ""
    }${
      patient && patient.allergies.length ? `Allergies : ${patient.allergies.join(", ")}.\n` : ""
    }\nJe reste à votre disposition pour tout complément d'information et vous remercie de votre prise en charge.\n\nConfraternellement,\n${s.doctorName}`;
  }, [contact, specialty, name, patient, reason, s.doctorName]);

  const save = () => {
    if (!patientId) {
      toast.error("Sélectionnez un patient");
      return;
    }
    if (!reason.trim()) {
      toast.error("Précisez le motif de l'orientation");
      return;
    }
    update(
      (d) => ({
        ...d,
        referrals: [
          ...d.referrals,
          {
            id: newId(),
            patientId,
            specialty,
            ...(contactId ? { contactId } : {}),
            reason: reason.trim(),
            documentDate: date,
            text: body,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
      `Orientation ${specialty} — ${patientName(patientId)}`,
    );
    toast.success("Orientation enregistrée dans le dossier du patient");
  };

  const list = [...data.referrals].sort((a, b) => b.documentDate.localeCompare(a.documentDate));

  return (
    <ScreenTransition>
      <div className="no-print">
        <PageHeader title="Orientations" subtitle="Courrier d'adressage vers un spécialiste" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="no-print h-fit space-y-4">
          <Field label="Patient">
            <PatientPicker value={patientId} onSelect={setPatientId} allowCreate={false} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Spécialité">
              <select className={inputCls} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                {specialties.map((sp) => (
                  <option key={sp}>{sp}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={`${inputCls} num`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Destinataire (carnet d'adresses)">
            <select className={inputCls} value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">— Non précisé —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.specialty ? ` · ${c.specialty}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Motif de l'orientation">
            <textarea
              className={`${inputCls} min-h-28`}
              placeholder="Ex. HTA résistante malgré bithérapie, souffle systolique à explorer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <PrimaryButton
              onClick={() => {
                if (!patientId) {
                  toast.error("Sélectionnez un patient");
                  return;
                }
                toast.success("Ouverture de l'impression — choisissez « Enregistrer au format PDF »");
                window.setTimeout(() => window.print(), 400);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" /> Imprimer / PDF
              </span>
            </PrimaryButton>
            <GhostButton onClick={save}>
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> Enregistrer
              </span>
            </GhostButton>
          </div>
        </Card>

        <div className="print-sheet relative mx-auto w-full max-w-[794px] overflow-hidden border border-border bg-white text-[#0B1220] shadow-sm">
          <div className="h-1.5 w-full bg-[#7FC5C8]" />
          <div className="flex items-start justify-between gap-6 px-10 pt-8">
            <div className="text-[13px] leading-6">
              <p className="font-semibold text-[#3FA6A9]">{s.doctorName}</p>
              <p>{s.specialty}</p>
              <p className="num">Tél : {s.phone}</p>
              <p>N° d'ordre : {s.licenseNumber}</p>
            </div>
            <img src={caduceus} alt="" width={64} height={85} className="h-20 w-auto shrink-0" />
            <div className="text-right text-[13px] leading-6">
              <p className="font-semibold text-[#3FA6A9]">Cabinet médical</p>
              <p>{s.address}</p>
            </div>
          </div>

          <div className="mt-6 h-px w-full bg-[#7FC5C8]" />

          <div className="min-h-[720px] px-10 py-10 text-[14px] leading-7">
            <div className="text-right">
              {contact && <p className="font-medium">{contact.name}</p>}
              {contact?.specialty && <p>{contact.specialty}</p>}
              {contact?.address && <p className="text-[#5B6472]">{contact.address}</p>}
              <p className="num mt-2">Sousse, le {fmtDate(date, "dd / MM / yyyy")}</p>
            </div>

            <p className="mt-8 text-center text-[16px] font-semibold underline underline-offset-4">
              Courrier d'orientation
            </p>

            <p className="mt-6">
              Concernant : <span className="font-medium">{name || "…"}</span>
              {patient && (
                <span className="num text-[#5B6472]">
                  {" "}
                  — ID {patient.code}
                  {patient.birthDate ? ` · né(e) le ${fmtDate(patient.birthDate, "dd/MM/yyyy")}` : ""}
                  {patient.cnam ? ` · CNAM ${patient.cnam}` : ""}
                </span>
              )}
            </p>

            <p className="mt-6 whitespace-pre-wrap">{body}</p>

            <div className="mt-16 pr-6 text-right text-[13px]">
              <p>Signature et cachet</p>
              <p className="mt-10 font-semibold text-[#3FA6A9]">{s.doctorName}</p>
            </div>
          </div>

          <div className="bg-[#BFE0E1] px-10 py-3 text-center text-[11px] leading-5 text-[#0B1220]">
            <p>
              Adresse : {s.address} — Tél : {s.phone}
            </p>
            <p>N° d'ordre : {s.licenseNumber}</p>
          </div>
        </div>
      </div>

      <Card className="no-print mt-8">
        <p className="mb-3 flex items-center gap-2 font-semibold">
          <Send className="h-4 w-4 text-teal" /> Orientations émises
        </p>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-twilight text-left">
                {["Patient", "Spécialité", "Destinataire", "Date", ""].map((h) => (
                  <th key={h} className="label-caps px-3 py-2 text-[#CAF0F8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5">{patientName(r.patientId)}</td>
                  <td className="px-3 py-2.5">{r.specialty}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {data.contacts.find((c) => c.id === r.contactId)?.name ?? "—"}
                  </td>
                  <td className="num px-3 py-2.5 text-muted-foreground">
                    {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: fr })}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setPatientId(r.patientId);
                        setSpecialty(r.specialty);
                        setContactId(r.contactId ?? "");
                        setReason(r.reason);
                        setDate(today());
                        toast.success("Chargé dans le formulaire — ajustez puis enregistrez");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" /> Reprendre
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Aucune orientation émise pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </ScreenTransition>
  );
}
