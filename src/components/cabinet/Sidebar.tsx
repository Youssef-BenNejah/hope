import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Lock,
  Pill,
  Receipt,
  Settings as SettingsIcon,
  Sun,
  Users,
  Check,
} from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";

const items = [
  { to: "/", label: "Aujourd'hui", icon: Sun },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/ordonnances", label: "Ordonnances", icon: Pill },
  { to: "/certificats", label: "Certificats", icon: FileText },
  { to: "/comptabilite", label: "Comptabilité", icon: Receipt },
  { to: "/parametres", label: "Paramètres", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const { data, lock, offline, setOffline, pending, syncing, justSynced } = useCabinet();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[76px] flex-col bg-sidebar text-sidebar-foreground xl:w-60">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-frost font-bold text-twilight">
          C.
        </div>
        <div className="hidden min-w-0 xl:block">
          <p className="truncate font-semibold">Cabinet</p>
          <p className="truncate text-xs text-frost/80">{data.settings.doctorName}</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-teal text-white" : "text-sidebar-foreground/80 hover:bg-white/10"
              }`}
            >
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-surf" />}
              <Icon className={`h-5 w-5 shrink-0 ${active ? "text-frost" : ""}`} />
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              offline ? "bg-[#C88A1A] animate-softpulse" : "bg-[#1B9C6E]"
            }`}
          />
          <span className="hidden xl:inline">
            {syncing
              ? "Synchronisation en cours…"
              : offline
                ? `Mode hors connexion — ${pending} modification${pending > 1 ? "s" : ""} en attente`
                : "Toutes les données sont sauvegardées"}
          </span>
        </div>
        {syncing && (
          <div className="mt-2 hidden h-1 overflow-hidden rounded-full bg-white/15 xl:block">
            <div className="h-full w-1/3 animate-[softpulse_1s_ease-in-out_infinite] rounded-full bg-surf" />
          </div>
        )}
        {justSynced && (
          <p className="mt-2 hidden items-center gap-1 text-[#90E0EF] xl:flex">
            <Check className="h-3.5 w-3.5" /> Synchronisé
          </p>
        )}
        <label className="mt-3 hidden cursor-pointer items-center justify-between gap-2 xl:flex">
          <span className="text-frost/80">Simuler une coupure réseau</span>
          <input
            type="checkbox"
            checked={offline}
            onChange={(e) => setOffline(e.target.checked)}
            className="h-4 w-4 accent-[#00B4D8]"
          />
        </label>
      </div>

      <button
        onClick={lock}
        className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm transition-colors hover:bg-white/10"
      >
        <Lock className="h-4 w-4" />
        <span className="hidden xl:inline">Verrouiller</span>
      </button>
    </aside>
  );
}
