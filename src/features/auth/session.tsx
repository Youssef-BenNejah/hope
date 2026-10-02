import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setSessionExpiredHandler, type User } from "@/lib/api";

type State =
  | { status: "loading" }
  | { status: "anonymous"; notice?: string }
  | { status: "authenticated"; user: User };

interface SessionValue {
  state: State;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession doit être utilisé dans SessionProvider");
  return ctx;
}

/** This app is the administration console: any non-ADMIN account is signed straight back out. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setSessionExpiredHandler(() => {
      queryClient.clear();
      setState({ status: "anonymous", notice: "Session expirée, reconnectez-vous." });
    });
    api.auth
      .restore()
      .then((user) => {
        if (cancelled) return;
        if (user?.role === "ADMIN") setState({ status: "authenticated", user });
        else setState({ status: "anonymous" });
      })
      .catch(() => !cancelled && setState({ status: "anonymous" }));
    return () => {
      cancelled = true;
      setSessionExpiredHandler(null);
    };
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const user = await api.auth.login(email, password);
    if (user.role !== "ADMIN") {
      await api.auth.logout().catch(() => undefined);
      throw new ApiError(403, "Accès réservé à l'administrateur");
    }
    setState({ status: "authenticated", user });
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => undefined);
    queryClient.clear();
    setState({ status: "anonymous" });
  }, [queryClient]);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
