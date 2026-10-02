import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  const btn =
    "inline-flex items-center rounded-lg border border-border p-2 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {total} résultat{total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="num">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <button
          className={btn}
          disabled={page + 1 >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
