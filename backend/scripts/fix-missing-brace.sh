#!/bin/bash

echo "=========================================="
echo "🔧 PERBAIKI: Missing Closing Brace"
echo "=========================================="
echo ""

# 1. Backup lagi (jaga-jaga)
echo "1️⃣ Backup tambahan: quiz.service.ts.bak-brace-fix"
cp src/services/quiz.service.ts src/services/quiz.service.ts.bak-brace-fix
echo "✅ Backup berhasil"
echo ""

# 2. Tampilkan state SEKARANG di sekitar line 125-145
echo "2️⃣ STATE SEKARANG (line 125-145):"
echo "----------------------------------"
sed -n '125,145p' src/services/quiz.service.ts
echo ""

# 3. PERBAIKI: Tambahkan '}' setelah baris yang berisi 'return updated;'
echo "3️⃣ Menambahkan kurung tutup '}' setelah 'return updated;'"
sed -i '/return updated;/a \}' src/services/quiz.service.ts
echo "✅ Kurung tutup ditambahkan"
echo ""

# 4. Tampilkan state SETELAH perbaikan
echo "4️⃣ STATE SETELAH (line 125-145):"
echo "---------------------------------"
sed -n '125,145p' src/services/quiz.service.ts
echo ""

# 5. VALIDASI: Jalankan TypeScript check
echo "5️⃣ VALIDASI: npx tsc --noEmit src/services/quiz.service.ts"
echo "-----------------------------------------------------------"
npx tsc --noEmit src/services/quiz.service.ts 2>&1

if [ $? -eq 0 ]; then
  echo "✅ TypeScript check PASSED - tidak ada error!"
else
  echo "❌ TypeScript check masih gagal. Kirimkan output ke saya."
fi

echo ""
echo "=========================================="
echo "✅ PERBAIKAN SELESAI"
echo "=========================================="
echo "📌 Backup: src/services/quiz.service.ts.bak-brace-fix"
