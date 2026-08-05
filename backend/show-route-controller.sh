#!/bin/bash

echo "=========================================="
echo "   VISIBILITY ROUTE / CONTROLLER         "
echo "=========================================="
echo ""

echo "--- 1. CARI FILE ROUTE ---"
find src -name "*route*" -type f 2>/dev/null | head -20
echo ""

echo "--- 2. CARI FILE CONTROLLER ---"
find src -name "*controller*" -type f 2>/dev/null | head -20
echo ""

echo "--- 3. ISI src/routes/auth.routes.ts (jika ada) ---"
if [ -f src/routes/auth.routes.ts ]; then
  cat src/routes/auth.routes.ts
else
  echo "❌ src/routes/auth.routes.ts NOT FOUND"
  echo "Coba cek file route lain:"
  ls -la src/routes/ 2>/dev/null || echo "Folder src/routes/ tidak ada"
fi
echo ""

echo "--- 4. ISI src/controllers/auth.controller.ts (jika ada) ---"
if [ -f src/controllers/auth.controller.ts ]; then
  cat src/controllers/auth.controller.ts
else
  echo "❌ src/controllers/auth.controller.ts NOT FOUND"
  echo "Coba cek file controller lain:"
  ls -la src/controllers/ 2>/dev/null || echo "Folder src/controllers/ tidak ada"
fi
echo ""

echo "--- 5. ISI src/app.ts (main entry) ---"
if [ -f src/app.ts ]; then
  cat src/app.ts
else
  echo "❌ src/app.ts NOT FOUND"
  echo "Coba cek file index.ts atau main entry:"
  ls -la src/*.ts 2>/dev/null | head -10
fi
echo ""

echo "--- 6. STRUKTUR FOLDER src/ ---"
ls -la src/
echo ""

echo "=========================================="
echo "   VISIBILITY SELESAI                    "
echo "=========================================="
