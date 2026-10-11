import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

/* Subpath deploys pass the folder name (VITE_BASE=vellum); empty or unset = root. */
const base = (() => {
  const raw = (process.env.VITE_BASE ?? "").replace(/^\/+|\/+$/g, "");
  return raw ? `/${raw}/` : "/";
})();

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.svg", "icons/*.png"],
      manifest: {
        id: base,
        name: "Vellum — Notes & Flashcards",
        short_name: "Vellum",
        description:
          "An offline-first study workspace: distraction-free Markdown reading and 3D spaced-repetition flashcards.",
        lang: "en",
        dir: "ltr",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "any",
        background_color: "#050507",
        theme_color: "#050507",
        categories: ["education", "productivity"],
        icons: [
          { src: `${base}icons/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: `${base}icons/pwa-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: `${base}icons/pwa-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: `${base}icons/maskable-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${base}icons/`)],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin }) => sameOrigin,
            handler: "CacheFirst",
            options: {
              cacheName: "vellum-assets",
              expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/](marked|dompurify|highlight\.js)[\\/]/.test(id)) return "markdown";
          return "vendor";
        },
      },
    },
  },
});
