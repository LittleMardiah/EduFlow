#!/bin/bash

echo "=========================================="
echo "  GENERATE FULL TEST LOG                 "
echo "=========================================="
echo ""

echo "▶️ Menjalankan: npm run test:integration"
echo "📁 Output akan disimpan ke: test-output-full.log"
echo ""

# Jalankan test, simpan semua output (stdout + stderr) ke file
npm run test:integration > test-output-full.log 2>&1

echo ""
echo "✅ Test selesai. Log tersimpan di test-output-full.log"
echo ""

echo "--- RINGKASAN ERROR (pertama 50 baris) ---"
grep -E "FAIL|Error:|Cannot read|Argument|PrismaClient" test-output-full.log | head -50

echo ""
echo "Untuk melihat full log: cat test-output-full.log"
echo "Atau buka dengan editor: nano test-output-full.log"
echo ""

echo "=========================================="
echo "  SELESAI                                "
echo "=========================================="
