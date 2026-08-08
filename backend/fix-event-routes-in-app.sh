#!/bin/bash
set -e

echo "=========================================="
echo "  FIX EVENT ROUTES DI APP.TS            "
echo "=========================================="
echo ""

echo "--- 1. CEK ISI src/app.ts ---"
if [ -f src/app.ts ]; then
  cat src/app.ts
else
  echo "❌ src/app.ts NOT FOUND! Buat baru..."
fi
echo ""

echo "--- 2. BACKUP app.ts ---"
cp src/app.ts src/app.ts.bak-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "⚠️ No app.ts to backup"
echo ""

echo "--- 3. TAMBAHKAN EVENT ROUTES DI APP.TS ---"
# Cek apakah app.ts ada
if [ ! -f src/app.ts ]; then
  echo "📝 Membuat src/app.ts baru..."
  cat > src/app.ts <<'APP_EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import eventRoutes from './routes/events';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== FASE 4: EVENT ROUTES =====
app.use('/api/v1/events', eventRoutes);

app.use(errorHandler);

export default app;
APP_EOF
  echo "✅ app.ts created"
else
  # Cek apakah eventRoutes sudah di-import
  if ! grep -q "eventRoutes" src/app.ts; then
    echo "📝 Menambahkan import eventRoutes..."
    sed -i '1iimport eventRoutes from "./routes/events";' src/app.ts
  fi

  # Cek apakah route sudah terdaftar
  if ! grep -q "/api/v1/events" src/app.ts; then
    echo "📝 Menambahkan route /api/v1/events..."
    # Cari posisi sebelum export default atau sebelum errorHandler
    if grep -q "app.use(errorHandler)" src/app.ts; then
      sed -i '/app.use(errorHandler)/i \  app.use("/api/v1/events", eventRoutes);' src/app.ts
    else
      # fallback: tambahkan di akhir sebelum export
      sed -i '$i \  app.use("/api/v1/events", eventRoutes);' src/app.ts
    fi
  else
    echo "✅ Route /api/v1/events sudah terdaftar"
  fi
fi
echo ""

echo "--- 4. VERIFIKASI app.ts ---"
grep -n "eventRoutes" src/app.ts || echo "⚠️ eventRoutes masih belum di-import"
grep -n "/api/v1/events" src/app.ts || echo "⚠️ Route /api/v1/events belum terdaftar"
echo ""

echo "--- 5. RUN TEST LAGI ---"
npx jest tests/integration/events.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "  ✅ SELESAI                              "
echo "=========================================="
