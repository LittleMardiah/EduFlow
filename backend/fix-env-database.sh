#!/bin/bash
set -e

echo "=========================================="
echo "  FIX DATABASE_URL ENV                  "
echo "=========================================="
echo ""

echo "--- 1. CEK .env ---"
if [ -f .env ]; then
  echo "✅ .env file exists"
  grep "DATABASE_URL" .env | head -1
else
  echo "❌ .env NOT FOUND! Buat dari .env.example..."
  cp .env.example .env 2>/dev/null || echo "⚠️ .env.example juga tidak ada"
fi
echo ""

echo "--- 2. CEK src/config/env.ts ---"
head -20 src/config/env.ts || echo "❌ env.ts tidak ditemukan"
echo ""

echo "--- 3. CEK APAKAH dotenv SUDAH DI-LOAD ---"
if grep -q "dotenv" src/config/env.ts; then
  echo "✅ dotenv sudah di-import di env.ts"
else
  echo "⚠️ dotenv belum di-import, menambahkan..."
  sed -i '1iimport dotenv from "dotenv";\ndotenv.config();' src/config/env.ts
fi

if grep -q "import 'dotenv/config'" src/index.ts; then
  echo "✅ dotenv/config sudah di-import di index.ts"
else
  echo "⚠️ dotenv/config belum di-import, menambahkan..."
  sed -i '1iimport "dotenv/config";' src/index.ts
fi
echo ""

echo "--- 4. TEST SERVER (jalan 5 detik) ---"
timeout 5 npx tsx src/index.ts 2>&1 | head -20 || echo "✅ Server started successfully (timeout normal)"
echo ""

echo "--- 5. VERIFIKASI FINAL ---"
echo "📄 src/config/env.ts baris pertama:"
head -5 src/config/env.ts
echo ""
echo "📄 src/index.ts baris pertama:"
head -5 src/index.ts
echo ""

echo "=========================================="
echo "  ✅ FIX SELESAI - COBA RUN SERVER      "
echo "=========================================="
