# NEXT.JS MIGRATION PLAN — EDUFLOW

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*Rencana Migrasi: Express + Vite/React (2 aplikasi terpisah) → Next.js App Router + Modulith Monorepo (Turborepo)*

---

## 📌 METADATA DOKUMEN

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Type** | Migration Plan |
| **Document Version** | v1.0 |
| **Created Date** | 2026-09-02 |
| **Author** | M. Arif Aulia |
| **Status** | ✅ PLAN READY (Menunggu Eksekusi) |
| **Duration** | 2-3 Minggu (Solo Developer ~80-120 jam) |
| **Scope** | Migrasi arsitektur, kode backend `backend/`, frontend `frontend/`, CI/CD, dan 21 dokumen `docs/` |
| **Sumber** | Hasil scan CEK > VALIDASI > EKSEKUSI terhadap seluruh ROADMAP & dokumen perencanaan EduFlow |

---

## 1. HASIL SCAN (CEK) & VALIDASI

### 1.1 Struktur Aplikasi Saat Ini

| Komponen | Teknologi | Lokasi |
|----------|-----------|--------|
| **Frontend** | React 18 + Vite + Tailwind + Zustand + React Query | `frontend/` |
| **Backend** | Node.js + Express 4.21.2 + Prisma + Zod + Winston | `backend/` (dan duplikat tua di root `package.json`) |
| **Database** | PostgreSQL (Supabase) + Prisma ORM + RLS | `backend/prisma/` |
| **Deployment** | Vercel (frontend) + Railway/Render (backend) | `.github/workflows/` |
| **CI/CD** | GitHub Actions (file kosong/0 baris di root) | `.github/workflows/ci.yml`, `deploy.yml` |

### 1.2 Hitung Referensi Istilah di Dokumen (docs/)

| Istilah (harus diubah) | Jumlah Match | Jumlah File |
|------------------------|-------------|-------------|
| `Express` / Node.js backend | ~64 | 17 file |
| `Vite` / Vitest | ~58 | 14 file |
| `React` / React 18 | ~20 | 11 file |
| `Railway` / `Render` | ~92 (termasuk false-positive "Renderer") | ~15 file |
| `Vercel` (split-frontend) | ~91 | 15 file |
| `Monolith` / `Modulith` | 0 di `docs/` (hanya di `docs 1.0/` — konsep Modulith sudah pernah ada) | - |

**Kesimpulan Validasi:** Seluruh roadmap (FASE 1-5), PRD, TDD, API_CONTRACT, DATABASE_SCHEMA, BLUEPRINT, STP, DRP, SECURITY_SPEC, LOGIC_FLOW, LOGBOOK, TECHNICAL_DEBT, dan dokumen PLAN menetapkan arsitektur **2 aplikasi terpisah (split)** dengan stack `React + Vite` dan `Express + Railway`. Tidak ada satu pun yang menggunakan arsitektur terpadu. → Perlu migrasi ke **Next.js + Modulith monorepo**.

> Catatan penting: `TDD.md` baris 138 secara eksplisit menolak Next.js ("Alternative rejected: Next.js - added SSR complexity for MVP; Vercel deployment only"). Bagian ini WAJIB dibalik di dokumen baru. Sebaliknya, `PLAN/TDD PLAN.md` baris 1279 & 2485 sudah menyebut "Vercel Next.js" dan `docs 1.0/` sudah memakai konsep Modulith → dasar valid untuk migrasi.

---

## 2. ALASAN MIGRASI

