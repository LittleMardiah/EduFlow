#!/bin/bash

echo "=========================================="
echo "   FIX AUDIT TEST - STUDENT BARU         "
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-audit
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN STUDENT BARU DI TEST AUDIT ---"
# Cari baris 'test("Audit logging tracks submission changes", async () => {'
# Lalu sisipkan registrasi student baru setelah baris itu
sed -i '/test("Audit logging tracks submission changes", async () => {/a\
\
    // === REGISTER FRESH STUDENT UNTUK TEST AUDIT ===\
    const auditStudentEmail = `audit_student_${Date.now()}@example.com`;\
    const auditStudentReg = await request(app)\
      .post("/api/v1/auth/register")\
      .send({\
        email: auditStudentEmail,\
        password: "SecurePass123!",\
        first_name: "Audit",\
        last_name: "Student",\
        role: "student",\
      });\
    if (!auditStudentReg.body.data?.user?.id) {\
      throw new Error("Audit student registration failed");\
    }\
    const auditStudentLogin = await request(app)\
      .post("/api/v1/auth/login")\
      .send({ email: auditStudentEmail, password: "SecurePass123!" });\
    const auditStudentToken = auditStudentLogin.body.data.token;\
    console.log("✅ Audit student registered and logged in");\
\
    // Ganti semua studentToken dengan auditStudentToken di test ini (dengan sed selanjutnya)\
' tests/integration/submission.integration.test.ts

echo "✅ Student baru ditambahkan di dalam test Audit"
echo ""

echo "--- 3. GANTI studentToken → auditStudentToken DI DALAM TEST AUDIT ---"
# Kita akan ganti semua 'studentToken' yang ada di dalam blok test Audit
# Gunakan sed dengan range: dari baris yang mengandung 'test("Audit logging...' sampai baris sebelum test berikutnya
# Kita asumsikan test berikutnya adalah 'describe' atau 'test' lain, kita cari pola '});' yang menutup test
# Cara lebih aman: kita ganti semua studentToken dengan auditStudentToken di seluruh file, tapi itu akan merusak test lain.
# Jadi kita hanya ganti dalam blok tersebut dengan bantuan awk atau sed yang lebih canggih.

# Karena cukup tricky, kita gunakan pendekatan: kita simpan studentToken asli, dan di dalam test audit kita override variabel studentToken dengan auditStudentToken.
# Sehingga kita tidak perlu mengganti semua referensi.

# Jadi di dalam test audit, setelah kita punya auditStudentToken, kita set studentToken = auditStudentToken.
# Ini akan override variabel global studentToken untuk test ini saja.

# Kita tambahkan baris:
# studentToken = auditStudentToken;
# setelah login sukses.

# Tambahkan baris tersebut
sed -i '/const auditStudentToken = auditStudentLogin.body.data.token;/a\
    // Override studentToken untuk test ini\
    studentToken = auditStudentToken;\
' tests/integration/submission.integration.test.ts

echo "✅ studentToken di-override di dalam test Audit"
echo ""

echo "--- 4. VERIFIKASI PERUBAHAN ---"
grep -A 30 'test("Audit logging tracks submission changes"' tests/integration/submission.integration.test.ts | head -40
echo ""

echo "--- 5. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -80
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
