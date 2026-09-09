import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pill, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, today } from "@/lib/cabinet/utils";
import { Card, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientPicker } from "@/components/cabinet/PatientPicker";
import caduceus from "@/assets/caduceus.png";

export const Route = createFileRoute("/ordonnances")({
  validateSearch: (s: Record<string, unknown>) => ({
    patient: typeof s["patient"] === "string" ? (s["patient"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ordonnances — Cabinet" },
      { name: "description", content: "Rédigez une ordonnance médicale pré-remplie et exportez-la en PDF." },
      { property: "og:title", content: "Ordonnances — Cabinet" },
      { property: "og:description", content: "Rédigez une ordonnance médicale pré-remplie et exportez-la en PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrescriptionsPage,
});

function PrescriptionsPage() {
  const { data, update, newId, patientName } = useCabinet();
  const { patient: presetPatient } = Route.useSearch();
  const s = data.settings;

  const [patientId, setPatientId] = useState<string | null>(presetPatient ?? null);
  const [city, setCity] = useState("Sousse");
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState("");

  const patient = data.patients.find((p) => p.id === patientId);
  const name = patientId ? patientName(patientId) : "";

  const save = () => {
    if (!patientId) {
      toast.error("Sélectionnez un patient");
      return;
    }
    if (!lines.trim()) {
      toast.error("Ajoutez au moins un médicament");
      return;
    }
    update((d) => ({
      ...d,
      prescriptions: [...d.prescriptions, { id: newId(), patientId, date, text: lines.trim() }],
    }));
    toast.success("Ordonnance enregistrée dans le dossier du patient");
  };

  const exportPdf = () => {
    if (!patientId) {
      toast.error("Sélectionnez un patient");
      return;
    }
    toast.success("Ouverture de la fenêtre d'impression — choisissez « Enregistrer au format PDF »");
    window.setTimeout(() => window.print(), 400);
  };

  return (
    <ScreenTransition>
      <div className="no-print">
        <PageHeader title="Ordonnances" subtitle="Rédigez et exportez une ordonnance pré-remplie" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="no-print h-fit space-y-4">
          <Field label="Patient">
            <PatientPicker value={patientId} onSelect={setPatientId} allowCreate={false} />
          </Field>
          {patient && (
            <div className="rounded-lg bg-cyan px-4 py-3 text-sm text-twilight dark:bg-muted dark:text-frost">
              <p className="font-medium">{patient.name}</p>
              <p className="num text-xs">
                {patient.phone} · Né(e) le {fmtDate(patient.birthDate, "dd/MM/yyyy")}
              </p>
              {patient.allergies.length > 0 && (
                <p className="mt-1 text-xs text-danger">Allergies : {patient.allergies.join(", ")}</p>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fait à">
              <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Le">
              <input
                type="date"
                className={`${inputCls} num`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Médicaments / posologie (une ligne par médicament)">
            <textarea
              className={`${inputCls} min-h-48`}
              placeholder={"Paracétamol 1g — 1 cp x 3/jour pendant 5 jours\nAmoxicilline 500mg — 1 gél. matin et soir, 7 jours"}
              value={lines}
              onChange={(e) => setLines(e.target.value)}
            />
          </Field>
          {s.favorites.length > 0 && (
            <div>
              <p className="label-caps mb-2 text-muted-foreground">Favoris</p>
              <div className="flex flex-wrap gap-2">
                {s.favorites.map((f) => (
                  <button
                    key={f}
                    onClick={() => setLines((l) => (l ? `${l}\n${f}` : f))}
                    className="rounded-full border border-border px-3 py-1 text-xs hover:border-teal hover:bg-cyan/40 dark:hover:bg-muted"
                  >
                    + {f}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <PrimaryButton onClick={exportPdf}>
              <span className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" /> Exporter en PDF
              </span>
            </PrimaryButton>
            <GhostButton onClick={save}>
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> Enregistrer
              </span>
            </GhostButton>
          </div>
        </Card>

        {/* Feuille d'ordonnance */}
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

          <div className="relative min-h-[720px] px-10 py-10">
            <img
              src={caduceus}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
            />
            <div className="relative">
              <p className="text-center text-[17px] font-semibold underline underline-offset-4">Ordonnance Médicale</p>

              <div className="mt-10 space-y-3 pl-8 text-[14px]">
                <p>
                  Fait à : <span className="font-medium">{city || "…"}</span>&nbsp;&nbsp; Le :{" "}
                  <span className="num font-medium">{fmtDate(date, "dd / MM / yyyy")}</span>
                </p>
                <p>
                  Nom &amp; Prénom : <span className="font-medium">{name || "…"}</span>
                  {patient && (
                    <span className="num text-[#5B6472]">
                      {" "}
                      — ID {patient.code} · né(e) le {fmtDate(patient.birthDate, "dd/MM/yyyy")}
                      {patient.cnam ? ` · CNAM ${patient.cnam}` : ""}
                    </span>
                  )}
                </p>
              </div>

              <ul className="mt-10 space-y-3 pl-8 text-[14px] leading-7">
                {lines
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((l, i) => (
                    <li key={i} className="border-b border-dashed border-[#D6E2E4] pb-1">
                      {i + 1}. {l}
                    </li>
                  ))}
              </ul>

              <div className="mt-24 pr-6 text-right text-[13px]">
                <p>Signature et cachet</p>
                <p className="mt-10 font-semibold text-[#3FA6A9]">{s.doctorName}</p>
              </div>
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
    </ScreenTransition>
  );
}
