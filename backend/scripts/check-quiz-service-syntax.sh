#!/bin/bash

echo "=========================================="
echo "🔍 CEK: Syntax Error di quiz.service.ts"
echo "=========================================="
echo ""

echo "1️⃣ Tampilkan isi file di sekitar line 115-140:"
echo "-----------------------------------------------"
sed -n '115,140p' src/services/quiz.service.ts

echo ""
echo "2️⃣ Tampilkan line dengan nomor (agar jelas posisi error):"
echo "----------------------------------------------------------"
nl -ba src/services/quiz.service.ts | sed -n '115,140p'

echo ""
echo "3️⃣ CEK: Apakah ada function yang tidak tertutup?"
echo "--------------------------------------------------"
grep -n "async publishQuiz" src/services/quiz.service.ts
grep -n "}" src/services/quiz.service.ts | tail -10

echo ""
echo "=========================================="
echo "✅ CEK SELESAI"
echo "=========================================="
echo "📌 Kirimkan output ke saya untuk analisis lanjutan."
