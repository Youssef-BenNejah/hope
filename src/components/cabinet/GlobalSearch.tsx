import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, CornerDownLeft } from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import { ageFrom, matches } from "@/lib/cabinet/utils";

const pages = [
  { label: "Aujourd'hui", to: "/" },
  { label: "Rappels", to: "/rappels" },
  { label: "Agenda", to: "/agenda" },
  { label: "Salle d'attente", to: "/tracker" },
  { label: "Ordonnances", to: "/ordonnances" },
  { label: "Certificats", to: "/certificats" },
  { label: "Orientations", to: "/orientations" },
  { label: "Vaccinations", to: "/vaccinations" },
  { label: "Documents", to: "/documents" },
  { label: "Comptabilité & rapports", to: "/comptabilite" },
  { label: "Annuaire", to: "/annuaire" },
  { label: "Messages", to: "/messages" },
  { label: "Personnel", to: "/personnel" },
  { label: "Paramètres", to: "/parametres" },
] as const;

export function GlobalSearch() {
  const { data } = useCabinet();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const term = q.trim();
    if (!term) return { patients: [], links: [] as typeof pages[number][] };
    const patients = data.patients
      .filter((p) => matches(p.name, term) || matches(p.phone, term) || matches(p.code ?? "", term))
      .slice(0, 6);
    const links = pages.filter((p) => matches(p.label, term)).slice(0, 4);
    return { patients, links };
  }, [q, data.patients]);

  const flat = [
    ...results.patients.map((p) => ({ kind: "patient" as const, p })),
    ...results.links.map((l) => ({ kind: "link" as const, l })),
  ];

  const go = (i: number) => {
    const item = flat[i];
    if (!item) return;
    if (item.kind === "patient") navigate({ to: "/patients", search: { p: item.p.id } });
    else navigate({ to: item.l.to });
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-md" ref={boxRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            go(active);
          } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Rechercher un patient, une rubrique…  ( / )"
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-teal"
      />

      {open && q.trim() && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {flat.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Aucun résultat pour « {q} ».</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {results.patients.length > 0 && (
                <p className="label-caps px-3 py-1.5 text-muted-foreground">Patients</p>
              )}
              {results.patients.map((p, i) => (
                <button
                  key={p.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(i)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                    active === i ? "bg-cyan text-twilight" : "hover:bg-muted"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="num shrink-0 text-xs text-muted-foreground">{p.code}</span>
                  </span>
                  <span className="num shrink-0 text-xs text-muted-foreground">
                    {ageFrom(p.birthDate) !== null ? `${ageFrom(p.birthDate)} ans` : p.phone}
                  </span>
                </button>
              ))}
              {results.links.length > 0 && (
                <p className="label-caps px-3 py-1.5 text-muted-foreground">Rubriques</p>
              )}
              {results.links.map((l, j) => {
                const i = results.patients.length + j;
                return (
                  <button
                    key={l.to}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(i)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      active === i ? "bg-cyan text-twilight" : "hover:bg-muted"
                    }`}
                  >
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    Aller à « {l.label} »
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
