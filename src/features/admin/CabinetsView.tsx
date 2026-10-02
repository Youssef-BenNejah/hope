import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Building2, UserPlus } from "lucide-react";
import { Card } from "@/components/cabinet/Page";
import { PrimaryButton, inputCls } from "@/components/cabinet/Modal";
import { Pager } from "@/components/cabinet/Pager";
import type { CabinetFilters, CabinetStatus, CabinetSummary, StaffCredentials } from "@/lib/api";
import { fmtAgo, fmtDate } from "@/lib/format";
import { AddDoctorModal } from "./AddDoctorModal";
import { Pill, StatusBadge } from "./Badges";
import { CabinetDrawer } from "./CabinetDrawer";
import { CredentialsModal } from "./CredentialsModal";
import { useCabinets } from "./queries";

type Sort = NonNullable<CabinetFilters["sort"]>;

const Row = memo(function Row({ c, onOpen }: { c: CabinetSummary; onOpen: (id: string) => void }) {
  return (
    <tr
      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
      onClick={() => onOpen(c.id)}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(c.id)}
    >
      <td className="px-3 py-3">
        <p className="flex items-center gap-2 font-medium">
          {c.name} {c.current && <Pill tone="info">Mon cabinet</Pill>}
        </p>
        <p className="text-xs text-muted-foreground">Créé le {fmtDate(c.createdAt)}</p>
      </td>
      <td className="px-3 py-3">
        {c.owner ? (
          <>
            <p className="truncate">{c.owner.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.owner.specialty || c.owner.email}</p>
            {c.owner.pendingFirstLogin && <Pill tone="warning">1ère connexion en attente</Pill>}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="num px-3 py-3 text-center">{c.doctors}</td>
      <td className="num px-3 py-3 text-center">{c.secretaries}</td>
      <td className="num px-3 py-3 text-center">{c.patients}</td>
      <td className="px-3 py-3 text-muted-foreground">{fmtAgo(c.lastActivityAt)}</td>
      <td className="px-3 py-3">
        <StatusBadge status={c.status} />
      </td>
    </tr>
  );
});

/** Cabinet directory: server-side search, status filter, sorting and pagination. */
export function CabinetsView({ openId, onOpen }: { openId: string | undefined; onOpen: (id: string | undefined) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CabinetStatus | "ALL" | "">("");
  const [sort, setSort] = useState<Sort>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [credentials, setCredentials] = useState<{ value: StaffCredentials; title: string } | null>(null);
  const q = useDeferredValue(search.trim());

  useEffect(() => setPage(0), [q, status, sort, dir]);

  const filters = useMemo<CabinetFilters>(
    () => ({ sort, dir, page, size: 15, ...(q && { q }), ...(status && { status }) }),
    [q, status, sort, dir, page],
  );
  const cabinets = useCabinets(filters);
  const data = cabinets.data;

  const toggleSort = (key: Sort) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "name" ? "asc" : "desc");
    }
  };
  const SortHead = ({ label, k, className = "" }: { label: string; k: Sort; className?: string }) => (
    <th className={`label-caps px-3 py-2 text-[#CAF0F8] ${className}`}>
      <button className="inline-flex items-center gap-1 uppercase" onClick={() => toggleSort(k)}>
        {label}
        {sort === k && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Building2 className="h-4 w-4 text-teal" /> Cabinets et médecins
        </p>
        <PrimaryButton onClick={() => setAdding(true)}>
          <UserPlus className="h-4 w-4" /> Ajouter un médecin
        </PrimaryButton>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Rechercher un cabinet, un médecin, un email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher"
        />
        <select
          className={`${inputCls} w-auto`}
          value={status}
          onChange={(e) => setStatus(e.target.value as CabinetStatus | "ALL" | "")}
          aria-label="Filtrer par statut"
        >
          <option value="">Actifs et suspendus</option>
          <option value="ACTIVE">Actifs</option>
          <option value="SUSPENDED">Suspendus</option>
          <option value="ARCHIVED">Archivés</option>
          <option value="ALL">Tous</option>
        </select>
      </div>

      {cabinets.isError && <p className="mb-3 text-sm text-danger">Chargement impossible : {cabinets.error.message}</p>}

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-twilight text-left">
              <SortHead label="Cabinet" k="name" className="rounded-l-lg" />
              <th className="label-caps px-3 py-2 text-[#CAF0F8]">Médecin</th>
              <th className="label-caps px-3 py-2 text-center text-[#CAF0F8]">Méd.</th>
              <th className="label-caps px-3 py-2 text-center text-[#CAF0F8]">Secr.</th>
              <SortHead label="Patients" k="patients" className="text-center" />
              <SortHead label="Activité" k="lastActivity" />
              <th className="label-caps rounded-r-lg px-3 py-2 text-[#CAF0F8]">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((c) => <Row key={c.id} c={c} onOpen={onOpen} />)}
            {!data?.content.length && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  {cabinets.isPending ? "Chargement…" : "Aucun cabinet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />}

      <CabinetDrawer id={openId ?? null} onClose={() => onOpen(undefined)} />
      <AddDoctorModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(res) => setCredentials({ value: res.doctor, title: `Médecin ajouté — ${res.name}` })}
      />
      <CredentialsModal
        credentials={credentials?.value ?? null}
        title={credentials?.title ?? "Identifiants"}
        onClose={() => setCredentials(null)}
      />
    </Card>
  );
}
