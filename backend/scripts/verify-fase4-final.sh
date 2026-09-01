#!/bin/bash

echo "=========================================="
echo "🔍 CEK & VALIDASI: FASE 4 FINAL"
echo "=========================================="
echo "Waktu: $(date)"
echo ""

echo "1️⃣ CEK: Integration Test Files"
echo "--------------------------------"
echo "🔹 tests/integration/events.test.ts:"
if [ -f tests/integration/events.test.ts ]; then
  echo "   ✅ ADA (line count: $(wc -l < tests/integration/events.test.ts))"
  echo "   🔍 Mencari 'Full Event Workflow'..."
  grep -q "Full Event Workflow" tests/integration/events.test.ts && echo "   ✅ Full Event Workflow ditemukan" || echo "   ⚠️ Full Event Workflow TIDAK ditemukan"
else
  echo "   ❌ TIDAK ADA"
fi

echo ""
echo "🔹 tests/integration/analytics.test.ts:"
if [ -f tests/integration/analytics.test.ts ]; then
  echo "   ✅ ADA (line count: $(wc -l < tests/integration/analytics.test.ts))"
  grep -q "Instructor Personal Analytics" tests/integration/analytics.test.ts && echo "   ✅ Instructor Analytics ditemukan" || echo "   ⚠️ Instructor Analytics TIDAK ditemukan"
  grep -q "Student Personal Analytics" tests/integration/analytics.test.ts && echo "   ✅ Student Analytics ditemukan" || echo "   ⚠️ Student Analytics TIDAK ditemukan"
else
  echo "   ❌ TIDAK ADA"
fi

echo ""
echo "2️⃣ CEK: k6 Load Testing Tool"
echo "-----------------------------"
if command -v k6 &> /dev/null; then
  echo "   ✅ k6 terinstall (version: $(k6 version))"
else
  echo "   ❌ k6 TIDAK terinstall"
  echo "   📌 Install: sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
  echo "   📌          echo 'deb https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list"
  echo "   📌          sudo apt-get update && sudo apt-get install k6"
fi

echo ""
echo "3️⃣ CEK: API_CONTRACT.md (FASE 4 Endpoints)"
echo "------------------------------------------"
if [ -f API_CONTRACT.md ]; then
  echo "   ✅ API_CONTRACT.md ADA"
  echo "   🔍 Mencari endpoint FASE 4..."
  echo "   - Event Management (7 endpoints):"
  grep -q "POST /events" API_CONTRACT.md && echo "     ✅ POST /events" || echo "     ❌ POST /events MISSING"
  grep -q "GET /events" API_CONTRACT.md && echo "     ✅ GET /events" || echo "     ❌ GET /events MISSING"
  grep -q "PATCH /events" API_CONTRACT.md && echo "     ✅ PATCH /events" || echo "     ❌ PATCH /events MISSING"
  grep -q "DELETE /events" API_CONTRACT.md && echo "     ✅ DELETE /events" || echo "     ❌ DELETE /events MISSING"
  
  echo "   - Participant Management (5 endpoints):"
  grep -q "/events/.*/participants" API_CONTRACT.md && echo "     ✅ /events/:id/participants" || echo "     ❌ /events/:id/participants MISSING"
  
  echo "   - Analytics (8 endpoints):"
  grep -q "/analytics/student" API_CONTRACT.md && echo "     ✅ /analytics/student" || echo "     ❌ /analytics/student MISSING"
  grep -q "/analytics/instructor" API_CONTRACT.md && echo "     ✅ /analytics/instructor" || echo "     ❌ /analytics/instructor MISSING"
  
  echo "   - Notifications (6 endpoints):"
  grep -q "/notifications" API_CONTRACT.md && echo "     ✅ /notifications" || echo "     ❌ /notifications MISSING"
else
  echo "   ❌ API_CONTRACT.md TIDAK ADA"
fi

echo ""
echo "4️⃣ CEK: k6 Test Script (k6-analytics-load-test.js)"
echo "--------------------------------------------------"
if [ -f k6-analytics-load-test.js ]; then
  echo "   ✅ k6-analytics-load-test.js ADA (line count: $(wc -l < k6-analytics-load-test.js))"
else
  echo "   ❌ k6-analytics-load-test.js TIDAK ADA"
fi

echo ""
echo "5️⃣ VALIDASI: Jalankan Test Suite (Baseline)"
echo "---------------------------------------------"
echo "▶️ Menjalankan npm test (hanya ringkasan)..."
npm test -- --passWithNoTests --no-coverage 2>&1 | tail -20

echo ""
echo "6️⃣ CEK: Coverage Report (jika ada)"
echo "----------------------------------"
if [ -d coverage ]; then
  echo "   ✅ Coverage folder ada"
  echo "   📌 Lihat detail: open coverage/lcov-report/index.html"
else
  echo "   ❌ Belum ada coverage report"
  echo "   📌 Jalankan: npm run test:coverage"
fi

echo ""
echo "7️⃣ CEK: .env.example (Environment Variables)"
echo "--------------------------------------------"
if [ -f .env.example ]; then
  echo "   ✅ .env.example ADA"
  grep -q "DATABASE_URL" .env.example && echo "   ✅ DATABASE_URL ada" || echo "   ❌ DATABASE_URL MISSING"
  grep -q "JWT_SECRET" .env.example && echo "   ✅ JWT_SECRET ada" || echo "   ❌ JWT_SECRET MISSING"
else
  echo "   ❌ .env.example TIDAK ADA"
fi

echo ""
echo "=========================================="
echo "✅ CEK & VALIDASI SELESAI"
echo "=========================================="
echo "📌 Analisis output di atas, lalu kirimkan ke saya."
echo "📌 JANGAN PERBAIKI APAPUN sebelum root cause ditemukan."
