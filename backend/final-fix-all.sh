#!/bin/bash
set -e

echo "=========================================="
echo "  FINAL FIX - SEMUA MASALAH             "
echo "=========================================="
echo ""

echo "--- 1. PERBAIKI logger.ts (default export) ---"
if [ -f src/utils/logger.ts ]; then
  # Cek apakah ada default export
  if ! grep -q "export default" src/utils/logger.ts; then
    echo "export default logger;" >> src/utils/logger.ts
    echo "✅ logger.ts fixed (added default export)"
  else
    echo "✅ logger.ts already has default export"
  fi
else
  echo "⚠️ logger.ts NOT FOUND, membuat baru..."
  mkdir -p src/utils
  cat > src/utils/logger.ts <<'LOGGER_EOF'
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
LOGGER_EOF
  echo "✅ logger.ts created"
fi
echo ""

echo "--- 2. PERBAIKI rbac.test.ts (syntax error line 179) ---"
# Lihat line 179
echo "📄 Line 179 saat ini:"
sed -n '175,185p' tests/integration/rbac.test.ts
echo ""

# Hapus baris yang tidak perlu (jika ada bracket berlebih)
sed -i '179d' tests/integration/rbac.test.ts
echo "✅ Line 179 removed (if existed)"
echo ""

echo "--- 3. VERIFIKASI auth.service.ts (logger import) ---"
grep -n "import.*logger" src/services/auth.service.ts
echo ""

echo "--- 4. RUN TEST (rbac only) ---"
npm run test:integration -- tests/integration/rbac.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "  SELESAI                               "
echo "=========================================="
