#!/bin/bash

echo "=========================================="
echo "🔍 CEK & VALIDASI: Notifications System"
echo "=========================================="
echo "Waktu: $(date)"
echo ""

echo "1️⃣ CEK: Apakah file test notification ada?"
echo "------------------------------------------"
echo "🔹 Unit Tests:"
ls -la tests/unit/notification* 2>/dev/null || echo "   ❌ Tidak ada file unit test notification"
echo ""
echo "🔹 Integration Tests:"
ls -la tests/integration/notification* 2>/dev/null || echo "   ❌ Tidak ada file integration test notification"
echo ""

echo "2️⃣ CEK: Apakah Notification Service & Repository ada?"
echo "------------------------------------------------------"
ls -la src/services/notification.service.ts 2>/dev/null && echo "   ✅ notification.service.ts ditemukan" || echo "   ❌ MISSING"
ls -la src/repositories/notification.repository.ts 2>/dev/null && echo "   ✅ notification.repository.ts ditemukan" || echo "   ❌ MISSING"
ls -la src/routes/notification.routes.ts 2>/dev/null && echo "   ✅ notification.routes.ts ditemukan" || echo "   ❌ MISSING"
echo ""

echo "3️⃣ VALIDASI: Jalankan semua test notification (FULL OUTPUT)"
echo "------------------------------------------------------------"
echo "📝 Menyimpan output ke /tmp/notif-test-output.log"

# Jalankan test dengan verbose, tanpa coverage (agar lebih cepat)
npm test -- --testPathPattern="notification" --verbose --no-coverage 2>&1 | tee /tmp/notif-test-output.log

echo ""
echo "=========================================="
echo "4️⃣ DUMP: FULL LOG (tanpa truncate)"
echo "=========================================="
cat /tmp/notif-test-output.log
echo ""

echo "=========================================="
echo "5️⃣ EKSTRAK: Error Pattern & Stack Trace"
echo "=========================================="
echo "🔹 FAIL / Error summary:"
grep -E "(FAIL|PASS|Test suite failed|Error:|TypeError:|Cannot find module|expected |received |● )" /tmp/notif-test-output.log | head -80

echo ""
echo "🔹 Stack traces (jika ada):"
grep -A 5 -E "(TypeError:|ReferenceError:|SyntaxError:)" /tmp/notif-test-output.log | head -40

echo ""
echo "=========================================="
echo "✅ CEK & VALIDASI SELESAI"
echo "=========================================="
echo "📌 Lokasi log: /tmp/notif-test-output.log"
echo "📌 Silakan kirimkan FULL output di atas ke saya."
echo "📌 JANGAN PERBAIKI APAPUN sebelum root cause ditemukan."
