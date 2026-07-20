import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// This is the actual root cause of the "login says invalid cred, but Network tab shows 404"
// report: axiosClient.ts's baseURL defaults to the *relative* path "/api" (see its comment —
// that's intentional so the same build works behind any reverse proxy in production). In dev,
// with no proxy configured here, "/api/auth/login" was a same-origin request straight to the
// Vite dev server (e.g. http://localhost:5173/api/auth/login) — Vite has no route for that, so
// IT returns the 404, not the .NET backend. The backend was never actually reached.
//
// Fix: proxy /api/* to the Landcore.API Kestrel port from launchSettings.json
// (Properties/launchSettings.json -> applicationUrl).
//
// Target the https:// port directly, not http://. Program.cs has UseHttpsRedirection() enabled,
// so a proxied request to the http port just gets 307-redirected to https by Kestrel — and the
// browser follows that redirect itself (straight to https://localhost:62896), bypassing the Vite
// proxy entirely and hitting the untrusted ASP.NET Core Dev Certs self-signed cert directly
// (ERR_CERT_AUTHORITY_INVALID). By proxying to https:// ourselves with secure:false, the TLS
// trust problem is confined to this Node-side proxy connection (which ignores it) — the browser
// only ever talks to the Vite origin over plain http and never sees the backend's cert at all.
// If you regenerate launchSettings.json and the port changes, update the target below to match.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:62896',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
