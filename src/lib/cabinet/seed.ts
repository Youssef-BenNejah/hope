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
    doctors: [
      {
        id: "doc-amine",
        name: "Dr. Amine Belhaj",
        specialty: "Médecine générale",
        email: "amine.belhaj@cabinet.tn",
        phone: "+216 73 220 118",
        licenseNumber: "MG-2011-4417",
        pin: "1234",
        active: true,
        createdAt: back(600),
      },
      {
        id: "doc-nour",
        name: "Dr. Nour Hammami",
        specialty: "Cardiologie",
        email: "nour.hammami@cabinet.tn",
        phone: "+216 71 884 021",
        licenseNumber: "CA-2016-2098",
        pin: "4021",
        active: true,
        createdAt: back(320),
      },
      {
        id: "doc-slim",
        name: "Dr. Slim Gharbi",
        specialty: "Pédiatrie",
        email: "slim.gharbi@cabinet.tn",
        phone: "+216 74 512 660",
        licenseNumber: "PE-2019-7712",
        pin: "7712",
        active: false,
        createdAt: back(120),
      },
    ],
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
      // Salma Trabelsi — suivi hypertension, bilans sur 10 mois
      ...[
        { off: 300, gly: 1.24, chol: 2.42, ldl: 1.86, tg: 1.94, crea: 11.4, hb: 12.4, k: 4.9 },
        { off: 210, gly: 1.18, chol: 2.31, ldl: 1.74, tg: 1.8, crea: 11.1, hb: 12.6, k: 4.7 },
        { off: 140, gly: 1.12, chol: 2.18, ldl: 1.66, tg: 1.62, crea: 10.6, hb: 12.9, k: 4.5 },
        { off: 75, gly: 1.06, chol: 2.05, ldl: 1.58, tg: 1.48, crea: 10.2, hb: 13.2, k: 4.4 },
        { off: 20, gly: 0.98, chol: 1.92, ldl: 1.44, tg: 1.32, crea: 9.8, hb: 13.6, k: 4.3 },
      ].map((b) => ({
        id: uid(),
        patientId: p1,
        date: back(b.off),
        values: [
          { label: "Glycémie", value: b.gly, unit: "g/L", ref: 1.1, refMin: 0.7 },
          { label: "Cholestérol total", value: b.chol, unit: "g/L", ref: 2 },
          { label: "LDL", value: b.ldl, unit: "g/L", ref: 1.6 },
          { label: "Triglycérides", value: b.tg, unit: "g/L", ref: 1.5 },
          { label: "Créatinine", value: b.crea, unit: "mg/L", ref: 12, refMin: 6 },
          { label: "Hémoglobine", value: b.hb, unit: "g/dL", ref: 16, refMin: 12 },
          { label: "Potassium", value: b.k, unit: "mmol/L", ref: 5.1, refMin: 3.5 },
        ],
      })),
    ],
    checkups: [
      // Salma Trabelsi — points de suivi clinique
      ...[
        { off: 300, s: 158, d: 96, w: 82.4, hr: 88, t: 36.8, pain: 5, st: "moins_bien", c: "Céphalées matinales, tension élevée." },
        { off: 210, s: 152, d: 93, w: 81.2, hr: 84, t: 36.7, pain: 4, st: "stable", c: "Introduction Amlodipine 5mg." },
        { off: 140, s: 145, d: 90, w: 79.8, hr: 80, t: 36.6, pain: 3, st: "mieux", c: "Meilleure tolérance, marche quotidienne." },
        { off: 75, s: 138, d: 86, w: 78.1, hr: 78, t: 36.6, pain: 2, st: "mieux", c: "Tension en baisse, sommeil amélioré." },
        { off: 30, s: 134, d: 84, w: 77.0, hr: 76, t: 36.5, pain: 1, st: "mieux", c: "Objectif tensionnel presque atteint." },
        { off: 5, s: 129, d: 81, w: 76.2, hr: 74, t: 36.5, pain: 1, st: "mieux", c: "État général très satisfaisant." },
      ].map((c) => ({
        id: uid(),
        patientId: p1,
        date: back(c.off),
        state: c.st as "mieux" | "stable" | "moins_bien",
        systolic: c.s,
        diastolic: c.d,
        weight: c.w,
        heartRate: c.hr,
        temperature: c.t,
        pain: c.pain,
        comment: c.c,
      })),
      {
        id: uid(),
        patientId: p4,
        date: back(15),
        state: "stable" as const,
        systolic: 136,
        diastolic: 85,
        weight: 88.5,
        heartRate: 82,
        temperature: 36.7,
        pain: 2,
        comment: "Glycémie en amélioration lente, poursuite Metformine.",
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
      consultDuration: 30,
      pin: "1234",
      lockDelay: 5,
      theme: "light",
    },
  };
}
