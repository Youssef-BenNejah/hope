import { API_URL, SEND_WEB_CLIENT_HEADER } from "./config";
import type { AuthResponse } from "./types";

/** RFC 7807 problem+json as produced by hope-backend's GlobalExceptionHandler. */
export class ApiError extends Error {
  readonly status: number;
  readonly type: string | undefined;
  constructor(status: number, message: string, type?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
  }
}

// The access token lives in memory only (never localStorage): the refresh cookie restores it on reload.
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;
let refreshing: Promise<AuthResponse | null> | null = null;

export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query | undefined;
  signal?: AbortSignal | undefined;
  /** false for login/refresh: no bearer header and no 401 retry. */
  auth?: boolean;
}

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(`${API_URL}${path}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
};

async function toError(res: Response): Promise<ApiError> {
  try {
    const problem = (await res.json()) as { detail?: string; title?: string; message?: string; type?: string };
    return new ApiError(res.status, problem.detail ?? problem.message ?? problem.title ?? res.statusText, problem.type);
  } catch {
    return new ApiError(res.status, res.statusText || "Erreur réseau");
  }
}

function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (SEND_WEB_CLIENT_HEADER) headers["X-Client-Type"] = "web";
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    credentials: "include",
    signal: opts.signal ?? null,
    body: opts.body === undefined ? null : JSON.stringify(opts.body),
  });
}

/** hope-backend wraps payloads in { success, message, data }. */
async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as { data?: T } | T;
  return json && typeof json === "object" && "data" in json ? (json as { data: T }).data : (json as T);
}

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= send("/auth/refresh", { method: "POST", auth: false })
    .then(async (res) => {
      if (!res.ok) return null;
      const auth = await unwrap<AuthResponse>(res);
      accessToken = auth.accessToken;
      return auth;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await send(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    const renewed = await refreshSession();
    if (renewed) {
      res = await send(path, opts);
    } else {
      accessToken = null;
      onSessionExpired?.();
    }
  }
  if (!res.ok) throw await toError(res);
  return unwrap<T>(res);
}

/** Authenticated file download (the bearer token can't ride on a plain link). Resolves the blob and suggested filename. */
export async function download(
  path: string,
  query?: Query,
  fallbackName = "export.csv",
): Promise<{ blob: Blob; filename: string }> {
  const opts: RequestOptions = { query };
  let res = await send(path, opts);
  if (res.status === 401) {
    const renewed = await refreshSession();
    if (renewed) res = await send(path, opts);
    else onSessionExpired?.();
  }
  if (!res.ok) throw await toError(res);
  const match = /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") ?? "");
  return { blob: await res.blob(), filename: match?.[1] ?? fallbackName };
}
