#!/bin/bash

echo "=========================================="
echo "🔧 FINAL VALIDASI: Full Project TSC"
echo "=========================================="
echo ""

echo "1️⃣ Menjalankan tsc pada SELURUH project (menggunakan tsconfig.json)..."
npx tsc --noEmit 2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ TSC masih ada error. Kirimkan output ke saya."
  exit 1
fi

echo ""
echo "✅ TSC PASSED! Tidak ada error TypeScript di seluruh project."
echo ""

echo "=========================================="
echo "🚀 MENJALANKAN TEST NOTIFICATION"
echo "=========================================="
echo ""

echo "2️⃣ Menjalankan Jest untuk notification (unit + integration)..."
npx jest --testPathPatterns=notification --detectOpenHandles --forceExit --verbose --no-coverage 2>&1

echo ""
echo "=========================================="
echo "✅ FINAL VALIDASI & TEST SELESAI"
echo "=========================================="
