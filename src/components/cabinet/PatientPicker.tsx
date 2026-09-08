import { useState } from "react";
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
  const { data, patientName } = useCabinet();
  const [query, setQuery] = useState(value ? patientName(value) : "");
  const [open, setOpen] = useState(false);

  const results = data.patients.filter((p) => matches(p.name, query) || matches(p.phone, query));

  return (
    <div className="relative">
      <input
        className={inputCls}
        placeholder="Rechercher un patient (nom ou téléphone)"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && query.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p.id);
                setQuery(p.name);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cyan hover:text-twilight"
            >
              <span>{p.name}</span>
              <span className="num text-xs text-muted-foreground">{p.phone}</span>
            </button>
          ))}
          {results.length === 0 && allowCreate && onCreate && (
            <button
              type="button"
              onClick={() => {
                onCreate(query);
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-teal hover:bg-cyan"
            >
              + Créer « {query} » comme nouveau patient
            </button>
          )}
          {results.length === 0 && !allowCreate && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucun patient trouvé</p>
          )}
        </div>
      )}
    </div>
  );
}
