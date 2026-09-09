import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";


import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CabinetProvider, useCabinet } from "@/lib/cabinet/store";
import { Sidebar } from "@/components/cabinet/Sidebar";
import { LockScreen } from "@/components/cabinet/LockScreen";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cabinet — Gestion de cabinet médical" },
      {
        name: "description",
        content: "Prototype de gestion pour médecin exerçant seul : agenda, patients, certificats et recettes.",
      },
      { property: "og:title", content: "Cabinet — Gestion de cabinet médical" },
      {
        property: "og:description",
        content: "Agenda, dossiers patients, certificats et suivi des recettes en un seul outil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppFrame() {
  const { locked, isAdmin, data } = useCabinet();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  if (locked) return <LockScreen />;
  if (isAdmin && pathname !== "/admin") return <Navigate to="/admin" replace />;
  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-lg border border-border p-2"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Cabinet</p>
          <p className="truncate text-xs text-muted-foreground">{data.settings.doctorName}</p>
        </div>
      </header>
      <main className="min-h-screen p-4 animate-in fade-in duration-300 sm:p-6 md:ml-[76px] md:p-8 xl:ml-60">
        <Outlet />
      </main>
    </div>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CabinetProvider>
        <AppFrame />
        <Toaster position="bottom-right" />
      </CabinetProvider>
    </QueryClientProvider>
  );
}
