import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Link, Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SessionProvider, useSession } from "@/features/auth/session";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { Sidebar } from "@/components/cabinet/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const primaryBtn =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">Cette page n'existe pas ou a été déplacée.</p>
        <div className="mt-6">
          <Link to="/" className={primaryBtn}>
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Cette page n'a pas pu se charger</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={primaryBtn}
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
      { title: "Hope — Administration" },
      { name: "description", content: "Console d'administration Hope." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap",
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
  const { state } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (state.status === "loading") return <div className="min-h-screen bg-background" aria-busy="true" />;
  if (state.status === "anonymous") return <LoginScreen notice={state.notice} />;

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
        <span className="text-sm font-medium">Administration</span>
      </header>
      <header className="sticky top-0 z-20 hidden items-center border-b border-border bg-card/80 px-6 py-2.5 backdrop-blur md:flex md:pl-[100px] xl:pl-64">
        <span className="ml-auto text-xs text-muted-foreground">{state.user.email}</span>
      </header>
      <main className="min-h-screen p-4 sm:p-6 md:ml-[76px] md:p-8 xl:ml-60">
        <Outlet />
      </main>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppFrame />
        <Toaster position="bottom-right" />
      </SessionProvider>
    </QueryClientProvider>
  );
}
