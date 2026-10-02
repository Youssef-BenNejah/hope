export const API_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");
export const SEND_WEB_CLIENT_HEADER = import.meta.env.VITE_WEB_CLIENT_HEADER === "true";
