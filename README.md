# Vellum — Notes & Flashcards

An offline-first study workspace that looks as good as it works: a distraction-free Markdown reader and a 3D spaced-repetition flashcard engine, wrapped in a glassmorphic dark UI. Everything lives on your device — no account, no server, no internet required after the first load.

<p align="center">
  <img src="public/icons/icon.svg" width="96" alt="Vellum logo" />
</p>

## Features

- **Distraction-free Markdown reader** — Notion-style typography, linked outline, reading progress, and syntax-highlighted code blocks (via `marked` + `highlight.js`).
- **Cinematic 3D flashcards** — a spring-physics `rotateY` flip with pointer-parallax tilt and a moving specular glare (Framer Motion).
- **Active-recall SRS engine** — rate **Hard / Good / Easy** and cards return exactly when you're about to forget them. Intervals grow with an adaptive ease factor; lapses reset the streak.
- **Smart sessions** — due cards interleave with new ones (2 : 1), daily new-card limits, per-session caps, and Hard cards re-queue within the same session.
- **Truly offline PWA** — installable, precached with `vite-plugin-pwa` (Workbox), storage in IndexedDB via localForage.
- **Your data stays yours** — imports, notes, and scheduling history never leave the device.

## Quick start

```bash
npm install
npm run dev          # local dev server
npm test             # SRS + CSV parser unit tests (vitest)
npm run build        # production build with service worker
npm run preview      # serve the production build
npm run icons        # regenerate PWA icons from public/icons/*.svg
```

## Deploying to GitHub Pages

The build is subpath-aware. Pass the target folder name (no slashes — Windows/Git Bash safe):

```bash
VITE_BASE=vellum npm run build
```

This rewrites the Vite `base`, the manifest `start_url` / `scope` / icons, and the service-worker fallback to `/vellum/…`. Push the result to the `gh-pages` branch and enable **Settings → Pages → Deploy from a branch**.

## Install on your phone

Open the deployed URL once in your mobile browser, then:

- **Android (Chrome):** menu ⋮ → *Add to Home screen* / *Install app*.
- **iPhone (Safari):** Share → *Add to Home Screen*.

It launches full-screen from its own icon and keeps working in airplane mode.

<div dir="rtl">

## على الهاتف بالعربي

افتح رابط الموقع مرة واحدة من متصفح الهاتف، ثم اختر «إضافة إلى الشاشة الرئيسية» (أندرويد: قائمة ⋮ ← تثبيت التطبيق / آيفون: زر المشاركة ← Add to Home Screen). سيعمل بعدها كتطبيق مستقل، وستُحفظ ملفاتك وبطاقاتك على الهاتف نفسه ويعمل دون إنترنت.

</div>

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS 4 · shadcn/ui · Framer Motion · localForage (IndexedDB) · marked · PapaParse · Lucide · vite-plugin-pwa
