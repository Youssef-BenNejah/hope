export type AppointmentStatus = "upcoming" | "done" | "absent";
export type PaymentMethod = "cash" | "cnam_pending" | "cnam_paid";
export type TrackerStatus = "waiting" | "in_consult" | "done";
export type UserRole = "medecin" | "secretaire";

export interface Patient {
  id: string;
  code: string; // identifiant unique : initiales + 6 chiffres
  name: string;
  phone: string;
  birthDate: string;
  sex?: "homme" | "femme";
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
  category?: string; // id de AppointmentCategory
  resourceId?: string; // salle / équipement / praticien
  checkedInAt?: string; // ISO — heure d'arrivée au cabinet
  tracker?: TrackerStatus; // position dans le flux salle d'attente → sortie
}

export interface Block {
  id: string;
  date: string;
  start: string;
  end: string;
  reason: string;
}

/** Jour férié : bloque automatiquement l'agenda */
export interface Holiday {
  id: string;
  date: string; // yyyy-MM-dd
  label: string;
}

export interface Resource {
  id: string;
  name: string;
  kind: "salle" | "équipement" | "praticien";
}

export interface AppointmentCategory {
  id: string;
  label: string;
  color: string; // hex
}

export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

export interface IcdCode {
  code: string;
  label: string;
}

export interface Note {
  id: string;
  patientId: string;
  date: string;
  text: string;
  attachments?: NoteAttachment[];
  // Consultation structurée (facultative — une note peut rester du texte libre)
  motif?: string;
  exam?: string;
  diagnosis?: string;
  plan?: string;
  icd?: IcdCode[];
  authorId?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  text: string;
  renewedFrom?: string; // id de l'ordonnance d'origine
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

/** Modèles de certificats livrés d'origine (le champ `type` accepte aussi des modèles personnalisés) */
export const BUILTIN_CERTIFICATE_TYPES = [
  "Arrêt de travail",
  "Aptitude sportive",
  "Certificat scolaire",
  "Certificat de grossesse",
  "Certificat de vaccination",
] as const;

/** Modèle de certificat personnalisé, ajouté par le médecin */
export interface CertificateTemplate {
  type: string;
  text: string;
}

export interface Certificate {
  id: string;
  patientId: string;
  type: string;
  documentDate: string;
  startDate?: string;
  days?: number;
  endDate?: string;
  text: string;
  createdAt: string;
}

/** Courrier d'orientation vers un spécialiste */
export interface Referral {
  id: string;
  patientId: string;
  specialty: string;
  contactId?: string; // destinataire dans le carnet d'adresses
  reason: string;
  documentDate: string;
  text: string;
  createdAt: string;
}

/** Ligne du registre de vaccination */
export interface Vaccination {
  id: string;
  patientId: string;
  vaccine: string;
  date: string;
  dose?: string;
  batch?: string;
  nextDue?: string; // yyyy-MM-dd — prochaine dose attendue
  authorId?: string;
}

/** Document classé (analyse, imagerie, courrier…) */
export interface CabinetDocument {
  id: string;
  patientId?: string; // undefined = non rattaché
  name: string;
  mime: string;
  dataUrl: string;
  category: string;
  uploadedAt: string;
}

/** Types de contact usuels (le champ `kind` accepte aussi des valeurs personnalisées) */
export const CONTACT_KINDS = ["Confrère", "Laboratoire", "Fournisseur", "Autre"] as const;

/** Contact externe : confrère, laboratoire, fournisseur… */
export interface Contact {
  id: string;
  name: string;
  kind: string; // un des CONTACT_KINDS ou un type saisi librement
  specialty?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * Entretien libre : le médecin interroge le patient de vive voix et note
 * uniquement les réponses dans l'application. Aucune question pré-remplie.
 * Brouillon daté, rattaché au dossier et à l'historique, modifiable à tout moment.
 */
export interface Diagnostic {
  id: string;
  patientId: string;
  date: string; // yyyy-MM-dd — date de l'entretien
  reason?: string; // motif principal (facultatif)
  content: string; // réponses du patient, notées librement par le médecin
  status: "brouillon" | "termine";
  authorId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Message de la messagerie interne (style conversation) */
export interface OfficeMessage {
  id: string;
  fromId: string;
  toId?: string; // undefined = canal « Équipe »
  patientId?: string; // optionnel : message rattaché à un patient
  text: string;
  attachments?: NoteAttachment[];
  date: string; // ISO
  read: boolean;
}

/** Entrée du journal d'activité */
export interface AuditEntry {
  id: string;
  at: string; // ISO
  actor: string;
  summary: string;
}

export interface Payment {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
}

/** Classes thérapeutiques usuelles (le champ `drugClass` accepte aussi une valeur libre) */
export const DRUG_CLASSES = [
  "Antalgique",
  "AINS",
  "Antibiotique",
  "Antipyrétique",
  "IPP / anti-acide",
  "Antihypertenseur",
  "Antidiabétique",
  "Hypolipémiant",
  "Corticoïde",
  "Antihistaminique",
  "Bronchodilatateur",
  "Antitussif",
  "Antispasmodique",
  "Anxiolytique / hypnotique",
  "Vitamine / supplément",
  "Dermatologie",
  "Autre",
] as const;

/** Médicament favori — sert à générer une ligne d'ordonnance */
export interface Favorite {
  id: string;
  label: string; // dénomination + dosage, ex. "Paracétamol 1 g"
  form?: string; // comprimé, gélule, sachet, sirop, inhalateur…
  posology: string; // "1 cp x 3/j"
  duration?: string; // "5 jours", "traitement de fond"
  route?: string; // orale, cutanée, inhalée…
  note?: string; // "au milieu du repas"
  drugClass?: string;
  uses?: number; // compteur d'utilisation (tri « les plus utilisés »)
}

/** Ordonnance type : ensemble de lignes prêtes à insérer pour une situation fréquente */
export interface Protocol {
  id: string;
  name: string; // "Angine bactérienne (adulte)"
  category?: string;
  note?: string;
  lines: string[];
}

export interface Settings {
  doctorName: string;
  specialty: string;
  address: string;
  phone: string;
  licenseNumber: string;
  favorites: Favorite[];
  protocols: Protocol[];
  consultDuration: number; // durée d'une consultation en minutes
  pin: string;
  adminPin: string;
  lockDelay: number; // minutes, 0 = jamais
  theme: "light" | "dark" | "system";
  appointmentCategories: AppointmentCategory[];
  resources: Resource[];
  certificateTemplates: CertificateTemplate[];
}

/** Compte médecin / personnel géré depuis l'écran d'administration */
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
  role: UserRole;
  // Dossier personnel (surtout utilisé pour le personnel non médical)
  photo?: string; // dataUrl
  birthDate?: string;
  cin?: string; // carte d'identité nationale
  address?: string;
  hiredAt?: string; // date d'embauche
  contractType?: "CDI" | "CDD" | "Stage" | "Temps partiel";
  bank?: string;
  rib?: string; // relevé d'identité bancaire (20 chiffres)
  emergencyContact?: string;
  notes?: string;
}

export interface CabinetData {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  blocks: Block[];
  holidays: Holiday[];
  notes: Note[];
  prescriptions: Prescription[];
  analyses: Analysis[];
  certificates: Certificate[];
  referrals: Referral[];
  vaccinations: Vaccination[];
  documents: CabinetDocument[];
  contacts: Contact[];
  diagnostics: Diagnostic[];
  messages: OfficeMessage[];
  audit: AuditEntry[];
  checkups: Checkup[];
  payments: Payment[];
  settings: Settings;
}
