#!/bin/bash

echo "=========================================="
echo "   MIGRASI KE SUPABASE - EduFlow          "
echo "=========================================="
echo ""

echo "--- 1. CEK KONEKSI SUPABASE ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "SELECT 1 as connection_test;" 2>&1
echo ""

echo "--- 2. CEK TABEL YANG SUDAH ADA ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "\dt" 2>&1
echo ""

echo "--- 3. UPDATE .env DENGAN CONNECTION STRING SUPABASE ---"
# Backup .env dulu
cp .env .env.backup-supabase

# Update DATABASE_URL
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres.migvkenwymahhojugjex:kqjWBGr5m0iiXU5l@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres|' .env

echo "✅ .env updated with Supabase connection string"
echo ""

echo "--- 4. CEK DATABASE_URL BARU ---"
grep DATABASE_URL .env
echo ""

echo "--- 5. TEST CONNECTION DENGAN PRISMA ---"
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1
echo ""

echo "--- 6. CEK MIGRATION STATUS ---"
npx prisma migrate status 2>&1
echo ""

echo "--- 7. PUSH SCHEMA (jika tabel belum ada) ---"
echo "▶️ Menjalankan prisma db push (amannya, karena migration mungkin belum ada)"
npx prisma db push --skip-generate 2>&1
echo ""

echo "--- 8. GENERATE PRISMA CLIENT ---"
npx prisma generate
echo ""

echo "--- 9. VERIFIKASI TABEL ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "\dt" 2>&1
echo ""

echo "--- 10. RUN SUBMISSION INTEGRATION TEST ---"
npm run test:integration -- submission.integration 2>&1 | head -200
echo ""

echo "=========================================="
echo "   MIGRASI SELESAI                       "
echo "=========================================="
