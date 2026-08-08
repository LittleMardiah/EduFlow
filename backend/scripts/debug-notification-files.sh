#!/bin/bash

echo "=========================================="
echo "🔍 CEK LANJUTAN: Lokasi File & Jest Config"
echo "=========================================="
echo ""

echo "1️⃣ CEK: Cari semua file yang mengandung 'notification' di src/"
echo "--------------------------------------------------------------"
find src -type f -name "*notification*" 2>/dev/null | sort || echo "   ❌ Tidak ada file notification ditemukan"
echo ""

echo "2️⃣ CEK: Cari semua file test notification di tests/"
echo "----------------------------------------------------"
find tests -type f -name "*notification*" 2>/dev/null | sort || echo "   ❌ Tidak ada test notification ditemukan"
echo ""

echo "3️⃣ CEK: Isi package.json -> script test"
echo "----------------------------------------"
cat package.json | grep -A 5 '"scripts"' | grep test
echo ""

echo "4️⃣ CEK: Apakah Jest config memiliki testPathPattern?"
echo "-----------------------------------------------------"
cat jest.config.js 2>/dev/null | grep -i "testPathPattern" || echo "   ℹ️ Tidak ada testPathPattern di jest.config.js"
echo ""

echo "5️⃣ VALIDASI: Coba jalankan test tanpa filter dulu (hanya 2 detik, lihat apakah test jalan)"
echo "---------------------------------------------------------------------------------------------"
echo "▶️ Menjalankan: npm test -- --listTests (hanya daftar test, tidak jalan)"
npm test -- --listTests 2>&1 | head -20

echo ""
echo "=========================================="
echo "✅ CEK & VALIDASI SELESAI"
echo "=========================================="
echo "📌 Kirimkan output di atas ke saya untuk analisis."
