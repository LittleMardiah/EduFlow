#!/bin/bash

echo "=========================================="
echo "  CEK KONEKSI DATABASE SUPABASE         "
echo "=========================================="
echo ""

echo "--- 1. PING ke Supabase ---"
ping -c 3 aws-0-ap-southeast-1.pooler.supabase.com 2>&1 || echo "❌ PING FAILED"
echo ""

echo "--- 2. NC (netcat) ke port 5432 ---"
nc -zv aws-0-ap-southeast-1.pooler.supabase.com 5432 2>&1 || echo "❌ NC FAILED"
echo ""

echo "--- 3. TEST PSQL CONNECTION ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "SELECT 1;" 2>&1
echo ""

echo "--- 4. CEK .env DATABASE_URL ---"
grep DATABASE_URL .env
echo ""

echo "--- 5. CEK ENVIRONMENT (WSL?) ---"
uname -a
echo ""

echo "=========================================="
echo "  DIAGNOSTIK SELESAI                     "
echo "=========================================="
