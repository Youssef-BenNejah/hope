import { addDays, format, subDays } from "date-fns";
import type { CabinetData } from "./types";
import { makePatientCode } from "./utils";

export const uid = () => Math.random().toString(36).slice(2, 10);

const d = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");
const back = (offset: number) => format(subDays(new Date(), offset), "yyyy-MM-dd");
const iso = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString();
const YEAR = new Date().getFullYear();

/** PDF minimal (1 page) encodé en data URL — donne un vrai contenu aux documents d'exemple. */
function miniPdf(title: string, subtitle = "Document d'exemple — Cabinet médical"): string {
  const ascii = (s: string) => {
    let out = "";
    for (const ch of s.normalize("NFD")) {
      const c = ch.charCodeAt(0);
      if (c >= 0x300 && c <= 0x36f) continue; // marques combinantes
      if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
      else out += c >= 0x20 && c <= 0x7e ? ch : "?";
    }
    return out;
  };
  const content =
    `BT /F1 20 Tf 60 780 Td (${ascii(title)}) Tj ET\n` +
    `BT /F1 12 Tf 60 752 Td (${ascii(subtitle)}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets[i] = pdf.length;
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => (pdf += `${String(off).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const b64 = typeof btoa === "function" ? btoa(pdf) : Buffer.from(pdf, "latin1").toString("base64");
  return `data:application/pdf;base64,${b64}`;
}

export function buildSeed(): CabinetData {
  const p1 = "pat-salma";
  const p2 = "pat-karim";
  const p3 = "pat-ines";
  const p4 = "pat-mohamed";
  const p5 = "pat-fatma";
  const p6 = "pat-hedi";
  const p7 = "pat-rania";
  const p8 = "pat-sami";
  const p9 = "pat-nadia";
  const p10 = "pat-youssef";

  const payPatients = [p1, p2, p4, p5, p6, p8, p9];
  const payments: CabinetData["payments"] = [];
  for (let i = 29; i >= 0; i--) {
    const day = back(i);
    if (new Date(day).getDay() === 0) continue; // pas de dimanche
    const count = 2 + ((i * 3) % 5);
    for (let j = 0; j < count; j++) {
      const amount = 30 + ((i * 7 + j * 13) % 41);
      const isCnam = (i + j) % 4 === 0;
      payments.push({
        id: uid(),
        patientId: payPatients[(i * 2 + j) % payPatients.length]!,
        date: day,
        amount,
        method: isCnam ? ((i + j) % 9 === 0 ? "cnam_paid" : "cnam_pending") : "cash",
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
        password: "Amine@2024",
        active: true,
        createdAt: back(600),
        role: "medecin",
      },
      {
        id: "doc-nour",
        name: "Dr. Nour Hammami",
        specialty: "Cardiologie",
        email: "nour.hammami@cabinet.tn",
        phone: "+216 71 884 021",
        licenseNumber: "CA-2016-2098",
        password: "Nour@2024",
        active: true,
        createdAt: back(320),
        role: "medecin",
      },
      {
        id: "doc-slim",
        name: "Dr. Slim Gharbi",
        specialty: "Pédiatrie",
        email: "slim.gharbi@cabinet.tn",
        phone: "+216 74 512 660",
        licenseNumber: "PE-2019-7712",
        password: "Slim@2024",
        active: false,
        createdAt: back(120),
        role: "medecin",
      },
      {
        id: "doc-leila",
        name: "Leïla Mansour",
        specialty: "Secrétariat médical",
        email: "leila.mansour@cabinet.tn",
        phone: "+216 73 220 119",
        licenseNumber: "—",
        password: "Leila@2024",
        active: true,
        createdAt: back(210),
        role: "secretaire",
        birthDate: "1994-09-14",
        cin: "09876543",
        address: "6 Rue de Carthage, Sousse",
        hiredAt: back(210),
        contractType: "CDI",
        bank: "Banque de Tunisie",
        rib: "10 006 0281234567890 12",
        emergencyContact: "Mehdi Mansour (frère) — +216 24 771 003",
        notes: "Accueil, prise de rendez-vous, encaissement, dossiers CNAM.",
      },
      {
        id: "doc-emna",
        name: "Emna Kefi",
        specialty: "Assistante médicale",
        email: "emna.kefi@cabinet.tn",
        phone: "+216 73 220 120",
        licenseNumber: "—",
        password: "Emna@2024",
        active: true,
        createdAt: back(75),
        role: "secretaire",
        birthDate: "1998-02-03",
        cin: "11224488",
        address: "14 Avenue Farhat Hached, M'saken",
        hiredAt: back(75),
        contractType: "CDD",
        bank: "Amen Bank",
        rib: "07 015 0009988776655 44",
        emergencyContact: "Salwa Kefi (mère) — +216 22 190 447",
        notes: "Renfort accueil les après-midis, gestion des documents.",
      },
    ],
    patients: [
      {
        id: p1,
        code: makePatientCode("Salma Trabelsi"),
        name: "Salma Trabelsi",
        phone: "+216 20 145 332",
        birthDate: "1978-04-12",
        sex: "femme",
        country: "Tunisie",
        coverage: "cnam",
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
        sex: "homme",
        country: "Tunisie",
        coverage: "cnam",
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
        sex: "femme",
        country: "Tunisie",
        coverage: "assurance",
        insurer: "STAR — 774102",
        cnam: "",
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
        sex: "homme",
        country: "Tunisie",
        coverage: "cnam",
        cnam: "03310098",
        allergies: ["Iode"],
        chronic: ["Diabète type 2 — Metformine 850mg"],
        createdAt: back(400),
      },
      {
        id: p5,
        code: makePatientCode("Fatma Riahi"),
        name: "Fatma Riahi",
        phone: "+216 21 668 903",
        birthDate: "1988-09-17",
        sex: "femme",
        country: "Tunisie",
        coverage: "cnam",
        cnam: "05540221",
        allergies: ["Acariens", "Pollen"],
        chronic: ["Asthme — Salbutamol à la demande, Budésonide inhalé"],
        createdAt: back(310),
      },
      {
        id: p6,
        code: makePatientCode("Hédi Gharsalli"),
        name: "Hédi Gharsalli",
        phone: "+216 50 774 118",
        birthDate: "1972-03-08",
        sex: "homme",
        country: "Tunisie",
        coverage: "assurance",
        insurer: "COMAR — 220145",
        cnam: "",
        allergies: [],
        chronic: ["Dyslipidémie — Atorvastatine 20mg"],
        createdAt: back(280),
      },
      {
        id: p7,
        code: makePatientCode("Rania Ferjani"),
        name: "Rania Ferjani",
        phone: "+216 27 335 660",
        birthDate: "1994-12-01",
        sex: "femme",
        country: "Tunisie",
        coverage: "cnam",
        cnam: "08890043",
        allergies: [],
        chronic: [],
        createdAt: back(70),
      },
      {
        id: p8,
        code: makePatientCode("Sami Landolsi"),
        name: "Sami Landolsi",
        phone: "+216 23 902 517",
        birthDate: "1957-07-22",
        sex: "homme",
        country: "Tunisie",
        coverage: "cnam",
        cnam: "01120765",
        allergies: ["Aspirine"],
        chronic: ["Hypertension — Périndopril 10mg", "Diabète type 2 — Metformine 1000mg + Gliclazide"],
        createdAt: back(520),
      },
      {
        id: p9,
        code: makePatientCode("Nadia Oueslati"),
        name: "Nadia Oueslati",
        phone: "+216 29 447 812",
        birthDate: "1985-05-19",
        sex: "femme",
        country: "Tunisie",
        coverage: "aucune",
        cnam: "",
        allergies: [],
        chronic: ["Trouble anxieux — suivi, Escitalopram 10mg"],
        createdAt: back(140),
      },
      {
        id: p10,
        code: makePatientCode("Youssef Mabrouk"),
        name: "Youssef Mabrouk",
        phone: "+216 52 118 447",
        birthDate: back(365 * 4 + 60).slice(0, 10),
        sex: "homme",
        country: "Tunisie",
        coverage: "cnam",
        cnam: "09902231",
        allergies: [],
        chronic: [],
        createdAt: back(200),
      },
    ],
    appointments: [
      // Aujourd'hui
      { id: uid(), patientId: p1, date: d(0), time: "08:30", reason: "Contrôle tension", status: "upcoming", category: "cat-suivi" },
      { id: uid(), patientId: p2, date: d(0), time: "09:15", reason: "Suivi lombalgie", status: "upcoming", category: "cat-consult" },
      { id: uid(), patientId: p5, date: d(0), time: "10:00", reason: "Crise d'asthme légère", status: "upcoming", category: "cat-urgence" },
      { id: uid(), patientId: p3, date: d(0), time: "11:00", reason: "Première consultation", status: "upcoming", category: "cat-consult" },
      { id: uid(), patientId: p10, date: d(0), time: "15:15", reason: "Vaccin — rappel", status: "upcoming", category: "cat-suivi" },
      { id: uid(), patientId: p9, date: d(0), time: "16:00", reason: "Renouvellement traitement", status: "upcoming", category: "cat-teleconsult" },
      // Jours à venir
      { id: uid(), patientId: p4, date: d(1), time: "09:00", reason: "Suivi diabète", status: "upcoming", category: "cat-suivi" },
      { id: uid(), patientId: p8, date: d(1), time: "10:30", reason: "Bilan trimestriel", status: "upcoming", category: "cat-suivi" },
      { id: uid(), patientId: p6, date: d(2), time: "08:45", reason: "Résultats bilan lipidique", status: "upcoming", category: "cat-consult" },
      { id: uid(), patientId: p1, date: d(2), time: "14:30", reason: "Renouvellement d'ordonnance", status: "upcoming", category: "cat-consult" },
      { id: uid(), patientId: p7, date: d(3), time: "11:15", reason: "Suivi grossesse", status: "upcoming", category: "cat-suivi" },
      { id: uid(), patientId: p2, date: d(4), time: "09:30", reason: "Contrôle", status: "upcoming", category: "cat-consult" },
      { id: uid(), patientId: p8, date: d(6), time: "10:00", reason: "Visite à domicile", status: "upcoming", category: "cat-visite" },
      // Passé
      { id: uid(), patientId: p1, date: back(30), time: "09:00", reason: "Contrôle tension", status: "done" },
      { id: uid(), patientId: p2, date: back(45), time: "16:00", reason: "Douleur lombaire", status: "done" },
      { id: uid(), patientId: p2, date: back(20), time: "10:30", reason: "Contrôle", status: "absent" },
      { id: uid(), patientId: p4, date: back(15), time: "11:30", reason: "Suivi diabète", status: "done" },
      { id: uid(), patientId: p5, date: back(25), time: "09:15", reason: "Exacerbation asthme", status: "done" },
      { id: uid(), patientId: p6, date: back(35), time: "08:30", reason: "Bilan cardiovasculaire", status: "done" },
      { id: uid(), patientId: p8, date: back(12), time: "10:00", reason: "Suivi HTA + diabète", status: "done" },
      { id: uid(), patientId: p9, date: back(18), time: "15:30", reason: "Suivi anxiété", status: "done" },
      { id: uid(), patientId: p7, date: back(10), time: "11:00", reason: "Déclaration de grossesse", status: "done" },
      { id: uid(), patientId: p10, date: back(60), time: "14:00", reason: "Consultation pédiatrique", status: "done" },
      { id: uid(), patientId: p3, date: back(5), time: "16:30", reason: "Certificat sportif", status: "absent" },
      { id: uid(), patientId: p1, date: back(75), time: "09:00", reason: "Contrôle tension", status: "done" },
      { id: uid(), patientId: p4, date: back(95), time: "11:00", reason: "Suivi diabète", status: "done" },
    ],
    blocks: [
      { id: uid(), date: d(1), start: "12:00", end: "14:00", reason: "Pause déjeuner" },
      { id: uid(), date: d(3), start: "16:00", end: "18:00", reason: "Formation continue" },
      { id: uid(), date: back(2), start: "12:00", end: "14:00", reason: "Pause déjeuner" },
    ],
    holidays: [
      { id: uid(), date: `${YEAR}-03-20`, label: "Fête de l'Indépendance" },
      { id: uid(), date: `${YEAR}-04-09`, label: "Journée des Martyrs" },
      { id: uid(), date: `${YEAR}-05-01`, label: "Fête du Travail" },
      { id: uid(), date: `${YEAR}-07-25`, label: "Fête de la République" },
    ],
    notes: [
      {
        id: uid(),
        patientId: p2,
        date: back(45),
        text: "Douleur lombaire mécanique, sans signe neurologique. AINS prescrits pour 5 jours, repos relatif.",
        motif: "Lombalgie aiguë depuis 3 jours",
        exam: "Contracture paravertébrale L4-L5, Lasègue négatif, pas de déficit moteur ni sensitif.",
        diagnosis: "Lombalgie commune mécanique",
        plan: "AINS 5 jours, myorelaxant le soir, reprise progressive de l'activité. Contrôle si persistance > 10 j.",
        icd: [{ code: "M54.5", label: "Lombalgie basse" }],
        authorId: "doc-amine",
      },
      {
        id: uid(),
        patientId: p1,
        date: back(30),
        text: "Tension 14/9. Poursuite du traitement, contrôle dans un mois.",
        motif: "Suivi HTA",
        exam: "TA 145/92 aux deux bras, auscultation cardio-pulmonaire sans particularité, pas d'OMI.",
        diagnosis: "Hypertension essentielle, contrôle insuffisant",
        plan: "Poursuite Amlodipine 5 mg, régime hyposodé rappelé, bilan lipidique et créatinine, revoir à 1 mois.",
        icd: [{ code: "I10", label: "Hypertension essentielle (primitive)" }],
        authorId: "doc-amine",
      },
      {
        id: uid(),
        patientId: p5,
        date: back(25),
        text: "Exacerbation sur exposition aux acariens. Bonne réponse au salbutamol.",
        motif: "Dyspnée sifflante depuis 2 jours",
        exam: "Sibilants diffus, SpO2 96 %, DEP à 78 % de la théorique.",
        diagnosis: "Asthme non contrôlé, exacerbation légère",
        plan: "Renforcement corticoïde inhalé, salbutamol si besoin, plan d'action écrit remis, contrôle à 15 j.",
        icd: [{ code: "J45", label: "Asthme" }],
        authorId: "doc-amine",
      },
      {
        id: uid(),
        patientId: p8,
        date: back(12),
        text: "HbA1c 7,8 %. Ajout gliclazide, éducation diététique renforcée.",
        motif: "Suivi HTA et diabète type 2",
        exam: "TA 138/84, poids stable, examen des pieds normal, pas de plaie.",
        diagnosis: "Diabète type 2 déséquilibré ; HTA équilibrée",
        plan: "Metformine 1000 mg x2 + Gliclazide 30 mg, bilan rénal, fond d'œil à programmer.",
        icd: [
          { code: "E11", label: "Diabète sucré de type 2" },
          { code: "I10", label: "Hypertension essentielle (primitive)" },
        ],
        authorId: "doc-amine",
      },
      {
        id: uid(),
        patientId: p9,
        date: back(18),
        text: "Amélioration du sommeil, anxiété résiduelle modérée. Poursuite escitalopram.",
        motif: "Suivi trouble anxieux",
        exam: "Discours cohérent, thymie stable, pas d'idées noires.",
        diagnosis: "Trouble anxieux généralisé en amélioration",
        plan: "Escitalopram 10 mg poursuivi, exercices de respiration, revoir à 6 semaines.",
        icd: [{ code: "F41.9", label: "Trouble anxieux, sans précision" }],
        authorId: "doc-amine",
      },
      {
        id: uid(),
        patientId: p7,
        date: back(10),
        text: "Grossesse évolutive ~9 SA. Bilan initial prescrit, acide folique en cours.",
        motif: "Déclaration de grossesse",
        exam: "Utérus augmenté de volume, TA 110/70, pas de métrorragie.",
        diagnosis: "Grossesse intra-utérine évolutive du 1er trimestre",
        plan: "Bilan prénatal, échographie de datation, acide folique 0,4 mg/j, consultation mensuelle.",
        authorId: "doc-amine",
      },
      { id: uid(), patientId: p4, date: back(15), text: "Glycémie à jeun 1,08 g/L, bonne observance. Poursuite Metformine." },
      { id: uid(), patientId: p6, date: back(35), text: "LDL 1,42 g/L sous statine. Objectif atteint, contrôle dans 3 mois." },
    ],
    prescriptions: [
      { id: uid(), patientId: p1, date: back(30), text: "Amlodipine 5mg — 1 cp le matin, 30 jours" },
      { id: uid(), patientId: p2, date: back(45), text: "Ibuprofène 400mg — 1 cp x3/j pendant 5 jours\nThiocolchicoside 4mg — 1 cp le soir, 5 jours" },
      { id: uid(), patientId: p4, date: back(15), text: "Metformine 850mg — 1 cp matin et soir" },
      { id: uid(), patientId: p5, date: back(25), text: "Budésonide/Formotérol 160/4,5 — 2 inhalations x2/j\nSalbutamol 100 µg — 2 bouffées si gêne" },
      { id: uid(), patientId: p6, date: back(35), text: "Atorvastatine 20mg — 1 cp le soir, 90 jours" },
      { id: uid(), patientId: p8, date: back(12), text: "Metformine 1000mg — 1 cp x2/j\nGliclazide 30mg LP — 1 cp le matin\nPérindopril 10mg — 1 cp le matin" },
      { id: uid(), patientId: p9, date: back(18), text: "Escitalopram 10mg — 1 cp le matin, 30 jours" },
      { id: uid(), patientId: p7, date: back(10), text: "Acide folique 0,4mg — 1 cp/j jusqu'à 12 SA" },
      { id: uid(), patientId: p1, date: back(75), text: "Amlodipine 5mg — 1 cp le matin, 30 jours" },
      { id: uid(), patientId: p8, date: back(102), text: "Metformine 1000mg — 1 cp x2/j\nPérindopril 10mg — 1 cp le matin" },
      { id: uid(), patientId: p3, date: back(5), text: "Paracétamol 1g — 1 cp x3/j si douleur, 3 jours" },
      { id: uid(), patientId: p10, date: back(60), text: "Vitamine D 100 000 UI — 1 ampoule buvable, dose unique" },
    ],
    analyses: [
      {
        id: uid(),
        patientId: p4,
        date: back(95),
        values: [
          { label: "Glycémie", value: 1.42, unit: "g/L", ref: 1.1, refMin: 0.7 },
          { label: "HbA1c", value: 8.1, unit: "%", ref: 7 },
          { label: "Cholestérol total", value: 2.1, unit: "g/L", ref: 2 },
        ],
      },
      {
        id: uid(),
        patientId: p4,
        date: back(55),
        values: [
          { label: "Glycémie", value: 1.24, unit: "g/L", ref: 1.1, refMin: 0.7 },
          { label: "HbA1c", value: 7.4, unit: "%", ref: 7 },
          { label: "Cholestérol total", value: 2.0, unit: "g/L", ref: 2 },
        ],
      },
      {
        id: uid(),
        patientId: p4,
        date: back(15),
        values: [
          { label: "Glycémie", value: 1.08, unit: "g/L", ref: 1.1, refMin: 0.7 },
          { label: "HbA1c", value: 6.9, unit: "%", ref: 7 },
          { label: "Cholestérol total", value: 1.9, unit: "g/L", ref: 2 },
        ],
      },
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
      // Hédi — dyslipidémie sous statine
      ...[
        { off: 200, ct: 2.62, ldl: 1.86, hdl: 0.38, tg: 2.1 },
        { off: 110, ct: 2.28, ldl: 1.58, hdl: 0.41, tg: 1.7 },
        { off: 35, ct: 1.98, ldl: 1.42, hdl: 0.44, tg: 1.4 },
      ].map((b) => ({
        id: uid(),
        patientId: p6,
        date: back(b.off),
        values: [
          { label: "Cholestérol total", value: b.ct, unit: "g/L", ref: 2 },
          { label: "LDL", value: b.ldl, unit: "g/L", ref: 1.6 },
          { label: "HDL", value: b.hdl, unit: "g/L", ref: 0.9, refMin: 0.4 },
          { label: "Triglycérides", value: b.tg, unit: "g/L", ref: 1.5 },
        ],
      })),
      // Rania — anémie de grossesse
      {
        id: uid(),
        patientId: p7,
        date: back(9),
        values: [
          { label: "Hémoglobine", value: 10.6, unit: "g/dL", ref: 15, refMin: 11 },
          { label: "Ferritine", value: 11, unit: "µg/L", ref: 150, refMin: 15 },
          { label: "Glycémie", value: 0.82, unit: "g/L", ref: 0.92, refMin: 0.7 },
        ],
      },
      // Sami — HTA + diabète
      ...[
        { off: 90, gly: 1.66, hba: 8.4, crea: 13.8 },
        { off: 12, gly: 1.38, hba: 7.8, crea: 13.1 },
      ].map((b) => ({
        id: uid(),
        patientId: p8,
        date: back(b.off),
        values: [
          { label: "Glycémie", value: b.gly, unit: "g/L", ref: 1.1, refMin: 0.7 },
          { label: "HbA1c", value: b.hba, unit: "%", ref: 7 },
          { label: "Créatinine", value: b.crea, unit: "mg/L", ref: 13, refMin: 7 },
        ],
      })),
    ],
    checkups: [
      ...[
        { off: 300, s: 158, di: 96, w: 82.4, hr: 88, t: 36.8, pain: 5, st: "moins_bien", c: "Céphalées matinales, tension élevée." },
        { off: 210, s: 152, di: 93, w: 81.2, hr: 84, t: 36.7, pain: 4, st: "stable", c: "Introduction Amlodipine 5mg." },
        { off: 140, s: 145, di: 90, w: 79.8, hr: 80, t: 36.6, pain: 3, st: "mieux", c: "Meilleure tolérance, marche quotidienne." },
        { off: 75, s: 138, di: 86, w: 78.1, hr: 78, t: 36.6, pain: 2, st: "mieux", c: "Tension en baisse, sommeil amélioré." },
        { off: 30, s: 134, di: 84, w: 77.0, hr: 76, t: 36.5, pain: 1, st: "mieux", c: "Objectif tensionnel presque atteint." },
        { off: 5, s: 129, di: 81, w: 76.2, hr: 74, t: 36.5, pain: 1, st: "mieux", c: "État général très satisfaisant." },
      ].map((c) => ({
        id: uid(),
        patientId: p1,
        date: back(c.off),
        state: c.st as "mieux" | "stable" | "moins_bien",
        systolic: c.s,
        diastolic: c.di,
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
      ...[
        { off: 90, s: 152, di: 92, w: 91.0, st: "moins_bien", c: "HTA et glycémie élevées, ajout gliclazide envisagé." },
        { off: 40, s: 144, di: 88, w: 90.1, st: "stable", c: "Légère amélioration sous traitement renforcé." },
        { off: 12, s: 138, di: 84, w: 89.4, st: "mieux", c: "Meilleur équilibre, poursuite éducation diététique." },
      ].map((c) => ({
        id: uid(),
        patientId: p8,
        date: back(c.off),
        state: c.st as "mieux" | "stable" | "moins_bien",
        systolic: c.s,
        diastolic: c.di,
        weight: c.w,
        heartRate: 78,
        temperature: 36.6,
        pain: 1,
        comment: c.c,
      })),
      ...[
        { off: 60, st: "moins_bien", c: "Exacerbations fréquentes, DEP bas." },
        { off: 25, st: "stable", c: "Renforcement du traitement de fond." },
        { off: 4, st: "mieux", c: "Aucune crise depuis 3 semaines." },
      ].map((c) => ({
        id: uid(),
        patientId: p5,
        date: back(c.off),
        state: c.st as "mieux" | "stable" | "moins_bien",
        heartRate: 80,
        temperature: 36.6,
        pain: 0,
        comment: c.c,
      })),
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
        createdAt: iso(45),
      },
      {
        id: uid(),
        patientId: p5,
        type: "Certificat scolaire",
        documentDate: back(24),
        text: "Je soussigné certifie que l'état de santé de Mme Fatma Riahi a justifié une absence du 24 au 26 du mois écoulé.",
        createdAt: iso(24),
      },
      {
        id: uid(),
        patientId: p7,
        type: "Certificat de grossesse",
        documentDate: back(10),
        text: "Je soussigné certifie que Mme Rania Ferjani est enceinte, grossesse évolutive constatée ce jour, terme prévu dans environ 7 mois.",
        createdAt: iso(10),
      },
    ],
    referrals: [
      {
        id: uid(),
        patientId: p1,
        specialty: "Cardiologie",
        contactId: "ct-nour",
        reason: "HTA résistante malgré bithérapie, souffle systolique à explorer.",
        documentDate: back(60),
        text: "Je vous adresse Mme Salma Trabelsi pour avis cardiologique : hypertension mal équilibrée sous Amlodipine, souffle systolique 2/6. Merci de votre prise en charge.",
        createdAt: iso(60),
      },
      {
        id: uid(),
        patientId: p8,
        specialty: "Ophtalmologie",
        reason: "Diabète type 2 ancien — dépistage de rétinopathie (fond d'œil annuel).",
        documentDate: back(11),
        text: "Patient diabétique de type 2 depuis 12 ans, dernier fond d'œil il y a 2 ans. Merci de réaliser un examen du fond d'œil.",
        createdAt: iso(11),
      },
      {
        id: uid(),
        patientId: p5,
        specialty: "Pneumologie",
        reason: "Asthme mal contrôlé malgré palier 3, avis spécialisé et EFR.",
        documentDate: back(20),
        text: "Je vous adresse Mme Fatma Riahi pour asthme non contrôlé sous corticoïde inhalé + LABA. Merci de réaliser des EFR et d'adapter le traitement.",
        createdAt: iso(20),
      },
    ],
    vaccinations: [
      { id: uid(), patientId: p1, vaccine: "Grippe saisonnière", date: back(120), authorId: "doc-amine" },
      { id: uid(), patientId: p4, vaccine: "dTP (rappel)", date: back(400), nextDue: `${YEAR + 6}-01-30`, authorId: "doc-amine" },
      { id: uid(), patientId: p2, vaccine: "COVID-19 (rappel)", date: back(300), authorId: "doc-amine" },
      { id: uid(), patientId: p8, vaccine: "Pneumocoque (VPP23)", date: back(210), authorId: "doc-amine" },
      { id: uid(), patientId: p8, vaccine: "Grippe saisonnière", date: back(30), nextDue: d(300), authorId: "doc-amine" },
      { id: uid(), patientId: p5, vaccine: "Grippe saisonnière", date: back(35), authorId: "doc-amine" },
      { id: uid(), patientId: p7, vaccine: "dTPCa (grossesse)", date: back(3), authorId: "doc-amine" },
      { id: uid(), patientId: p10, vaccine: "ROR — 2e dose", date: back(200), authorId: "doc-slim" },
      { id: uid(), patientId: p10, vaccine: "dTPCa-Polio — rappel 6 ans", date: back(200), nextDue: d(20), authorId: "doc-slim" },
      { id: uid(), patientId: p6, vaccine: "dTP (rappel)", date: back(500), nextDue: back(15), authorId: "doc-amine" },
    ],
    documents: [
      {
        id: uid(),
        patientId: p4,
        name: "Bilan lipidique — laboratoire Ibn Sina.pdf",
        mime: "application/pdf",
        dataUrl: miniPdf("Bilan lipidique", "Laboratoire Ibn Sina — cholesterol, LDL, HDL, triglycerides"),
        category: "Analyse",
        uploadedAt: iso(55),
      },
      {
        id: uid(),
        patientId: p1,
        name: "ECG de repos — cabinet Dr Hammami.pdf",
        mime: "application/pdf",
        dataUrl: miniPdf("ECG de repos", "Cabinet Dr Nour Hammami — rythme sinusal regulier, pas de trouble"),
        category: "Compte rendu",
        uploadedAt: iso(58),
      },
      {
        id: uid(),
        patientId: p7,
        name: "Échographie de datation.pdf",
        mime: "application/pdf",
        dataUrl: miniPdf("Echographie de datation", "Grossesse intra-uterine evolutive — LCC compatible 9 SA"),
        category: "Imagerie",
        uploadedAt: iso(8),
      },
      {
        id: uid(),
        patientId: p8,
        name: "Courrier ophtalmologie.pdf",
        mime: "application/pdf",
        dataUrl: miniPdf("Courrier — ophtalmologie", "Depistage de retinopathie diabetique, fond d'oeil demande"),
        category: "Courrier",
        uploadedAt: iso(11),
      },
      {
        id: uid(),
        name: "Convention CNAM 2024.pdf",
        mime: "application/pdf",
        dataUrl: miniPdf("Convention CNAM 2024", "Convention de tiers payant — medecin de famille"),
        category: "Administratif",
        uploadedAt: iso(200),
      },
      {
        id: uid(),
        name: "Contrat de maintenance — autoclave.pdf",
        mime: "application/pdf",
        dataUrl: miniPdf("Contrat de maintenance — autoclave", "MediFourniture SARL — maintenance annuelle preventive"),
        category: "Administratif",
        uploadedAt: iso(120),
      },
    ],
    contacts: [
      {
        id: "ct-ibnsina",
        name: "Laboratoire Ibn Sina",
        kind: "Laboratoire",
        phone: "+216 73 401 220",
        email: "contact@lab-ibnsina.tn",
        address: "Avenue Habib Bourguiba, Sousse",
      },
      { id: "ct-nour", name: "Dr. Nour Hammami", kind: "Confrère", specialty: "Cardiologie", phone: "+216 71 884 021", email: "nour.hammami@cabinet.tn" },
      { id: "ct-slim", name: "Dr. Slim Gharbi", kind: "Confrère", specialty: "Pédiatrie", phone: "+216 74 512 660" },
      { id: "ct-medifourniture", name: "MédiFourniture SARL", kind: "Fournisseur", phone: "+216 71 350 900", address: "Zone industrielle, Ben Arous" },
      { id: "ct-radio", name: "Centre d'Imagerie El Yasmine", kind: "Laboratoire", specialty: "Radiologie / échographie", phone: "+216 73 226 540", address: "Rue de Palestine, Sousse" },
      { id: "ct-pneumo", name: "Dr. Olfa Naceur", kind: "Confrère", specialty: "Pneumologie", phone: "+216 98 771 220", email: "o.naceur@pneumo-sousse.tn" },
      { id: "ct-pharma", name: "Pharmacie Centrale M'saken", kind: "Fournisseur", phone: "+216 73 259 118" },
    ],
    diagnostics: [
      {
        id: uid(),
        patientId: p2,
        date: back(45),
        reason: "Douleur lombaire depuis 3 jours après port de charges",
        content:
          "Douleur apparue il y a 3 jours après avoir déplacé des cartons.\n" +
          "Siège : bas du dos à droite, pas d'irradiation dans la jambe.\n" +
          "Pas de fourmillements ni de faiblesse des membres inférieurs.\n" +
          "Aggravée en se penchant, soulagée allongé. Pas de fièvre.\n" +
          "Pas de trouble urinaire ou du transit.\n\n" +
          "Impression : lombalgie commune mécanique, pas de signe d'alerte. AINS + reprise progressive.",
        status: "termine",
        authorId: "doc-amine",
        createdAt: iso(45),
        updatedAt: iso(45),
      },
      {
        id: uid(),
        patientId: p8,
        date: back(1),
        reason: "Fatigue et essoufflement à l'effort depuis 2 semaines",
        content:
          "Essoufflé après un étage d'escaliers.\n" +
          "Gêné pour respirer allongé, dort avec 2 oreillers.\n" +
          "Chevilles gonflées en fin de journée.\n" +
          "Pas de douleur thoracique. Palpitations occasionnelles, pas sûr.\n" +
          "Pas de variation de poids notable.\n\n" +
          "À compléter : auscultation, ECG, pesée. Suspicion d'insuffisance cardiaque débutante à confirmer.",
        status: "brouillon",
        authorId: "doc-amine",
        createdAt: iso(1),
        updatedAt: iso(0.2),
      },
    ],
    messages: [
      // Canal Équipe
      { id: uid(), fromId: "doc-leila", text: "Bonjour à tous 👋 Trois patients doivent repasser signer leur volet CNAM : Mme Trabelsi, M. Sfaxi et M. Bouazizi.", date: iso(2), read: true },
      { id: uid(), fromId: "doc-amine", text: "Merci Leïla. On les rappelle cet après-midi.", date: iso(2 - 0.02), read: true },
      { id: uid(), fromId: "doc-leila", text: "Il reste 2 boîtes de bandelettes glycémie. Je passe commande chez MédiFourniture ?", date: iso(0.9), read: true },
      { id: uid(), fromId: "doc-amine", text: "Oui, commande 5 boîtes. 👍", date: iso(0.85), read: false },
      // Fil Dr Amine ↔ Leïla
      { id: uid(), fromId: "doc-amine", toId: "doc-leila", patientId: p3, text: "Peux-tu rappeler Mme Chaabane pour reprogrammer son rendez-vous ? Elle était absente hier.", date: iso(0.3), read: false },
      { id: uid(), fromId: "doc-leila", toId: "doc-amine", text: "C'est noté, je l'appelle ce matin.", date: iso(0.28), read: false },
      // Fil Dr Amine ↔ Emna
      { id: uid(), fromId: "doc-emna", toId: "doc-amine", patientId: p7, text: "Le bilan de Mme Ferjani est arrivé par mail, je l'ai classé dans ses documents. Hémoglobine basse (10,6 g/dL).", date: iso(1), read: false },
      { id: uid(), fromId: "doc-amine", toId: "doc-emna", text: "Parfait, merci. Je regarde ça avant sa consultation de jeudi.", date: iso(0.95), read: false },
      // Fil Leïla ↔ Emna
      { id: uid(), fromId: "doc-leila", toId: "doc-emna", text: "Tu peux couvrir l'accueil demain après-midi ? J'ai un rendez-vous à la CNAM.", date: iso(3), read: true },
      { id: uid(), fromId: "doc-emna", toId: "doc-leila", text: "Pas de souci 🙂", date: iso(3 - 0.05), read: true },
    ],
    audit: [],
    payments,
    settings: {
      doctorName: "Dr. Amine Belhaj",
      specialty: "Médecine générale",
      address: "12 Rue Ibn Khaldoun, Sousse",
      phone: "+216 73 220 118",
      licenseNumber: "MG-2011-4417",
      favorites: [
        { id: "fav-para", label: "Paracétamol 1 g", form: "comprimé", posology: "1 cp x 3/j si douleur ou fièvre", duration: "5 jours", drugClass: "Antalgique", uses: 40 },
        { id: "fav-amox", label: "Amoxicilline 1 g", form: "comprimé", posology: "1 cp matin et soir", duration: "7 jours", drugClass: "Antibiotique", note: "à distance des repas si possible", uses: 18 },
        { id: "fav-ibu", label: "Ibuprofène 400 mg", form: "comprimé", posology: "1 cp x 3/j", duration: "5 jours", drugClass: "AINS", note: "au milieu du repas", uses: 22 },
        { id: "fav-omep", label: "Oméprazole 20 mg", form: "gélule", posology: "1 gél. le matin à jeun", duration: "14 jours", drugClass: "IPP / anti-acide", uses: 15 },
        { id: "fav-amlo", label: "Amlodipine 5 mg", form: "comprimé", posology: "1 cp le matin", duration: "traitement de fond", drugClass: "Antihypertenseur", uses: 12 },
        { id: "fav-metf", label: "Metformine 850 mg", form: "comprimé", posology: "1 cp matin et soir", duration: "traitement de fond", drugClass: "Antidiabétique", note: "au cours des repas", uses: 11 },
        { id: "fav-atorva", label: "Atorvastatine 20 mg", form: "comprimé", posology: "1 cp le soir", duration: "traitement de fond", drugClass: "Hypolipémiant", uses: 6 },
        { id: "fav-salbu", label: "Salbutamol 100 µg", form: "inhalateur", posology: "2 bouffées si gêne respiratoire", drugClass: "Bronchodilatateur", route: "inhalée", uses: 7 },
        { id: "fav-cetiri", label: "Cétirizine 10 mg", form: "comprimé", posology: "1 cp le soir", duration: "7 jours", drugClass: "Antihistaminique", uses: 9 },
        { id: "fav-thioc", label: "Thiocolchicoside 4 mg", form: "comprimé", posology: "1 cp le soir", duration: "5 jours", drugClass: "Autre", uses: 5 },
        { id: "fav-vitd", label: "Vitamine D 100 000 UI", form: "ampoule buvable", posology: "1 ampoule, dose unique", drugClass: "Vitamine / supplément", uses: 8 },
        { id: "fav-sro", label: "Soluté de réhydratation orale", form: "sachet", posology: "1 sachet dans 200 mL d'eau après chaque selle", drugClass: "Autre", uses: 4 },
      ],
      protocols: [
        {
          id: "proto-angine",
          name: "Angine bactérienne (adulte)",
          category: "ORL",
          note: "Après test rapide positif ou score de Mac Isaac élevé.",
          lines: [
            "Amoxicilline 1 g - 1 cp matin et soir, 6 jours",
            "Paracétamol 1 g - 1 cp x 3/j si douleur ou fièvre, 5 jours",
            "Collutoire antiseptique - 3 pulvérisations x 3/j, 5 jours",
          ],
        },
        {
          id: "proto-lombalgie",
          name: "Lombalgie aiguë commune",
          category: "Rhumatologie",
          lines: [
            "Ibuprofène 400 mg - 1 cp x 3/j au milieu du repas, 5 jours",
            "Thiocolchicoside 4 mg - 1 cp le soir, 5 jours",
            "Oméprazole 20 mg - 1 gél. le matin, 7 jours (protection gastrique)",
          ],
        },
        {
          id: "proto-gea",
          name: "Gastro-entérite aiguë",
          category: "Digestif",
          lines: [
            "Soluté de réhydratation orale - 1 sachet dans 200 mL après chaque selle",
            "Racécadotril 100 mg - 1 gél. x 3/j jusqu'à arrêt de la diarrhée, max 7 jours",
            "Paracétamol 1 g - 1 cp x 3/j si fièvre",
          ],
        },
        {
          id: "proto-hta",
          name: "HTA — initiation du traitement",
          category: "Cardiovasculaire",
          note: "Réévaluer la tension à 4 semaines.",
          lines: [
            "Amlodipine 5 mg - 1 cp le matin, traitement de fond",
            "Mesures hygiéno-diététiques : réduction du sel < 5 g/j, activité physique 30 min/j",
          ],
        },
      ],
      consultDuration: 30,
      password: "Amine@2024",
      adminEmail: "admin@cabinet.tn",
      adminPassword: "Admin@2024",
      lockDelay: 5,
      theme: "light",
      appointmentCategories: [
        { id: "cat-consult", label: "Consultation", color: "#0077B6" },
        { id: "cat-suivi", label: "Suivi", color: "#2E9E6B" },
        { id: "cat-urgence", label: "Urgence", color: "#D1495B" },
        { id: "cat-visite", label: "Visite à domicile", color: "#C88A1A" },
        { id: "cat-teleconsult", label: "Téléconsultation", color: "#7B4FBF" },
      ],
      resources: [
        { id: "res-c1", name: "Salle de consultation 1", kind: "salle" },
        { id: "res-c2", name: "Salle de consultation 2", kind: "salle" },
        { id: "res-soins", name: "Salle de soins", kind: "salle" },
        { id: "res-ecg", name: "Appareil ECG", kind: "équipement" },
        { id: "res-spiro", name: "Spiromètre", kind: "équipement" },
      ],
      certificateTemplates: [
        {
          type: "Certificat de non contre-indication au voyage",
          text: "Je soussigné certifie que l'état de santé du patient ne présente pas de contre-indication à un voyage en avion.",
        },
      ],
    },
  };
}