1. **Satu Deployment, Satu Origin** — Dengan Next.js API Routes, frontend & backend hidup di satu Vercel project. CORS, proxy dev (`localhost:3000` ↔ `localhost:3001`), dan 2 kredensial domain hilang total.
2. **Stack Lebih Modern & Portofolio Kompetitif** — Next.js App Router = standar industri React saat ini + SSR/ISR untuk SEO landing page, menggantikan Vite SPA.
3. **Menghapus Beban DevOps Solo** — Tidak perlu mengelola Railway/Render + Vercel + 2 CI/CD. Semua lewat Vercel all-in-one (deploy otomatis, preview per-PR, TLS, CDN edge).
4. **Modulith Monorepo (Turborepo)** — Kode terorganisir per-modul (auth, quiz, grading, event, analytics) dalam 1 repo + 1 pipeline. Ini adalah pola yang sudah ditebarkan di `docs 1.0/` (modular monolith) dan cocok untuk solo developer + portofolio.
5. **Nonaktifkan Technical Debt Infra** — `TD-EDU-INFRA-001` (CI/CD belum aktif) dan `TD-EDU-INFRA-002` (rate limiting) langsung bisa disentuh bersamaan saat migrasi.
6. **Prisma & Repository Layer Tetap** — Service/repository layer di `backend/src/` TIDAK berubah. Hanya layer HTTP (controllers/routes → route handlers) yang dikonversi. Risiko rendah.

---

## 3. ARSITEKTUR BARU (TARGET)

```
eduflow/                         (Turborepo Monorepo — Modulith)
├── apps/
│   └── web/                     (Next.js 15 App Router — SEMUA di sini)
│       ├── app/
│       │   ├── api/             ← DATA LAYER (menggantikan Express routes)
│       │   │   ├── auth/        POST /api/v1/auth/{register,login,verify,logout}
│       │   │   ├── quizzes/     CRUD + publish + archive + versions
│       │   │   ├── questions/   CRUD + reorder
│       │   │   ├── options/     CRUD
│       │   │   ├── submissions/ create, autosave, submit, results
│       │   │   ├── events/      CRUD + participants
│       │   │   ├── analytics/   student + instructor + question
│       │   │   ├── notifications/
│       │   │   ├── users/       profile + admin list
│       │   │   └── health/      GET /api/health
│       │   ├── (pages)          Landing, auth, dashboard, quiz, event, analytics
│       │   └── layout.tsx
│       ├── components/          (dipindah dari frontend/src/components + dashboard/)
│       ├── hooks/               useAuth, useQuiz, useAutoSave, useQuizTimer
│       ├── stores/              authStore, quizStore, uiStore (Zustand)
│       ├── services/            ← DGARDE: pindah dari backend/src/services (MURNI, tanpa Express)
│       ├── repositories/        ← pindah dari backend/src/repositories
│       ├── schemas/             ← pindah dari backend/src/schemas (Zod)
│       ├── middleware/          auth (JWT), rbac, ownership, audit → Next.js Middleware / per-route
│       ├── lib/                 prisma.ts, env.ts, jwt.ts, password.ts, logger.ts
│       ├── prisma/              schema.prisma + migrations (dipindah dari backend/prisma)
│       ├── next.config.ts
│       └── package.json
├── packages/
│   ├── db/                      (Prisma schema + client, optional jika tidak multi-app)
│   ├── config/
│   └── ui/                      (shared components, optional)
├── turbo.json
├── pnpm-workspace.yaml
└── .github/workflows/
    ├── ci.yml                   lint + test + build semua apps/packages
    └── deploy.yml               Deploy ke Vercel (all-in-one) + prisma migrate
```

**Pemetaan Istilah:**

| Lama | Baru |
|------|------|
| React / Vite / React Router | Next.js App Router (React tetap sebagai library UI) |
| Express controllers + routes | Next.js Route Handlers (`app/api/**/route.ts`) |
| Node.js backend (Railway/Render) | Next.js API Routes di Vercel (all-in-one) |
| Vercel (frontend) + Railway (backend) | Vercel only (frontend + API + edge) |
| Vitest (frontend) | Vitest (tetap, didukung Next.js) |
| axios + API base URL `localhost:3001` | Fetch API internal / `server-only` client (SSR) |
| Split aplikasi | Modulith monorepo (Turborepo + pnpm workspace) |

---

## 4. LANGKAH-LANGKAH MIGRASI

### MINGGU 1 — Fondasi Monorepo & Layer HTTP (Hari 1-5)

