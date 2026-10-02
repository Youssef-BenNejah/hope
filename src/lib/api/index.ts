import { download, request, refreshSession, setAccessToken } from "./http";
import type {
  Attention,
  AuditEntry,
  AuditFilters,
  AuthResponse,
  CabinetActivity,
  CabinetCreated,
  CabinetDetail,
  CabinetFilters,
  CabinetSummary,
  CreateCabinetInput,
  GrowthMonth,
  Page,
  PlatformOverview,
  SpecialtyCount,
  StaffCredentials,
  User,
} from "./types";

export * from "./types";
export { ApiError, setSessionExpiredHandler } from "./http";

/** Every call the admin console makes to hope-backend. */
export const api = {
  auth: {
    async login(email: string, password: string): Promise<User> {
      const auth = await request<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false });
      setAccessToken(auth.accessToken);
      return auth.user;
    },
    /** Silent session restore (refresh cookie). Resolves null when there is no session. */
    async restore(): Promise<User | null> {
      return (await refreshSession())?.user ?? null;
    },
    async logout(): Promise<void> {
      try {
        await request<void>("/auth/logout", { method: "POST" });
      } finally {
        setAccessToken(null);
      }
    },
  },

  cabinets: {
    list: (filters: CabinetFilters, signal?: AbortSignal) =>
      request<Page<CabinetSummary>>("/cabinets", { query: { ...filters }, signal }),
    get: (id: string, signal?: AbortSignal) => request<CabinetDetail>(`/cabinets/${id}`, { signal }),
    /** Provisions a cabinet and its first doctor in one call. */
    create: (input: CreateCabinetInput) => request<CabinetCreated>("/cabinets", { method: "POST", body: input }),
    rename: (id: string, name: string) => request<CabinetSummary>(`/cabinets/${id}`, { method: "PATCH", body: { name } }),
    setSuspension: (id: string, suspended: boolean, reason?: string) =>
      request<CabinetSummary>(`/cabinets/${id}/suspension`, {
        method: "POST",
        body: { suspended, ...(reason ? { reason } : {}) },
      }),
    /** Archive (soft delete): nothing is purged, the staff just can't sign in any more. */
    archive: (id: string) => request<void>(`/cabinets/${id}`, { method: "DELETE" }),
    /** New one-time password for a member of the cabinet; also resends it by email when asked. */
    resetCredentials: (cabinetId: string, userId: string, sendCredentialsByEmail: boolean) =>
      request<StaffCredentials>(`/cabinets/${cabinetId}/staff/${userId}/password-reset`, {
        method: "POST",
        body: { sendCredentialsByEmail },
      }),
  },

  platform: {
    overview: (signal?: AbortSignal) => request<PlatformOverview>("/stats/platform/overview", { signal }),
    growth: (months: number, signal?: AbortSignal) =>
      request<GrowthMonth[]>("/stats/platform/growth", { query: { months }, signal }),
    cabinetActivity: (order: "asc" | "desc", limit: number, signal?: AbortSignal) =>
      request<CabinetActivity[]>("/stats/platform/cabinet-activity", { query: { order, limit, days: 30 }, signal }),
    specialties: (signal?: AbortSignal) => request<SpecialtyCount[]>("/stats/platform/specialties", { signal }),
    attention: (signal?: AbortSignal) => request<Attention>("/platform/attention", { signal }),
    audit: (filters: AuditFilters, signal?: AbortSignal) =>
      request<Page<AuditEntry>>("/platform/audit-logs", { query: { ...filters }, signal }),
    exportAudit: (filters: Omit<AuditFilters, "page" | "size">) =>
      download(
        "/platform/audit-logs/export.csv",
        { ...filters },
        `journal-plateforme-${new Date().toISOString().slice(0, 10)}.csv`,
      ),
    unlock: (userId: string) => request<void>(`/platform/users/${userId}/unlock`, { method: "POST" }),
  },
};
