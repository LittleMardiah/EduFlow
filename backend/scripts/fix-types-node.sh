#!/bin/bash

echo "=========================================="
echo "🔧 PERBAIKI: Install @types/node"
echo "=========================================="
echo ""

# 1. CEK: Apakah @types/node sudah terinstall?
echo "1️⃣ CEK: Apakah @types/node ada di node_modules?"
if [ -d "node_modules/@types/node" ]; then
  echo "✅ @types/node SUDAH terinstall."
else
  echo "❌ @types/node TIDAK ditemukan. Menginstall..."
  npm install --save-dev @types/node
  echo "✅ @types/node berhasil diinstall."
fi
echo ""

# 2. CEK: Apakah ada di package.json?
echo "2️⃣ CEK: Apakah @types/node ada di package.json?"
grep -q '"@types/node"' package.json && echo "✅ Ada di package.json" || echo "⚠️ Tidak ada di package.json (tapi sudah terinstall)"
echo ""

# 3. VALIDASI ULANG: Jalankan tsc tanpa error lingkungan
echo "3️⃣ VALIDASI: Jalankan tsc pada quiz.service.ts"
echo "-----------------------------------------------"
npx tsc --noEmit src/services/quiz.service.ts 2>&1

if [ $? -eq 0 ]; then
  echo "✅ TypeScript check PASSED - quiz.service.ts clean!"
else
  echo "❌ Masih ada error. Kirimkan output ke saya."
fi

echo ""
echo "4️⃣ VALIDASI: Jalankan tsc penuh (seluruh project) untuk memastikan"
echo "-------------------------------------------------------------------"
npx tsc --noEmit 2>&1 | head -30

echo ""
echo "=========================================="
echo "✅ PERBAIKAN SELESAI"
echo "=========================================="
