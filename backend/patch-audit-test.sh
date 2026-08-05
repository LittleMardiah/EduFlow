#!/bin/bash
# Script ini akan patch test Audit dengan student baru
# CARA: kita cari baris test('Audit logging...'), lalu di baris berikutnya
# kita sisipkan registrasi student baru, dan ganti studentToken dengan variabel baru.

echo "📝 Patch test Audit..."
# Kita backup dulu
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.patch

# Cari baris test Audit
LINE_NUM=$(grep -n 'test("Audit logging tracks submission changes", async () => {' tests/integration/submission.integration.test.ts | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
  echo "❌ Test Audit tidak ditemukan!"
  exit 1
fi

echo "✅ Test Audit ditemukan di baris $LINE_NUM"

# Tambahkan registrasi student baru setelah baris tersebut
# Kita akan insert kode dengan sed (hati-hati)
# Tapi karena sed di tengah file TypeScript rawan error, kita gunakan pendekatan:
# Buat file temp dengan konten baru.

# Lebih aman: kita tulis ulang test Audit dengan pendekatan berbeda.
# Karena ini sudah terlalu kompleks, saya sarankan perbaikan manual.

echo "⚠️  Script otomatis terlalu berisiko untuk TypeScript."
echo "Saya sarankan perbaikan MANUAL dengan mengikuti petunjuk di atas."
echo ""

