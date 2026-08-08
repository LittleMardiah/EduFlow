#!/bin/bash

echo "=========================================="
echo "🔧 CEK & EKSEKUSI: Notifications Tests"
echo "=========================================="
echo "Waktu: $(date)"
echo ""

echo "1️⃣ CEK: Verifikasi isi folder src/services/"
echo "---------------------------------------------"
ls -la src/services/ 2>/dev/null || echo "   ❌ Folder src/services/ TIDAK ADA"
echo ""

echo "2️⃣ CEK: Verifikasi isi folder src/repositories/"
echo "-------------------------------------------------"
ls -la src/repositories/ 2>/dev/null || echo "   ❌ Folder src/repositories/ TIDAK ADA"
echo ""

echo "3️⃣ CEK: Apakah ada file notification di folder lain?"
echo "------------------------------------------------------"
find src -type f -name "*notification*" -o -name "*Notification*" 2>/dev/null | sort || echo "   ❌ Tidak ditemukan"
echo ""

echo "4️⃣ PERBAIKI: Jalankan test notification dengan CLI yang benar"
echo "   (menggunakan --testPathPatterns, bukan --testPathPattern)"
echo "----------------------------------------------------------------"
npx jest --testPathPatterns="notification" --detectOpenHandles --forceExit --verbose --no-coverage 2>&1 | tee /tmp/notif-test-fixed.log

echo ""
echo "=========================================="
echo "5️⃣ DUMP: FULL LOG (5 baris terakhir ringkasan)"
echo "=========================================="
tail -50 /tmp/notif-test-fixed.log

echo ""
echo "=========================================="
echo "✅ CEK & EKSEKUSI SELESAI"
echo "=========================================="
echo "📌 Log lengkap: /tmp/notif-test-fixed.log"
echo "📌 Kirimkan FULL output ke saya untuk analisis lanjutan."