- [ ] **D1:** Inisialisasi Turborepo + pnpm workspace (`pnpm-workspace.yaml`, `turbo.json`).
- [ ] **D1:** Buat `apps/web` dengan `create-next-app` (TypeScript, App Router, Tailwind, ESLint).
- [ ] **D2:** Pindahkan `backend/prisma/*` → `apps/web/prisma/`; jalankan `prisma generate` & `prisma migrate deploy` (DB Supabase TIDAK berubah — skema & RLS sama).
- [ ] **D2:** Pindahkan service/repository/schema layer (`backend/src/services`, `repositories`, `schemas`, `utils/jwt.ts`, `utils/password.ts`, `utils/logger.ts`, `utils/prisma.ts`) MURNI tanpa modifikasi logic.
- [ ] **D3:** Konversi middleware Express (auth, rbac, ownership, validation) → helper + `lib/withAuth.ts` di route handler.
- [ ] **D3-4:** Buat route handler per modul di `app/api/**/route.ts` dengan mount path `/api/v1/...` (kompatibel dengan API_CONTRACT).
  - `GET/POST /api/v1/auth/*`, `/api/v1/quizzes`, `/api/v1/questions`, `/api/v1/options`, `/api/v1/submissions`, `/api/v1/events`, `/api/v1/analytics/*`, `/api/v1/users`, `/api/health`.
- [ ] **D5:** Handler error terpusat (try/catch wrapper + JSON error response) menggantikan `error.middleware.ts`.
- [ ] **D5:** Verifikasi dengan smoke test: register → login → buat quiz → submit → grading (curl).

**Deliverable M1:** Seluruh endpoint (100+) berjalan sebagai Next.js API Routes di `localhost`. Backend Express lama masih ada (fallback), belum dihapus.

### MINGGU 2 — Frontend Next.js & Penggabungan (Hari 6-11)

- [ ] **D6-7:** Pindahkan halaman & komponen dari `frontend/src/*`:
  - `components/` (common, dashboard/, quiz/) → `apps/web/components/`
  - `pages/` → `apps/web/app/` (mapping routing Vite → App Router: `/`, `/login`, `/register`, `/dashboard`, `/instructor/dashboard`, `/admin/dashboard`, `/quizzes`, `/quiz/:id`, `/events`, `/analytics/*`)
  - `hooks/`, `stores/`, `types/`, `api/` → sesuai struktur target.
- [ ] **D8:** Ganti `src/api/client.ts` (axios, baseURL `localhost:3001`, proxy) → server fetch (SSR) + client fetch ke origin path `/api/v1`. Hapus `vite.config.ts` proxy.
- [ ] **D8-9:** Porting auth flow: JWT tetap via HTTP-only cookie (set dari route handler `response.cookies.set`). Sesuaikan `useAuth` + `authStore`.
- [ ] **D9:** Halaman dashboard/analytics/event yang memakai Recharts, Zustand, React Query — verifikasi kompatibilitas (React 18 → 19/18 Next), perbaiki error TS.
- [ ] **D10:** **Beta kejujuran arsitektur:** semua fetch frontend memakai `GET /api/...` GRATIS tanpa CORS (same origin). Hapus konfigurasi CORS & `ALLOWED_ORIGINS`.
- [ ] **D10-11:** Testing: konversi Jest backend test → tetap jalan (lib murni). Konversi Vitest frontend test. Tambah test untuk route handlers (Supertest terhadap `app/api` via Next.js server).
- [ ] **D11:** Nonaktifkan & hapus `backend/` + root `package.json` (Express) SETELAH smoke test penuh hijau.

**Deliverable M2:** Satu aplikasi Next.js utuh di `apps/web` — stack & fitur F001-F012 tidak berkurang.

### MINGGU 3 — CI/CD, Deploy Vercel & Dokumentasi (Hari 12-16)

