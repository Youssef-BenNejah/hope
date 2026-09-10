import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { inputCls } from "./Modal";

/**
 * Liste déroulante avec recherche et saisie libre.
 * `allowCustom` permet d'ajouter une valeur qui n'est pas dans `options`.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  allowCustom = true,
  addLabel = (t) => `Ajouter « ${t} »`,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowCustom?: boolean;
  addLabel?: (typed: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const uniq = [...new Set(options.filter(Boolean))];
    return q ? uniq.filter((o) => o.toLowerCase().includes(q)) : uniq;
  }, [options, query]);

  const typed = query.trim();
  const showAdd = allowCustom && typed.length > 0 && !filtered.some((o) => o.toLowerCase() === typed.toLowerCase());

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} flex items-center justify-between gap-2 text-left`}
      >
        <span className={value ? "truncate" : "truncate text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              className={inputCls}
              placeholder="Rechercher ou saisir…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (showAdd) pick(typed);
                  else if (filtered[0]) pick(filtered[0]);
                }
              }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-cyan hover:text-twilight"
              >
                <span className="truncate">{o}</span>
                {o === value && <Check className="h-4 w-4 shrink-0 text-teal" />}
              </button>
            ))}
            {filtered.length === 0 && !showAdd && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</p>
            )}
          </div>
          {showAdd && (
            <button
              type="button"
              onClick={() => pick(typed)}
              className="flex w-full items-center gap-2 border-t border-border bg-muted/40 px-3 py-2.5 text-left text-sm font-medium text-teal hover:bg-cyan hover:text-twilight"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {addLabel(typed)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
