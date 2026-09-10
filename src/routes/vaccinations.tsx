import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Plus, Search, Syringe } from "lucide-react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import { fmtDate, matches, today } from "@/lib/cabinet/utils";
import { Card, EmptyState, PageHeader, ScreenTransition } from "@/components/cabinet/Page";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { PatientPicker } from "@/components/cabinet/PatientPicker";
import { Combobox } from "@/components/cabinet/Combobox";

export const Route = createFileRoute("/vaccinations")({
  head: () => ({
    meta: [
      { title: "Vaccinations — Cabinet" },
      { name: "description", content: "Registre de vaccination du cabinet : injections réalisées et rappels à programmer." },
      { property: "og:title", content: "Vaccinations — Cabinet" },
      { property: "og:description", content: "Suivi des vaccins administrés et des rappels par patient." },
    ],
  }),
  component: VaccinationsPage,
});

const commonVaccines = [
  "Grippe saisonnière",
  "COVID-19 (rappel)",
  "dTP (rappel)",
  "dTPCa",
  "ROR",
  "Hépatite B",
  "Pneumocoque",
  "Fièvre typhoïde",
  "Méningocoque ACWY",
  "Tétanos (plaie)",
  "Rage",
  "Zona",
];

function VaccinationsPage() {
  const { data, update, newId, patientName, currentUser } = useCabinet();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: null as string | null,
    vaccine: commonVaccines[0]!,
    date: today(),
    dose: "",
    batch: "",
    nextDue: "",
  });

  const rows = useMemo(() => {
    return [...data.vaccinations]
      .map((v) => ({ v, patient: data.patients.find((p) => p.id === v.patientId) }))
      .filter(({ v, patient }) => !q || matches(patient?.name ?? "", q) || matches(v.vaccine, q))
      .sort((a, b) => b.v.date.localeCompare(a.v.date));
  }, [data.vaccinations, data.patients, q]);

  // Liste = vaccins courants + tous ceux déjà saisis (les types ajoutés restent disponibles)
  const vaccineOptions = useMemo(
    () => [...new Set([...commonVaccines, ...data.vaccinations.map((v) => v.vaccine)])].sort((a, b) => a.localeCompare(b)),
    [data.vaccinations],
  );

  const dueSoon = data.vaccinations.filter(
    (v) => v.nextDue && differenceInCalendarDays(parseISO(v.nextDue), new Date()) <= 45,
  ).length;

  const save = () => {
    if (!form.patientId) {
      toast.error("Sélectionnez un patient");
      return;
    }
    if (!form.vaccine.trim()) {
      toast.error("Indiquez le vaccin");
      return;
    }
    update(
      (d) => ({
        ...d,
        vaccinations: [
          ...d.vaccinations,
          {
            id: newId(),
            patientId: form.patientId!,
            vaccine: form.vaccine.trim(),
            date: form.date,
            ...(form.dose.trim() ? { dose: form.dose.trim() } : {}),
            ...(form.batch.trim() ? { batch: form.batch.trim() } : {}),
            ...(form.nextDue ? { nextDue: form.nextDue } : {}),
            ...(currentUser ? { authorId: currentUser.id } : {}),
          },
        ],
      }),
      `Vaccination ${form.vaccine.trim()} — ${patientName(form.patientId)}`,
    );
    toast.success("Vaccination enregistrée");
    setForm({ ...form, patientId: null, dose: "", batch: "", nextDue: "" });
    setOpen(false);
  };

  return (
    <ScreenTransition>
      <PageHeader
        title="Vaccinations"
        subtitle={`${data.vaccinations.length} injection${data.vaccinations.length > 1 ? "s" : ""} · ${dueSoon} rappel${
          dueSoon > 1 ? "s" : ""
        } à venir`}
        actions={
          <PrimaryButton onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nouvelle vaccination
          </PrimaryButton>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Rechercher un patient ou un vaccin…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Syringe className="h-10 w-10" />} title="Aucune vaccination enregistrée." />
      ) : (
        <Card className="p-0">
          <div className="-mx-0 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-twilight text-left text-[#EAF2FA]">
                  {["Patient", "Vaccin", "Date", "Dose / lot", "Prochain rappel", "Statut"].map((h) => (
                    <th key={h} className="label-caps px-4 py-2.5 text-[#CAF0F8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ v, patient }) => {
                  const gap = v.nextDue ? differenceInCalendarDays(parseISO(v.nextDue), new Date()) : null;
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{patient?.name ?? "Patient inconnu"}</td>
                      <td className="px-4 py-3">{v.vaccine}</td>
                      <td className="num px-4 py-3 text-muted-foreground">{fmtDate(v.date, "dd/MM/yyyy")}</td>
                      <td className="num px-4 py-3 text-muted-foreground">
                        {[v.dose, v.batch].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="num px-4 py-3 text-muted-foreground">
                        {v.nextDue ? fmtDate(v.nextDue, "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {gap === null ? (
                          <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                            À jour
                          </span>
                        ) : gap < 0 ? (
                          <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
                            Rappel en retard
                          </span>
                        ) : gap <= 45 ? (
                          <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
                            Rappel dans {gap} j
                          </span>
                        ) : (
                          <span className="rounded-full bg-frost px-2.5 py-1 text-xs font-medium text-twilight">
                            Programmé
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle vaccination">
        <div className="space-y-4">
          <Field label="Patient">
            <PatientPicker
              value={form.patientId}
              onSelect={(id) => setForm({ ...form, patientId: id })}
              allowCreate={false}
            />
          </Field>
          <Field label="Vaccin">
            <Combobox
              value={form.vaccine}
              onChange={(v) => setForm({ ...form, vaccine: v })}
              options={vaccineOptions}
              placeholder="Choisir ou saisir un vaccin"
              addLabel={(t) => `Ajouter le vaccin « ${t} »`}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date d'injection">
              <input
                type="date"
                className={`${inputCls} num`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Prochain rappel (facultatif)">
              <input
                type="date"
                className={`${inputCls} num`}
                value={form.nextDue}
                onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
              />
            </Field>
            <Field label="Dose">
              <input
                className={inputCls}
                placeholder="Ex. 1re dose, rappel"
                value={form.dose}
                onChange={(e) => setForm({ ...form, dose: e.target.value })}
              />
            </Field>
            <Field label="N° de lot">
              <input
                className={`${inputCls} num`}
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
          <PrimaryButton onClick={save}>Enregistrer</PrimaryButton>
        </div>
      </Modal>
    </ScreenTransition>
  );
}
