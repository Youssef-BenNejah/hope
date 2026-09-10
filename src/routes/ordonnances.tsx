import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Pill, Printer, Save, Star } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, today } from "@/lib/cabinet/utils";
import { lineConflicts, parseLegacyFavorite, renderFavorite } from "@/lib/cabinet/prescriptions";
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
  const { data, update, setSettings, newId, patientName } = useCabinet();
  const { patient: presetPatient } = Route.useSearch();
  const s = data.settings;

  const [patientId, setPatientId] = useState<string | null>(presetPatient ?? null);
  const [city, setCity] = useState("Sousse");
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState("");
  const [renewFrom, setRenewFrom] = useState<string | null>(null);

  const patient = data.patients.find((p) => p.id === patientId);
  const name = patientId ? patientName(patientId) : "";

  const addLine = (text: string) => setLines((l) => (l.trim() ? `${l.trimEnd()}\n${text}` : text));
  const bumpUse = (id: string) =>
    setSettings({ favorites: s.favorites.map((f) => (f.id === id ? { ...f, uses: (f.uses ?? 0) + 1 } : f)) });

  const favByClass = useMemo(() => {
    const map = new Map<string, typeof s.favorites>();
    for (const f of [...s.favorites].sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0))) {
      const k = f.drugClass || "Autre";
      map.set(k, [...(map.get(k) ?? []), f]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [s.favorites]);

  const conflicts = useMemo(() => {
    if (!patient) return { allergy: [] as string[], chronic: [] as string[] };
    const a = new Set<string>();
    const c = new Set<string>();
    for (const ln of lines.split("\n").filter((x) => x.trim())) {
      const r = lineConflicts(ln, patient.allergies, patient.chronic);
      r.allergy.forEach((x) => a.add(x));
      r.chronic.forEach((x) => c.add(x));
    }
    return { allergy: [...a], chronic: [...c] };
  }, [lines, patient]);
  const history = patientId
    ? [...data.prescriptions].filter((r) => r.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const save = () => {
    if (!patientId) {
      toast.error("Sélectionnez un patient");
      return;
    }
    if (!lines.trim()) {
      toast.error("Ajoutez au moins un médicament");
      return;
    }
    update(
      (d) => ({
        ...d,
        prescriptions: [
          ...d.prescriptions,
          { id: newId(), patientId, date, text: lines.trim(), ...(renewFrom ? { renewedFrom: renewFrom } : {}) },
        ],
      }),
      `${renewFrom ? "Renouvellement d'ordonnance" : "Ordonnance"} — ${patientName(patientId)}`,
    );
    toast.success(
      renewFrom ? "Renouvellement enregistré dans le dossier" : "Ordonnance enregistrée dans le dossier du patient",
    );
    setRenewFrom(null);
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
              className={`${inputCls} min-h-44`}
              placeholder={"Paracétamol 1 g - 1 cp x 3/jour pendant 5 jours\nAmoxicilline 1 g - 1 cp matin et soir, 7 jours"}
              value={lines}
              onChange={(e) => setLines(e.target.value)}
            />
          </Field>

          {patient && (conflicts.allergy.length > 0 || conflicts.chronic.length > 0) && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {conflicts.allergy.length > 0 && (
                  <p>
                    <b>Allergie</b> : cette ordonnance mentionne {conflicts.allergy.join(", ")} — allergie connue de{" "}
                    {patient.name}.
                  </p>
                )}
                {conflicts.chronic.length > 0 && (
                  <p>
                    <b>Doublon</b> possible avec le traitement chronique : {conflicts.chronic.join(", ")}.
                  </p>
                )}
              </div>
            </div>
          )}

          {lines.trim() && (
            <button
              onClick={() => {
                const last = lines.split("\n").map((x) => x.trim()).filter(Boolean).at(-1);
                if (!last) return;
                if (s.favorites.some((f) => renderFavorite(f).toLowerCase() === last.toLowerCase())) {
                  toast.info("Déjà dans les favoris");
                  return;
                }
                setSettings({ favorites: [...s.favorites, parseLegacyFavorite(last)] });
                toast.success("Dernière ligne ajoutée aux favoris");
              }}
              className="inline-flex items-center gap-1 text-xs text-teal hover:underline"
            >
              <Star className="h-3.5 w-3.5" /> Ajouter la dernière ligne aux favoris
            </button>
          )}
          {patient && history.length > 0 && (
            <div className="rounded-lg border border-border p-3">
              <p className="label-caps mb-2 text-muted-foreground">Traitements en cours — renouveler</p>
              <div className="space-y-1.5">
                {history.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-start gap-2 text-xs">
                    <span className="num shrink-0 text-muted-foreground">{fmtDate(r.date, "dd/MM/yy")}</span>
                    <span className="min-w-0 flex-1 truncate" title={r.text}>
                      {r.text.split("\n")[0]}
                    </span>
                    <button
                      onClick={() => {
                        setLines(r.text);
                        setDate(today());
                        setRenewFrom(r.id);
                        toast.success("Ordonnance chargée — ajustez puis enregistrez");
                      }}
                      className="shrink-0 rounded border border-border px-2 py-0.5 hover:bg-muted"
                    >
                      Renouveler
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.protocols.length > 0 && (
            <div className="rounded-lg border border-border p-3">
              <p className="label-caps mb-2 flex items-center gap-1.5 text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5" /> Ordonnances types
              </p>
              <div className="flex flex-wrap gap-1.5">
                {s.protocols.map((p) => (
                  <button
                    key={p.id}
                    title={p.lines.join("\n")}
                    onClick={() => {
                      p.lines.forEach((ln) => addLine(ln));
                      toast.success(`« ${p.name} » insérée (${p.lines.length} lignes)`);
                    }}
                    className="rounded-full bg-frost/50 px-3 py-1 text-xs font-medium text-twilight transition-colors hover:bg-frost dark:bg-muted dark:text-frost"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {s.favorites.length > 0 && (
            <div>
              <p className="label-caps mb-2 flex items-center gap-1.5 text-muted-foreground">
                <Pill className="h-3.5 w-3.5" /> Médicaments favoris
              </p>
              <div className="space-y-2">
                {favByClass.map(([cls, items]) => (
                  <div key={cls}>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">{cls}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((f) => (
                        <button
                          key={f.id}
                          title={renderFavorite(f)}
                          onClick={() => {
                            addLine(renderFavorite(f));
                            bumpUse(f.id);
                          }}
                          className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-teal hover:bg-cyan/40 dark:hover:bg-muted"
                        >
                          + {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
