/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of hope-backend, e.g. http://localhost:8080/api/v1 */
  readonly VITE_API_URL?: string;
  /** "false" switches from the in-browser mock to the real backend. */
  readonly VITE_USE_MOCK?: string;
  /** "true" sends X-Client-Type: web so the refresh token is only delivered as an HttpOnly cookie. */
  readonly VITE_WEB_CLIENT_HEADER?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