- [ ] **D12:** Tulis ulang `.github/workflows/ci.yml` (turbo lint + test + build, Prisma generate) & `deploy.yml` (Vercel all-in-one + `prisma migrate deploy` di post-build). Hapus langkah deploy Railway/Render.
- [ ] **D13:** Setup Vercel project (1 app saja): env vars (`DATABASE_URL` pooled + direct, `JWT_SECRET`, `NODE_ENV`). Hapus `RAILWAY_*`, `ALLOWED_ORIGINS`.
- [ ] **D13:** Perhatikan batasan serverless: `maxDuration` untuk route grading (target <500ms tetap terpenuhi, grading sinkron), bodies CSV peserta (parser stream/buffer terbatas).
- [ ] **D14:** Rate limiting (`@upstash/ratelimit` atau Vercel WAF) & Sentry Next.js SDK — sekaligus menutup `TD-EDU-INFRA-002` dan item monitoring FASE 5.
- [ ] **D14-15:** Update seluruh dokumen `docs/` (lihat Daftar Dokumen) sesuai tabel pemetaan istilah.
- [ ] **D15-16:** QA akhir: `pnpm lint`, `pnpm test`, `pnpm build`, Lighthouse, /api/health 200, demo live di Vercel. Update README + LOGBOOK.

**Deliverable M3:** EduFlow live di Vercel all-in-one, CI/CD hijau, dokumen 100% sinkron, Express/Vite dihapus.

---

## 5. TIMELINE (2-3 MINGGU)

| Fase | Minggu | Hari | Jam (solo) | Fokus |
|------|--------|------|-----------|-------|
| **M1 Fondasi** | Minggu 1 | 1-5 | ~35 jam | Monorepo, prisma, konversi routes, smoke test |
| **M2 Penggabungan** | Minggu 2 | 6-11 | ~40 jam | Porting frontend, auth cookie, testing, hapus Express |
| **M3 Go-Live** | Minggu 3 | 12-16 | ~30 jam | CI/CD Vercel, rate-limit/Sentry, update dokumen, QA |
| **Buffer** | - | - | ~15 jam | Risiko tak terduga (testing, serverless timeout) |
| **TOTAL** | **3 minggu** | **16 hari** | **~120 jam** | ✅ Realistis untuk solo developer |

---

## 6. DAFTAR FILE KODE YANG DIUBAH

| # | File / Direktori | Aksi | Keterangan |
|---|------------------|------|------------|
| 1 | `backend/src/routes/*` (11 file) | 🗑️ dihapus / ♻️ dikonversi | Menjadi `app/api/**/route.ts` |
| 2 | `backend/src/controllers/*` (8 file) | 🗑️ dihapus / ♻️ dikonversi | Logic dipindah ke route handler |
| 3 | `backend/src/middleware/*` (5 file) | ♻️ dikonversi | Auth/rbac/ownership → helper route Next.js |
| 4 | `backend/src/services/*` (13 file) | 📦 dipindah | MURNI, tanpa Express |
| 5 | `backend/src/repositories/*` (10 file) | 📦 dipindah | MURNI |
| 6 | `backend/src/schemas/*` (7 file) | 📦 dipindah | Zod tetap |
| 7 | `backend/src/utils/*` (jwt, password, logger, prisma, types) | 📦 dipindah | env dari `config/env.ts` → `lib/env.ts` |
| 8 | `backend/prisma/` | 📦 dipindah | ke `apps/web/prisma/` (migrasi & skema JANGAN diubah) |
| 9 | `backend/package.json`, `tsconfig.json`, `jest.config.js`, `.eslintrc.json` | 🗑️ dihapus | Digantikan konfigurasi apps/web |
| 10 | `backend/docker-compose.yml` | 🗑️/🔇 nonaktifkan | Optional dev-only |
| 11 | `frontend/` seluruh `src/` | 📦 dipindah | ke `apps/web/` |
| 12 | `frontend/vite.config.ts`, `index.html`, `public/vite.svg` | 🗑️ dihapus | Digantikan `next.config.ts` |
| 13 | `frontend/src/api/client.ts` | ♻️ ditulis ulang | axios baseURL → same-origin `/api/v1` |
| 14 | Root `package.json` (duplikat Express tua) | 🗑️ dihapus | Menjadi workspace root |
| 15 | Root `docker-compose.yml` (0 byte) | 🗑️ dihapus | - |
| 16 | `.github/workflows/ci.yml` | ♻️ ditulis ulang | Turbo pipeline |
| 17 | `.github/workflows/deploy.yml` | ♻️ ditulis ulang | Vercel all-in-one |
| 18 | `backend/.github/workflows/*` (0 byte) | 🗑️ dihapus | 1 pipeline di root saja |
| 19 | New: `turbo.json`, `pnpm-workspace.yaml`, `apps/web/next.config.ts`, `apps/web/middleware.ts` | ✨ dibuat | Fondasi monorepo |
| 20 | `.env.example` | ♻️ update | Hapus `ALLOWED_ORIGINS`/Railway, tambah pooled `DATABASE_URL` |

