import { addDays, format, subDays } from "date-fns";
import type { CabinetData } from "./types";
import { makePatientCode } from "./utils";

export const uid = () => Math.random().toString(36).slice(2, 10);

const d = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");
const back = (offset: number) => format(subDays(new Date(), offset), "yyyy-MM-dd");

export function buildSeed(): CabinetData {
  const p1 = "pat-salma";
  const p2 = "pat-karim";
  const p3 = "pat-ines";
  const p4 = "pat-mohamed";

  const payments: CabinetData["payments"] = [];
  const names = [p1, p2, p4];
  for (let i = 13; i >= 0; i--) {
    const day = back(i);
    const count = i % 6 === 0 ? 1 : 2 + (i % 3);
    for (let j = 0; j < count; j++) {
      const amount = 30 + ((i * 7 + j * 13) % 31);
      const isCnam = (i + j) % 5 === 0;
      payments.push({
        id: uid(),
        patientId: names[(i + j) % names.length]!,
        date: day,
        amount,
        method: isCnam ? ((i + j) % 10 === 0 ? "cnam_paid" : "cnam_pending") : "cash",
      });
    }
  }

  return {
    patients: [
      {
        id: p1,
        code: makePatientCode("Salma Trabelsi"),
        name: "Salma Trabelsi",
        phone: "+216 20 145 332",
        birthDate: "1978-04-12",
        cnam: "04521187",
        allergies: ["Pénicilline"],
        chronic: ["Hypertension — Amlodipine 5mg"],
        createdAt: back(240),
      },
      {
        id: p2,
        code: makePatientCode("Karim Bouazizi"),
        name: "Karim Bouazizi",
        phone: "+216 55 809 214",
        birthDate: "1990-11-02",
        cnam: "07733410",
        allergies: [],
        chronic: [],
        createdAt: back(160),
      },
      {
        id: p3,
        code: makePatientCode("Ines Chaabane"),
        name: "Ines Chaabane",
        phone: "+216 98 302 771",
        birthDate: "1996-06-25",
        cnam: "09981245",
        allergies: [],
        chronic: [],
        createdAt: d(0),
      },
      {
        id: p4,
        code: makePatientCode("Mohamed Sfaxi"),
        name: "Mohamed Sfaxi",
        phone: "+216 22 456 781",
        birthDate: "1965-01-30",
        cnam: "03310098",
        allergies: ["Iode"],
        chronic: ["Diabète type 2 — Metformine 850mg"],
        createdAt: back(400),
      },
    ],
    appointments: [
      { id: uid(), patientId: p1, date: d(0), time: "09:30", reason: "Contrôle tension", status: "upcoming" },
      { id: uid(), patientId: p2, date: d(0), time: "11:00", reason: "Suivi lombalgie", status: "upcoming" },
      { id: uid(), patientId: p3, date: d(0), time: "15:15", reason: "Première consultation", status: "upcoming" },
      { id: uid(), patientId: p4, date: d(1), time: "10:00", reason: "Suivi diabète", status: "upcoming" },
      { id: uid(), patientId: p1, date: d(2), time: "14:30", reason: "Renouvellement d'ordonnance", status: "upcoming" },
      { id: uid(), patientId: p2, date: d(3), time: "08:45", reason: "Contrôle", status: "upcoming" },
      { id: uid(), patientId: p1, date: back(30), time: "09:00", reason: "Contrôle tension", status: "done" },
      { id: uid(), patientId: p2, date: back(45), time: "16:00", reason: "Douleur lombaire", status: "done" },
      { id: uid(), patientId: p2, date: back(20), time: "10:30", reason: "Contrôle", status: "absent" },
      { id: uid(), patientId: p4, date: back(15), time: "11:30", reason: "Suivi diabète", status: "done" },
    ],
    blocks: [{ id: uid(), date: d(1), start: "12:00", end: "14:00", reason: "Pause déjeuner" }],
    notes: [
      {
        id: uid(),
        patientId: p2,
        date: back(45),
        text: "Douleur lombaire mécanique, sans signe neurologique. AINS prescrits pour 5 jours, repos relatif.",
      },
      {
        id: uid(),
        patientId: p1,
        date: back(30),
        text: "Tension 14/9. Poursuite du traitement, contrôle dans un mois.",
      },
    ],
    prescriptions: [
      { id: uid(), patientId: p1, date: back(30), text: "Amlodipine 5mg — 1x/j, 30 jours" },
      { id: uid(), patientId: p2, date: back(45), text: "Ibuprofène 400mg — 3x/j, 5 jours" },
      { id: uid(), patientId: p4, date: back(15), text: "Metformine 850mg — 2x/j" },
    ],
    analyses: [
      {
        id: uid(),
        patientId: p4,
        date: back(95),
        values: [
          { label: "Glycémie", value: 1.42, unit: "g/L", ref: 1.1 },
          { label: "Cholestérol total", value: 2.1, unit: "g/L", ref: 2 },
        ],
      },
      {
        id: uid(),
        patientId: p4,
        date: back(55),
        values: [
          { label: "Glycémie", value: 1.24, unit: "g/L", ref: 1.1 },
          { label: "Cholestérol total", value: 2.0, unit: "g/L", ref: 2 },
        ],
      },
      {
        id: uid(),
        patientId: p4,
        date: back(15),
        values: [
          { label: "Glycémie", value: 1.08, unit: "g/L", ref: 1.1 },
          { label: "Cholestérol total", value: 1.9, unit: "g/L", ref: 2 },
        ],
      },
    ],
    certificates: [
      {
        id: uid(),
        patientId: p2,
        type: "Arrêt de travail",
        documentDate: back(45),
        startDate: back(45),
        days: 3,
        endDate: back(42),
        text: "Je soussigné Dr. Amine Belhaj certifie que l'état de santé de M. Karim Bouazizi nécessite un arrêt de travail de 3 jours.",
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ],
    payments,
    settings: {
      doctorName: "Dr. Amine Belhaj",
      specialty: "Médecine générale",
      address: "12 Rue Ibn Khaldoun, Sousse",
      phone: "+216 73 220 118",
      licenseNumber: "MG-2011-4417",
      favorites: [
        "Paracétamol 1g — 3x/j",
        "Amoxicilline 500mg — 3x/j, 7j",
        "Ibuprofène 400mg — 3x/j, 5j",
        "Oméprazole 20mg — 1x/j, 14j",
      ],
      pin: "1234",
      lockDelay: 5,
      theme: "light",
    },
  };
}
