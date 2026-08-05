#!/bin/bash

echo "=========================================="
echo "   WAKE UP DB & RETEST - Task 3.3         "
echo "=========================================="
echo ""

echo "--- 1. WAKE UP DATABASE (prisma db push) ---"
echo "▶️ Executing: npx prisma db push --skip-generate"
npx prisma db push --skip-generate 2>&1
echo ""

echo "--- 2. WAIT 5 SECONDS FOR CONNECTION POOL ---"
sleep 5
echo ""

echo "--- 3. RUN INTEGRATION TEST (ONLY SUBMISSION) ---"
echo "▶️ Executing: npm run test:integration"
npm run test:integration 2>&1 | head -200
echo ""

echo "--- 4. RUN FULL TEST SUITE (TO SEE OVERALL STATUS) ---"
echo "▶️ Executing: npm test"
npm test 2>&1 | head -200
echo ""

echo "=========================================="
echo "       VERIFIKASI SELESAI                 "
echo "=========================================="