> ⚠️ `prisma/schema.prisma`, migrations, RLS, dan seluruh Business Logic (services/repositories) **tidak berubah** — ini kunci risiko rendah.

---

## 7. DAFTAR DOKUMEN YANG PERLU DIUPDATE (21 FILE)

| # | Dokumen | Jenis Perubahan |
|---|---------|-----------------|
| 1 | `PRD.md` | Tech Stack (baris 46, 96, 1372-1377), Deployment (1359, 1387-1388, 1418, 1437, 1505, 1585) → Next.js + Vercel all-in-one |
| 2 | `TDD.md` | Stack (113-119, 125-133), **BAIKAN penolakan Next.js (baris 138)**, arsitektur (211-235), Vite→Next (346-448), deployment (182-200, 2170-2175, 2408, 2437) |
| 3 | `API CONTRACT.md` | Base URL dev/prod (23, 52-53), implementasi (2499, 2519) → `/api/v1` same-origin |
| 4 | `BLUEPRINT ROADMAP.md` | Stack (113, 141-142, 157, 844), deploy (274, 285, 857-902, 943), checklist (1043, 1054-1065, 1197-1201) |
| 5 | `ROADMAP FASE 1.md` | Express scaffold (36, 492, 496,...), deploy Railway (1106-1107, 1187, 1211, 1255, 1419, 1471, 1530, 1574, 1593) |
| 6 | `ROADMAP FASE 2.md` | Routes Express (476), React/Vite (649, 735-736, 779), Vercel (784, 826) |
| 7 | `ROADMAP FASE 3.md` | Routes di Express (573), framework (1481) |
| 8 | `ROADMAP FASE 5.md` | React 18+Vite (35, 132, dst), Vite config (261-303, 357), deploy Vercel+Railway (66-98, 113-114, 1920-2000, 2125-2189, 2371-2372, 2459-2460, 2561-2569) |
| 9 | `DATABASE SCHEMA.md` | Hanya ORM note (22) — schema & RLS TIDAK berubah (minor) |
| 10 | `LOGIC FLOW.md` | Diagram backend (61, 69, 106) → Next.js API layer |
| 11 | `SECURITY SPEC.md` | Express decorator (839), Railway/Render secrets (1500, 1614-1615, 1689-1694) |
| 12 | `STP.md` | Vitest frontend (71, 131, 181-182), React staging (2486) |
| 13 | `DRP.md` | Matriks infra (46-47, 62), recovery Railway/Vercel (253, 273-308, 435-663), runbook (1650-1691) |
| 14 | `LAPORAN VALIDASI ROADMAP.md` | Validasi stack (216, 542-558, 609, 668-675, 816, 830-836, 1038) |
| 15 | `TECHNICAL DEBT.txt` | Proyek (6), Express downgrade (126-138, 572, 904), infra Railway (342-351), React/Vite frontend (451-461, 892, 942) + tambah item migrasi |
| 16 | `LOGBOOK.txt` | Baris sejarah (16-174) dapat ditulis ulang ke dalam konteks Next.js; tambahkan entri migrasi terbaru |
| 17 | `EDUFLOW PROBLEM.txt` | Tech stack (12) |
| 18 | `FASE4_FINAL_LOG.txt` | Stack (16-18), deploy (441, 477-478, 518) |
| 19 | `PLAN/TDD PLAN.md` | Sudah sebagian Next.js (67, 1279, 2485) → samakan terminologi, hapus Render/Railway (97, 1759, 2387, 2468-2565, 2712) |
| 20 | `PLAN/DevOps PLAN.txt` | Ditulis ulang → Vercel all-in-one + single DB + Sentry (buang VPS/Go/Neon lama) |
| 21 | `PLAN/PORTFOLIO_PROJECT_RECOMMENDATIONS.md` | Stack & deploy (150-152, 192, 248-250, 487, 966-970) |

