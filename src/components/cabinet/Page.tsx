import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>
  );
}


export function ScreenTransition({ children }: { children: ReactNode }) {
  return <div className="animate-in fade-in duration-150">{children}</div>;
}

export function EmptyState({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-card px-6 py-14 text-center">
      <div className="text-frost">{icon}</div>
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(11,18,32,0.04)] ${className}`}>
      {children}
    </div>
  );
}
