import { Link } from "@tanstack/react-router";
import { Building2, LayoutDashboard, LogOut, ScrollText } from "lucide-react";
import { useSession } from "@/features/auth/session";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/cabinets", label: "Cabinets", icon: Building2 },
  { to: "/journal", label: "Journal", icon: ScrollText },
] as const;

export function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { logout } = useSession();

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
          <img src={logo} alt="Hope" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl bg-frost object-contain p-1.5" />
          <div className="min-w-0 md:hidden xl:block">
            <p className="truncate font-semibold">Hope</p>
            <p className="truncate text-xs text-frost/80">Administration</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={label}
              onClick={onClose}
              className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-white/10"
              activeProps={{ className: "!bg-teal !text-white" }}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-surf" />}
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="md:hidden xl:inline">{label}</span>
                </>
              )}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => void logout()}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm transition-colors hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="md:hidden xl:inline">Se déconnecter</span>
        </button>
      </aside>
    </>
  );
}