**Tambahan (di luar docs/):** `README.md` root + `.env.example` (lihat poin 20 tabel file).

> ROADMAP FASE 4.md tidak memuat istilah stack (0 match) → hanya validasi minor bila ada orkestrasi yang berubah.

---

## 8. RISK ASSESSMENT

| # | Risiko | Level | Mitigasi |
|---|--------|-------|----------|
| 1 | **Serverless timeout** (grading 100 soal, auto-save, CSV peserta) | 🟡 Sedang | Grade tetap sinkron (<500ms terukur), set `export const maxDuration = 60` di route berat; gunakan buffer terbatas untuk CSV; naikkan ke Vercel Pro bila perlu |
| 2 | **Prisma di serverless** (koneksi & cold start) | 🟡 Sedang | Gunakan `DATABASE_URL` pooled (pgBouncer/Supabase pooler) + `directUrl` unpooled; Prisma singleton di `lib/prisma.ts` (best practice `globalThis`) |
| 3 | **HTTP-only cookie JWT lintas origin** (dulu CORS/Authorization header) | 🟡 Sedang | Set cookie dari route handler; `secure: true` di prod, `sameSite: lax`; sesuaikan `useAuth`/`authStore` + test token |
| 4 | **Perbedaan runtime React Router vs App Router** (layout, guards) | 🟠 Tinggi (sementara) | `ProtectedRoute` → Next.js Layout + `middleware.ts` + peran klien; tags pasang paling lambat Hari 8-9, jangan tinggalkan workaround |
| 5 | **Regression 100+ endpoint & >85% coverage** | 🟡 Sedang | Test suite dipindah bertahap (lib dulu, lalu route handler); jalankan `pnpm turbo test` tiap hari; Express lama dibuang hanya saat smoke test penuh hijau |
| 6 | **Konflik `docs 1.0/` (folder lama)** | 🟢 Rendah | Dibiarkan sebagai arsip; migrasi hanya menyentuh `docs/` aktif |
| 7 | **Duplikat root `package.json` (Express tua)** | 🟢 Rendah | Hapus di M2 setelah verifikasi; hindari konflik dependency saat memakai pnpm workspace |
| 8 | **CI/CD belum pernah aktif (file 0 byte)** | 🟡 Sedang | Tulis ulang dari nol (bukan edit); verifikasi di M3 dengan PR test |
| 9 | **Rate limiting baru (TD-EDU-INFRA-002)** | 🟢 Rendah | Namun pertimbangkan biaya Upstash free-tier; fallback sederhana (IP dasar) sudah cukup MVP |
| 10 | **Cocok untuk portofolio** (penolakan Next.js lama dibalik) | 🟢 Rendah | Titik bicara baru: "All-in-one Next.js monorepo" = modern & hemat biaya |

---

## 9. DEFINITION OF DONE

- [ ] `backend/` & `frontend/` terhapus; semua kode di `apps/web/` (monorepo Turborepo + pnpm).
- [ ] 100+ endpoint tetap memenuhi API_CONTRACT `/api/v1/*` dan test coverage >85% (services) & >75% (components).
- [ ] Demo live tunggal di **Vercel** (frontend + API + health check 200); Railway/Render DIPAKAI LAGI.
- [ ] CI/CD GitHub Actions hijau (lint → test → build → deploy Vercel → prisma migrate).
- [ ] 21 dokumen `docs/` + README disinkronkan (Express/React/Vite/Railway → Next.js API Routes/Modulith/Vercel all-in-one).
- [ ] `TDD.md` penolakan Next.js dibalik; `LOGBOOK.txt` punya entri migrasi.

---

*NEXTJS_MIGRATION_PLAN.md v1.0 | EduFlow Portfolio Project | Dibuat 2026-09-02*

*Status: ✅ PLAN READY — Menunggu persetujuan & eksekusi 3 minggu.*