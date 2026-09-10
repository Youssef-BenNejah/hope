import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  FileText,
  FolderClosed,
  IdCard,
  Lock,
  Mail,
  Pill,
  Receipt,
  Send,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Syringe,
  Users,
  UsersRound,
  Check,
  DoorOpen,
} from "lucide-react";
import { useCabinet } from "@/lib/cabinet/store";
import type { SessionRole } from "@/lib/cabinet/context";
import logo from "@/assets/logo.png";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Sun;
  roles?: SessionRole[]; // absent = médecin + secrétaire
};

const items: NavItem[] = [
  { to: "/", label: "Aujourd'hui", icon: Sun },
  { to: "/rappels", label: "Rappels", icon: Bell },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/tracker", label: "Salle d'attente", icon: DoorOpen },
  { to: "/ordonnances", label: "Ordonnances", icon: Pill, roles: ["medecin"] },
  { to: "/certificats", label: "Certificats", icon: FileText, roles: ["medecin"] },
  { to: "/orientations", label: "Orientations", icon: Send, roles: ["medecin"] },
  { to: "/vaccinations", label: "Vaccinations", icon: Syringe, roles: ["medecin"] },
  { to: "/documents", label: "Documents", icon: FolderClosed },
  { to: "/comptabilite", label: "Comptabilité", icon: Receipt, roles: ["medecin"] },
  { to: "/annuaire", label: "Annuaire", icon: UsersRound },
  { to: "/messages", label: "Messages", icon: Mail },
  { to: "/personnel", label: "Personnel", icon: IdCard, roles: ["medecin"] },
  { to: "/parametres", label: "Paramètres", icon: SettingsIcon, roles: ["medecin"] },
];

export function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { data, lock, offline, setOffline, pending, syncing, justSynced, isAdmin, currentUser, role } =
    useCabinet();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const unread = data.messages.filter(
    (m) => !m.read && (!m.toId || m.toId === currentUser?.id) && m.fromId !== currentUser?.id,
  ).length;

  const visible = items.filter((it) => !it.roles || it.roles.includes(role));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-[#03045E]/60 backdrop-blur-[2px] md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:w-[76px] md:translate-x-0 xl:w-60 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <img
            src={logo}
            alt="Cabinet"
            className="h-10 w-10 shrink-0 rounded-xl bg-frost object-contain p-1.5"
          />
          <div className="min-w-0 md:hidden xl:block">
            <p className="truncate font-semibold">Cabinet</p>
            <p className="truncate text-xs text-frost/80">
              {currentUser ? currentUser.name : data.settings.doctorName}
              {role === "secretaire" ? " · secrétariat" : ""}
            </p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {isAdmin ? (
            <Link
              to="/admin"
              title="Administration"
              onClick={onClose}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname === "/admin" ? "bg-teal text-white" : "text-sidebar-foreground/80 hover:bg-white/10"
              }`}
            >
              {pathname === "/admin" && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-surf" />}
              <Shield className="h-5 w-5 shrink-0" />
              <span className="md:hidden xl:inline">Administration</span>
            </Link>
          ) : (
            visible.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  title={label}
                  onClick={onClose}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? "bg-teal text-white" : "text-sidebar-foreground/80 hover:bg-white/10"
                  }`}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-surf" />}
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-frost" : ""}`} />
                  <span className="md:hidden xl:inline">{label}</span>
                  {to === "/messages" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-surf px-1.5 text-[11px] font-semibold text-twilight md:hidden xl:inline">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </nav>

        <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                offline ? "bg-[#C88A1A] animate-softpulse" : "bg-[#1B9C6E]"
              }`}
            />
            <span className="md:hidden xl:inline">
              {syncing
                ? "Synchronisation en cours…"
                : offline
                  ? `Mode hors connexion — ${pending} modification${pending > 1 ? "s" : ""} en attente`
                  : "Toutes les données sont sauvegardées"}
            </span>
          </div>
          {syncing && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15 md:hidden xl:block">
              <div className="h-full w-1/3 animate-[softpulse_1s_ease-in-out_infinite] rounded-full bg-surf" />
            </div>
          )}
          {justSynced && (
            <p className="mt-2 flex items-center gap-1 text-[#90E0EF] md:hidden xl:flex">
              <Check className="h-3.5 w-3.5" /> Synchronisé
            </p>
          )}
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-2 md:hidden xl:flex">
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
          <span className="md:hidden xl:inline">Verrouiller</span>
        </button>
      </aside>
    </>
  );
}
