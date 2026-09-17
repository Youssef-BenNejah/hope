import { AlertTriangle } from "lucide-react";
import { parseReport } from "@/lib/cabinet/diagnostic-report";

export function DiagnosticReportView({
  content,
  maxLines,
  className = "",
}: {
  content: string;
  maxLines?: number;
  className?: string;
}) {
  const all = parseReport(content);
  if (!all.length) {
    return <p className={`text-sm italic text-muted-foreground ${className}`}>Aucune réponse enregistrée.</p>;
  }
  const lines = maxLines ? all.slice(0, maxLines) : all;
  const truncated = !!maxLines && all.length > maxLines;

  return (
    <div className={`space-y-1.5 text-sm ${className}`}>
      {lines.map((l, i) => {
        if (l.kind === "flag") {
          return (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-danger"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">{l.text}</span>
            </div>
          );
        }
        if (l.kind === "sub") {
          return (
            <p key={i} className="ml-4 flex items-start gap-2 text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-border-strong" />
              <span>{l.text}</span>
            </p>
          );
        }
        if (l.kind === "section") {
          const idx = l.text.indexOf(" : ");
          const title = l.text.slice(0, idx);
          const rest = l.text.slice(idx + 3);
          return (
            <p key={i}>
              <span className="font-semibold text-twilight dark:text-frost">{title}</span>
              <span className="text-muted-foreground"> : {rest}</span>
            </p>
          );
        }
        return <p key={i}>{l.text}</p>;
      })}
      {truncated && <p className="text-xs text-muted-foreground">…</p>}
    </div>
  );
}
