# Ruang Ketua

Ruang Ketua adalah dashboard untuk ketua kelas/komti mahasiswa. Aplikasi ini membantu mengelola tugas, jadwal kuliah, pengumuman, anggota kelas, WhatsApp broadcast, Google Drive multi-akun, forum, chat, AI assistant, payment, dan admin panel.

## Stack

- Next.js 16 App Router
- React 19
- Prisma 7 dengan MariaDB/MySQL
- Tailwind CSS 4
- JWT session dengan `jose`
- Baileys untuk WhatsApp gateway
- Google APIs untuk Google Drive
- Groq-compatible chat completions untuk fitur AI

## Setup Lokal

Gunakan Node.js `>=20.9.0`. Next.js 16 tidak bisa build di Node 18.

1. Install dependency:

```bash
npm install
```

2. Salin env:

```bash
copy .env.example .env
```

3. Isi minimal env berikut:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/ruangketua"
JWT_SECRET="random-secret-minimal-32-karakter"
CRON_SECRET="random-secret-untuk-cron"
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.3-70b-versatile"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DRIVE_TOKEN_SECRET="random-secret-minimal-32-karakter"
```

4. Jalankan migration dan generate Prisma client:

```bash
npm run db:dev
npm run db:generate
```

5. Buat akun admin:

```bash
$env:ADMIN_EMAIL="admin@ruangketua.id"
$env:ADMIN_PASSWORD="ganti-password-kuat"
npm run admin:create
```

6. Jalankan dev server:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Script Penting

- `npm run dev`: menjalankan Next.js development server.
- `npm run build`: generate Prisma client lalu build Next.js.
- `npm run start`: menjalankan build production.
- `npm run lint`: menjalankan ESLint.
- `npm run typecheck`: menjalankan TypeScript tanpa emit.
- `npm run check`: menjalankan lint dan typecheck.
- `npm run db:generate`: generate Prisma client.
- `npm run db:dev`: membuat dan menjalankan migration lokal.
- `npm run db:migrate`: menjalankan migration untuk environment production/CI.
- `npm run admin:create`: membuat atau menaikkan user menjadi admin. Gunakan `ADMIN_PASSWORD`.

## Environment

Lihat `.env.example` untuk daftar lengkap. Jangan commit `.env`; file ini sudah di-ignore.

Catatan penting:

- `JWT_SECRET` dan `DRIVE_TOKEN_SECRET` wajib kuat di production.
- `CRON_SECRET` wajib diisi jika memakai endpoint `/api/cron/*`.
- `ADMIN_PASSWORD` hanya dipakai saat menjalankan `npm run admin:create`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REDIRECT_URI` dibutuhkan untuk fitur Google Drive.
- `GROQ_API_KEY` dibutuhkan untuk fitur AI.

## Database

Schema utama ada di `prisma/schema.prisma`. Prisma client digenerate ke `src/generated/prisma` dan folder itu tidak perlu diedit manual.

Untuk production:

```bash
npm run db:migrate
npm run build
```

Pastikan migration selalu sinkron dengan perubahan `schema.prisma` sebelum deploy.

## Struktur Project

- `src/app`: halaman dan route handler API.
- `src/components`: komponen UI dan fitur.
- `src/lib`: helper server/client, auth, Prisma, AI, cloud, WhatsApp.
- `src/config`: konstanta aplikasi.
- `src/types`: tipe shared frontend/API.
- `prisma`: schema dan migration database.
- `public/uploads`: upload lokal. Isi folder tidak di-commit kecuali `.gitkeep`.

## Security Checklist

- Jangan gunakan password admin default.
- Jalankan admin creation dengan `ADMIN_PASSWORD` yang kuat.
- Pastikan route admin hanya diakses role `admin` atau `super_admin`.
- Jangan expose `.env`, token WhatsApp, kredensial Google Drive, atau file di `.whatsapp-auth`.
- Treat API route sebagai boundary publik: validasi auth dan ownership dekat dengan query database.

## Catatan Development

Repo ini memakai Next.js 16. Sebelum mengubah API Next.js atau file convention seperti `proxy.ts`, cek dokumentasi lokal di `node_modules/next/dist/docs/` karena beberapa API berbeda dari versi lama.
