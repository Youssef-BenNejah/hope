// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * In development the browser talks to /api on the dev server (same origin), which forwards to the real
 * hope-backend. That avoids the backend's CORS allow-list (it only admits its own front-end origin) and keeps
 * the SameSite=Strict refresh cookie working. Override with PROXY_TARGET=https://other-host to point elsewhere.
 */
const PROXY_TARGET = process.env["PROXY_TARGET"] ?? "https://api.hope.bramasquare.com";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api": {
          target: PROXY_TARGET,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            // The backend treats a foreign Origin as a cross-site call and answers 403; the proxy hop is server to
            // server, so the browser's Origin header is dropped.
            proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
          },
        },
      },
    },
  },
});
