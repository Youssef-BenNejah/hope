import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import { matches } from "@/lib/cabinet/utils";
import { inputCls } from "./Modal";

export function PatientPicker({
  value,
  onSelect,
  onCreate,
  allowCreate = true,
}: {
  value: string | null;
  onSelect: (id: string) => void;
  onCreate?: (name: string) => void;
  allowCreate?: boolean;
}) {
  const { data } = useCabinet();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = data.patients.find((p) => p.id === value) ?? null;
  const all = [...data.patients].sort((a, b) => a.name.localeCompare(b.name));
  const results = query.trim()
    ? all.filter((p) => matches(p.name, query) || matches(p.phone, query) || matches(p.code ?? "", query))
    : all;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <span className="truncate">{selected.name}</span>
            <span className="num text-xs text-muted-foreground">{selected.phone}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Sélectionner un patient</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              className={`${inputCls} pl-8`}
              placeholder="Rechercher par nom ou téléphone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setQuery("");
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-cyan hover:text-twilight ${
                  p.id === value ? "bg-frost text-twilight" : ""
                }`}
              >
                <span className="truncate">{p.name}</span>
                <span className="num shrink-0 text-xs text-muted-foreground">{p.phone}</span>
              </button>
            ))}
            {results.length === 0 && allowCreate && onCreate && query.trim() && (
              <button
                type="button"
                onClick={() => {
                  onCreate(query);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-teal hover:bg-cyan"
              >
                + Créer « {query} » comme nouveau patient
              </button>
            )}
            {results.length === 0 && (!allowCreate || !query.trim()) && (
              <p className="px-3 py-3 text-sm text-muted-foreground">Aucun patient trouvé</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
