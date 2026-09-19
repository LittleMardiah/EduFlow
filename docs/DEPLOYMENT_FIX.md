# DEPLOYMENT FIX — Rename Vercel Project & Matikan SSO

> Dokumen panduan MANUAL (langkah dilakukan di Vercel Dashboard, bukan CLI).
> Vercel tidak support rename project via CLI — semua dilakukan lewat dashboard.

## Konteks

- Repo ini sudah jadi Turborepo monorepo. Frontend baru = **Next.js** di `apps/web`.
- Frontend lama = **Vite** (project Vercel lama bernama `eduflow`, masih memegang
  domain `eduflow.vercel.app`).
- Project Vercel baru (Next.js) terlink dengan nama sementara `eduflow-aulia9`.
- Tujuan: `eduflow.vercel.app` harus menunjuk ke aplikasi **Next.js**.

## Info project terlink (di repo ini)

Defined di `.vercel/project.json` (jangan di-commit, sudah masuk `.gitignore`):

- `projectName`: `eduflow`
- `projectId`: `prj_ktaN7FJApY71X4UnqBCgORMQF78y`
- `orgId`: `team_3TjW7EbxUFMkW0rs5XUxzQbV`

> Note: karena project ini akan di-rename, ulangi `pnpm vercel link` setelah
> rename selesai agar `.vercel/project.json` menunjuk ke project yang benar.

## LANGKAH 1 — Matikan SSO di Vercel Dashboard

Kalau pas login (CLI atau dashboard) diminta SSO/masuk sebagai anggota team:

1. Buka https://vercel.com/teams → pilih team dengan `orgId`
   `team_3TjW7EbxUFMkW0rs5XUxzQbV`.
2. Masuk ke **Settings** (sidebar kiri) → **Authentication**.
3. Scroll ke bagian **SAML SSO / Directory Sync**.
4. Klik **Disable / Remove SSO** bila sedang aktif.
5. Pastikan juga bagian **Deployment Protection** di project tidak memblokir
   akses publik:
   - Settings project → **Deployment Protection** → pilih **Disable protection**
     atau pastikan mode **Vercel Authentication** tidak diwajibkan.
6. Login ulang ke CLI: `pnpm vercel login` sampai sukses tanpa lolos SSO.

## LANGKAH 2 — Rename project lama (`eduflow` → `eduflow-vite-old`)

1. Buka https://vercel.com/teams/team_3TjW7EbxUFMkW0rs5XUxzQbV/projects
2. Klik project **eduflow** (yang Vite lama).
3. Masuk **Settings** → **General** → bagian **Project Name**.
4. Ubah nama menjadi: `eduflow-vite-old`
5. **Save**.
6. Sekarang domain `eduflow.vercel.app` lepas dari project ini dan jadi
   tersedia (available) untuk di-claim.

> Pastikan tunggu beberapa menit sampai pemindahan domain diproses Vercel.

## LANGKAH 3 — Rename project baru (`eduflow-aulia9` → `eduflow`)

1. Buka https://vercel.com/teams/team_3TjW7EbxUFMkW0rs5XUxzQbV/projects
2. Klik project **eduflow-aulia9** (yang Next.js dari `apps/web`).
3. Masuk **Settings** → **General** → bagian **Project Name**.
4. Ubah nama menjadi: `eduflow`
5. **Save**.
6. Vercel otomatis meng-claim domain `eduflow.vercel.app` ke project ini
   (karena domain sudah tersedia setelah Langkah 2).
7. Jika diminta, pilih **"Use this domain"** / assign `eduflow.vercel.app`.

## LANGKAH 4 — Verify `eduflow.vercel.app` nunjuk ke Next.js

1. Buka https://eduflow.vercel.app
2. Cek halaman **sumber / page source** (klik kanan → View Page Source):
   - Berisi tag `<link rel="canonical" href="https://eduflow.vercel.app/">`
   - Memuat file `/..next/...` (asli Next.js), BUKAN `/assets/index-*.js` (Vite).
3. Cek response header: **`x-powered-by: Next.js`** (via DevTools → Network,
   atau `curl -sI https://eduflow.vercel.app`).
4. Coba navigasi:
   - `/auth/login` → form login tampil.
   - `/quizzes` → redirect dari `/` berfungsi.
   - Login sebagai student → sampai ke `/dashboard/student`.
5. Optional — pastikan deployment terbaru terverifikasi:
   https://vercel.com/teams/team_3TjW7EbxUFMkW0rs5XUxzQbV/projects/eduflow/deployments

## Penyelesaian (opsional)

Setelah semuanya hijau, relink CLI ke project baru agar otomatisasi
(CI/preview) menunjuk ke project `eduflow` (Next.js):

```bash
pnpm vercel link --yes --project eduflow --scope team_3TjW7EbxUFMkW0rs5XUxzQbV
```

Lalu pastikan `.vercel/project.json` menunjuk ke projectId yang baru.

## Rollback

- Kalau `eduflow.vercel.app` belum/kena halangan, cukup rename balik:
  `eduflow` → `eduflow-aulia9` dan `eduflow-vite-old` → `eduflow`
  (urutan terbalik dari Langkah 2–3, domain otomatis balik ke yang lama).