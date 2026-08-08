#!/bin/bash

echo "=========================================="
echo "🔍 CEK: Syntax Error di grading.service.ts"
echo "=========================================="
echo ""

echo "1️⃣ Tampilkan line 140-330 dengan nomor baris:"
echo "----------------------------------------------"
nl -ba src/services/grading.service.ts | sed -n '140,330p'

echo ""
echo "2️⃣ Tampilkan line 328-340 (karena error TS1128 di line 328):"
echo "--------------------------------------------------------------"
nl -ba src/services/grading.service.ts | sed -n '328,340p'

echo ""
echo "=========================================="
echo "✅ CEK SELESAI"
echo "=========================================="
echo "📌 Kirimkan output ke saya untuk analisis perbaikan."
