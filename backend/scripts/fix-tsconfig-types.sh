#!/bin/bash

echo "=========================================="
echo "🔧 PERBAIKI: tsconfig.json (Types Array)"
echo "=========================================="
echo ""

# 1. Install jq jika belum ada
echo "1️⃣ Memastikan jq terinstall..."
if ! command -v jq &> /dev/null; then
  echo "   jq tidak ditemukan. Menginstall..."
  sudo apt-get update && sudo apt-get install -y jq
else
  echo "   ✅ jq sudah terinstall."
fi
echo ""

# 2. Backup tsconfig.json
echo "2️⃣ Backup tsconfig.json..."
cp tsconfig.json tsconfig.json.bak-types-fix
echo "✅ Backup: tsconfig.json.bak-types-fix"
echo ""

# 3. Tampilkan BEFORE state (line types)
echo "3️⃣ BEFORE STATE (compilerOptions.types):"
cat tsconfig.json | grep -A 2 -B 2 '"types"'
echo ""

# 4. Hapus "types" array dari compilerOptions
echo "4️⃣ Menghapus 'types' array dari compilerOptions..."
jq '.compilerOptions | del(.types)' tsconfig.json > tsconfig.json.tmp
mv tsconfig.json.tmp tsconfig.json
echo "✅ 'types' array berhasil dihapus."
echo ""

# 5. Tampilkan AFTER state
echo "5️⃣ AFTER STATE (compilerOptions.types sudah dihapus):"
cat tsconfig.json | grep -A 2 -B 2 '"compilerOptions"' | head -20
echo ""

# 6. VALIDASI: Jalankan tsc
echo "6️⃣ VALIDASI: npx tsc --noEmit (full project)"
echo "-----------------------------------------------"
npx tsc --noEmit 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ VALIDASI PASSED! Tidak ada error TypeScript."
else
  echo ""
  echo "❌ Masih ada error. Kirimkan output ke saya."
fi

echo ""
echo "=========================================="
echo "✅ PERBAIKIAN SELESAI"
echo "=========================================="
echo "📌 Backup: tsconfig.json.bak-types-fix"
