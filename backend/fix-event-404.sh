#!/bin/bash
set -e

echo "=========================================="
echo "  FIX EVENT 404 - EXPORT APP            "
echo "=========================================="
echo ""

echo "--- 1. CEK ISI src/index.ts ---"
head -30 src/index.ts
echo ""

echo "--- 2. PASTIKAN APP DIEXPORT ---"
if grep -q "export default app" src/index.ts; then
  echo "✅ app sudah diexport"
else
  echo "⚠️ app belum diexport, menambahkan..."
  echo "export default app;" >> src/index.ts
  echo "✅ export default app ditambahkan"
fi
echo ""

echo "--- 3. PASTIKAN EVENT ROUTES TERDAFTAR ---"
if grep -q "app.use('/api/v1/events'" src/index.ts; then
  echo "✅ event routes sudah terdaftar"
else
  echo "⚠️ event routes belum terdaftar, menambahkan..."
  # Cari posisi setelah app.use lainnya
  sed -i '/app\.use.*\/api\/v1\/[a-z]/a app.use("/api/v1/events", eventRoutes);' src/index.ts
  echo "✅ event routes ditambahkan"
fi
echo ""

echo "--- 4. PASTIKAN eventRoutes DIIMPORT ---"
if grep -q "import eventRoutes" src/index.ts; then
  echo "✅ eventRoutes sudah diimport"
else
  echo "⚠️ eventRoutes belum diimport, menambahkan..."
  sed -i '1iimport eventRoutes from "./routes/events";' src/index.ts
  echo "✅ eventRoutes diimport"
fi
echo ""

echo "--- 5. VERIFIKASI FINAL ---"
head -30 src/index.ts
echo ""

echo "--- 6. RUN TEST LAGI ---"
npx jest tests/integration/events.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "  ✅ FIX SELESAI                         "
echo "=========================================="
