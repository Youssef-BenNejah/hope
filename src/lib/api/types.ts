/** DTOs mirroring hope-backend (`/api/v1`). Dates are ISO-8601 strings. */

export type Role = "ADMIN" | "DOCTOR" | "SECRETARY";

export interface User {
  id: string;
  email: string;
  name: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Returned exactly once after a create or a password reset. */
export interface StaffCredentials {
  id: string;
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
  emailSent: boolean;
}

export type CabinetStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface DoctorBrief {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  active: boolean;
  pendingFirstLogin: boolean;
}

export interface CabinetSummary {
  id: string;
  name: string;
  status: CabinetStatus;
  createdAt: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
  doctors: number;
  secretaries: number;
  patients: number;
  lastActivityAt: string | null;
  /** True for the admin's own cabinet, which can't be suspended or archived. */
  current: boolean;
  owner: DoctorBrief | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialty: string | null;
  active: boolean;
  pendingFirstLogin: boolean;
  locked: boolean;
  lastLoginAt: string | null;
}

export interface ActivityEntry {
  action: string;
  /** Ready-made French sentence describing the action. */
  summary: string;
  actorName: string | null;
  at: string;
  ipAddress: string | null;
}

export interface CabinetDetail {
  cabinet: CabinetSummary;
  team: TeamMember[];
  recentActivity: ActivityEntry[];
}

export interface CabinetFilters {
  q?: string;
  status?: CabinetStatus | "ALL";
  sort?: "name" | "createdAt" | "patients" | "lastActivity";
  dir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface CreateCabinetInput {
  cabinetName: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone?: string;
  doctorSpecialty?: string;
  licenseNumber?: string;
  sendCredentialsByEmail?: boolean;
}

export interface CabinetCreated {
  id: string;
  name: string;
  createdAt?: string;
  doctor: StaffCredentials;
}

export interface PlatformOverview {
  cabinets: number;
  activeCabinets: number;
  suspendedCabinets: number;
  archivedCabinets: number;
  doctors: number;
  secretaries: number;
  patients: number;
  appointmentsLast30Days: number;
  newCabinetsLast30Days: number;
  newDoctorsLast30Days: number;
  pendingOnboardings: number;
}

export interface GrowthMonth {
  month: string;
  newCabinets: number;
  newDoctors: number;
  totalCabinets: number;
}

export interface CabinetActivity {
  cabinetId: string;
  name: string;
  appointments: number;
  actions: number;
  patients: number;
}

export interface SpecialtyCount {
  specialty: string;
  doctors: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  /** Ready-made French sentence describing the action. */
  summary: string;
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  cabinetId: string;
  cabinetName: string;
  targetName: string | null;
  ipAddress: string | null;
}

export interface AuditFilters {
  q?: string;
  action?: string;
  cabinetId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface PendingOnboarding {
  doctorId: string;
  name: string;
  email: string;
  cabinetId: string;
  cabinetName: string;
  createdAt: string;
  daysPending: number;
}

export interface LockedAccount {
  userId: string;
  name: string;
  email: string;
  role: Role;
  cabinetName: string;
  failedAttempts: number;
  locked: boolean;
  lockExpiresAt: string | null;
}

export interface InactiveCabinet {
  id: string;
  name: string;
  createdAt: string;
  lastActivityAt: string | null;
}

export interface FailedLogin {
  email: string;
  name: string;
  cabinetName: string;
  ipAddress: string | null;
  at: string;
}

export interface Attention {
  pendingOnboardings: PendingOnboarding[];
  lockedAccounts: LockedAccount[];
  inactiveCabinets: InactiveCabinet[];
  failedLogins24h: number;
  recentFailedLogins: FailedLogin[];
}
