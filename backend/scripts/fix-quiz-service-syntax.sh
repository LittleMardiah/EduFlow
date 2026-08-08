#!/bin/bash

echo "=========================================="
echo "🔧 PERBAIKI: Syntax Error quiz.service.ts"
echo "=========================================="
echo ""

# 1. Backup file asli
echo "1️⃣ Backup file asli ke quiz.service.ts.bak-notif-fix"
cp src/services/quiz.service.ts src/services/quiz.service.ts.bak-notif-fix
echo "✅ Backup berhasil"
echo ""

# 2. Tampilkan BEFORE state (line 114-134)
echo "2️⃣ BEFORE STATE (line 114-134):"
echo "--------------------------------"
sed -n '114,134p' src/services/quiz.service.ts
echo ""

# 3. Perbaiki: Ganti line 114-134 dengan versi yang benar
echo "3️⃣ Menerapkan perbaikan..."
cat > /tmp/quiz-service-fix-publish.txt << 'INNEREOF'
  // TODO: Create quiz version
  // Send notification to students (outside the update object)
  try {
    await notificationService.triggerQuizPublished(id, userId);
  } catch (notifError: any) {
    logger.warn(`Quiz publish notification failed: ${notifError.message}`);
  }

  const updated = await updateQuizRepo(id, {
    status: 'published',
    published_at: new Date(),
    current_version: { increment: 1 },
  });
  return updated;
INNEREOF

# Gunakan sed untuk replace line 114-134 dengan konten dari file temp
sed -i '114,134d' src/services/quiz.service.ts
sed -i '114 r /tmp/quiz-service-fix-publish.txt' src/services/quiz.service.ts

echo "✅ Perbaikan diterapkan"
echo ""

# 4. Tampilkan AFTER state (line 114-134)
echo "4️⃣ AFTER STATE (line 114-134):"
echo "-------------------------------"
sed -n '114,134p' src/services/quiz.service.ts
echo ""

# 5. Validasi: cek apakah masih ada error TS1005
echo "5️⃣ VALIDASI: Jalankan TypeScript check"
echo "---------------------------------------"
npx tsc --noEmit src/services/quiz.service.ts 2>&1 | head -20

echo ""
echo "=========================================="
echo "✅ PERBAIKAN SELESAI"
echo "=========================================="
echo "📌 Backup: src/services/quiz.service.ts.bak-notif-fix"
echo "📌 Jika masih error, kirimkan output ke saya."
