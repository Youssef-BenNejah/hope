import type { CabinetStatus } from "@/lib/api";

const STATUS: Record<CabinetStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "Actif", cls: "bg-success-soft text-success" },
  SUSPENDED: { label: "Suspendu", cls: "bg-warning-soft text-warning" },
  ARCHIVED: { label: "Archivé", cls: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: CabinetStatus }) {
  const s = STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warning" | "danger" | "info" }) {
  const cls = {
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-frost/40 text-twilight dark:text-frost",
  }[tone];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}
