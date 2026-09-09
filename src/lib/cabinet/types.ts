export type AppointmentStatus = "upcoming" | "done" | "absent";
export type PaymentMethod = "cash" | "cnam_pending" | "cnam_paid";

export interface Patient {
  id: string;
  code: string; // identifiant unique : initiales + 6 chiffres
  name: string;
  phone: string;
  birthDate: string;
  country?: string;
  coverage?: "cnam" | "assurance" | "aucune";
  insurer?: string;
  cnam: string;
  allergies: string[];
  chronic: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
}

export interface Block {
  id: string;
  date: string;
  start: string;
  end: string;
  reason: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

export interface Note {
  id: string;
  patientId: string;
  date: string;
  text: string;
  attachments?: NoteAttachment[];
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  text: string;
}

export interface AnalysisValue {
  label: string;
  value: number;
  unit: string;
  ref: number; // borne haute de référence
  refMin?: number; // borne basse de référence
}

export interface Analysis {
  id: string;
  patientId: string;
  date: string;
  values: AnalysisValue[];
}

export type PatientState = "mieux" | "stable" | "moins_bien";

/** Point de suivi clinique saisi par le médecin */
export interface Checkup {
  id: string;
  patientId: string;
  date: string;
  state: PatientState;
  weight?: number; // kg
  systolic?: number; // mmHg
  diastolic?: number; // mmHg
  heartRate?: number; // bpm
  temperature?: number; // °C
  pain?: number; // 0 à 10
  comment?: string;
}

export type CertificateType =
  | "Arrêt de travail"
  | "Aptitude sportive"
  | "Certificat scolaire"
  | "Certificat de grossesse"
  | "Certificat de vaccination";

export interface Certificate {
  id: string;
  patientId: string;
  type: CertificateType;
  documentDate: string;
  startDate?: string;
  days?: number;
  endDate?: string;
  text: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
}

export interface Settings {
  doctorName: string;
  specialty: string;
  address: string;
  phone: string;
  licenseNumber: string;
  favorites: string[];
  consultDuration: number; // durée d'une consultation en minutes
  pin: string;
  adminPin: string;
  lockDelay: number; // minutes, 0 = jamais
  theme: "light" | "dark" | "system";
}

/** Compte médecin géré depuis l'écran d'administration */
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  licenseNumber: string;
  pin: string;
  active: boolean;
  createdAt: string;
  lastPinResetAt?: string;
}

export interface CabinetData {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  blocks: Block[];
  notes: Note[];
  prescriptions: Prescription[];
  analyses: Analysis[];
  certificates: Certificate[];
  checkups: Checkup[];
  payments: Payment[];
  settings: Settings;
}
