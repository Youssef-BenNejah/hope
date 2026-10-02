import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/cabinet/Page";
import { GhostButton, inputCls } from "@/components/cabinet/Modal";
import { Pager } from "@/components/cabinet/Pager";
import { api, type AuditFilters } from "@/lib/api";
import { errorMessage, fmtDateTime, saveBlob } from "@/lib/format";
import { useAudit, useCabinets } from "./queries";

/** Actions worth filtering on; the table itself shows the backend's ready-made French sentence. */
const ACTIONS: [string, string][] = [
  ["LOGIN", "Connexions"],
  ["LOGIN_FAILED", "Échecs de connexion"],
  ["STAFF_CREATED", "Comptes créés"],
  ["STAFF_PASSWORD_RESET", "Mots de passe réinitialisés"],
  ["STAFF_ACTIVATED", "Comptes activés"],
  ["STAFF_DEACTIVATED", "Comptes désactivés"],
  ["STAFF_UNLOCKED", "Comptes débloqués"],
  ["PASSWORD_CHANGED", "Mots de passe modifiés"],
  ["CABINET_UPDATED", "Cabinets renommés"],
  ["CABINET_SUSPENDED", "Cabinets suspendus"],
  ["CABINET_REACTIVATED", "Cabinets réactivés"],
  ["CABINET_ARCHIVED", "Cabinets archivés"],
];

/** Global activity journal across every cabinet, with CSV export of the current filters. */
export function JournalView() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [cabinetId, setCabinetId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const q = useDeferredValue(search.trim());

  useEffect(() => setPage(0), [q, action, cabinetId, from, to]);

  const base = useMemo<Omit<AuditFilters, "page" | "size">>(
    () => ({
      ...(q && { q }),
      ...(action && { action }),
      ...(cabinetId && { cabinetId }),
      ...(from && { from }),
      ...(to && { to }),
    }),
    [q, action, cabinetId, from, to],
  );
  const audit = useAudit({ ...base, page, size: 25 });
  const cabinets = useCabinets({ status: "ALL", sort: "name", dir: "asc", size: 100 });
  const data = audit.data;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await api.platform.exportAudit(base);
      saveBlob(blob, filename);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <ScrollText className="h-4 w-4 text-teal" /> Journal d'activité de la plateforme
        </p>
        <GhostButton onClick={exportCsv} disabled={exporting}>
          <Download className="h-4 w-4" /> {exporting ? "Export…" : "Exporter en CSV"}
        </GhostButton>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Rechercher (acteur, cabinet, action)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher"
        />
        <select className={`${inputCls} w-auto`} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Action">
          <option value="">Toutes les actions</option>
          {ACTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} w-auto max-w-[14rem]`}
          value={cabinetId}
          onChange={(e) => setCabinetId(e.target.value)}
          aria-label="Cabinet"
        >
          <option value="">Tous les cabinets</option>
          {cabinets.data?.content.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input className={`${inputCls} w-auto`} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="Du" />
        <input className={`${inputCls} w-auto`} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="Au" />
      </div>

      {audit.isError && <p className="mb-3 text-sm text-danger">Chargement impossible : {audit.error.message}</p>}

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-twilight text-left">
              {["Date", "Événement", "Acteur", "Cabinet", "IP"].map((h, i) => (
                <th key={h} className={`label-caps px-3 py-2 text-[#CAF0F8] ${i === 0 ? "rounded-l-lg" : ""} ${i === 4 ? "rounded-r-lg" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.content.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">{fmtDateTime(e.at)}</td>
                <td className="px-3 py-2.5">{e.summary}</td>
                <td className="px-3 py-2.5">
                  <p className="truncate">{e.actorName || e.actorEmail}</p>
                  {e.actorName && <p className="truncate text-xs text-muted-foreground">{e.actorEmail}</p>}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{e.cabinetName}</td>
                <td className="num px-3 py-2.5 text-muted-foreground">{e.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {!data?.content.length && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                  {audit.isPending ? "Chargement…" : "Aucun événement"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />}
    </Card>
  );
}
