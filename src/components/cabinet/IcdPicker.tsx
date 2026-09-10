import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import type { IcdCode } from "@/lib/cabinet/types";
import { searchIcd } from "@/lib/cabinet/icd10";
import { inputCls } from "./Modal";

export function IcdPicker({
  value,
  onChange,
}: {
  value: IcdCode[];
  onChange: (codes: IcdCode[]) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const picked = new Set(value.map((v) => v.code));
    return searchIcd(query).filter((c) => !picked.has(c.code));
  }, [query, value]);

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1.5 rounded-full bg-frost px-2.5 py-1 text-xs text-twilight"
            >
              <span className="num font-semibold">{c.code}</span>
              <span className="max-w-[220px] truncate">{c.label}</span>
              <button
                type="button"
                aria-label={`Retirer ${c.code}`}
                onClick={() => onChange(value.filter((x) => x.code !== c.code))}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className={inputCls}
        placeholder="Rechercher un code CIM-10 (ex. hypertension, J06, diabète)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() && (
        <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucun code correspondant.</p>
          ) : (
            results.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange([...value, c]);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cyan hover:text-twilight"
              >
                <Plus className="h-3.5 w-3.5 shrink-0 text-teal" />
                <span className="num w-16 shrink-0 font-semibold">{c.code}</span>
                <span className="truncate">{c.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
