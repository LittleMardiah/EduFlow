#!/bin/bash

echo "=========================================="
echo "  DIAGNOSTIK KONEKSI SUPABASE           "
echo "=========================================="
echo ""

HOST="aws-0-ap-southeast-1.pooler.supabase.com"
PORT="5432"
USER="postgres.migvkenwymahhojugjex"
DB="postgres"
PASS="kqjWBGr5m0iiXU5l"

echo "--- 1. DNS RESOLVE ---"
dig +short $HOST || nslookup $HOST || echo "❌ DNS resolve FAILED"
echo ""

echo "--- 2. PING ---"
ping -c 3 $HOST 2>&1 | head -5
echo ""

echo "--- 3. PORT CHECK (nc) ---"
nc -zv $HOST $PORT 2>&1
echo ""

echo "--- 4. PSQL CONNECTION (langsung) ---"
PGPASSWORD="$PASS" psql \
  -h "$HOST" \
  -p "$PORT" \
  -U "$USER" \
  -d "$DB" \
  -c "SELECT 1;" 2>&1
echo ""

echo "--- 5. CEK DATABASE_URL DI .env ---"
grep "DATABASE_URL" .env
echo ""

echo "--- 6. CEK ENVIRONMENT VARIABLE (node) ---"
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL);" 2>&1 || echo "❌ node dotenv test gagal"
echo ""

echo "=========================================="
echo "  DIAGNOSTIK SELESAI                     "
echo "=========================================="
