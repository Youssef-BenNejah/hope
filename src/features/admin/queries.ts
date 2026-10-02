import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type AuditFilters, type CabinetFilters, type CreateCabinetInput } from "@/lib/api";
import { errorMessage } from "@/lib/format";

export const keys = {
  cabinets: ["cabinets"] as const,
  cabinetList: (f: CabinetFilters) => ["cabinets", "list", f] as const,
  cabinet: (id: string) => ["cabinets", "detail", id] as const,
  platform: ["platform"] as const,
  overview: ["platform", "overview"] as const,
  growth: (months: number) => ["platform", "growth", months] as const,
  activity: (order: string, limit: number) => ["platform", "activity", order, limit] as const,
  specialties: ["platform", "specialties"] as const,
  attention: ["platform", "attention"] as const,
  audit: (f: AuditFilters) => ["platform", "audit", f] as const,
};

export const usePlatformOverview = () =>
  useQuery({ queryKey: keys.overview, queryFn: ({ signal }) => api.platform.overview(signal) });

export const useGrowth = (months = 6) =>
  useQuery({ queryKey: keys.growth(months), queryFn: ({ signal }) => api.platform.growth(months, signal) });

export const useCabinetActivity = (order: "asc" | "desc", limit = 5) =>
  useQuery({
    queryKey: keys.activity(order, limit),
    queryFn: ({ signal }) => api.platform.cabinetActivity(order, limit, signal),
  });

export const usePlatformSpecialties = () =>
  useQuery({ queryKey: keys.specialties, queryFn: ({ signal }) => api.platform.specialties(signal) });

export const useAttention = () =>
  useQuery({ queryKey: keys.attention, queryFn: ({ signal }) => api.platform.attention(signal) });

export const useCabinets = (filters: CabinetFilters) =>
  useQuery({
    queryKey: keys.cabinetList(filters),
    queryFn: ({ signal }) => api.cabinets.list(filters, signal),
    placeholderData: keepPreviousData,
  });

export const useCabinetDetail = (id: string | null) =>
  useQuery({
    queryKey: keys.cabinet(id ?? ""),
    queryFn: ({ signal }) => api.cabinets.get(id as string, signal),
    enabled: !!id,
  });

export const useAudit = (filters: AuditFilters) =>
  useQuery({
    queryKey: keys.audit(filters),
    queryFn: ({ signal }) => api.platform.audit(filters, signal),
    placeholderData: keepPreviousData,
  });

/** Shared mutation plumbing: error toast + refetch of everything a platform change can affect. */
function useAdminMutation<TInput, TOutput>(fn: (input: TInput) => Promise<TOutput>) {
  const qc = useQueryClient();
  return useMutation<TOutput, Error, TInput>({
    mutationFn: fn,
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.cabinets });
      void qc.invalidateQueries({ queryKey: keys.platform });
    },
  });
}

export const useCreateCabinet = () => useAdminMutation((input: CreateCabinetInput) => api.cabinets.create(input));

export const useRenameCabinet = () =>
  useAdminMutation(({ id, name }: { id: string; name: string }) => api.cabinets.rename(id, name));

export const useSetSuspension = () =>
  useAdminMutation(({ id, suspended, reason }: { id: string; suspended: boolean; reason?: string }) =>
    api.cabinets.setSuspension(id, suspended, reason),
  );

export const useArchiveCabinet = () => useAdminMutation((id: string) => api.cabinets.archive(id));

export const useResetCredentials = () =>
  useAdminMutation(({ cabinetId, userId, email }: { cabinetId: string; userId: string; email: boolean }) =>
    api.cabinets.resetCredentials(cabinetId, userId, email),
  );

export const useUnlock = () => useAdminMutation((userId: string) => api.platform.unlock(userId));
