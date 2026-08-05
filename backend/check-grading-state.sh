#!/bin/bash

echo "=========================================="
echo "   CEK STATE - AUTO-GRADING ENGINE       "
echo "=========================================="
echo ""

echo "--- 1. CEK FILE grading.service.ts ---"
if [ -f src/services/grading.service.ts ]; then
  echo "✅ File exists: src/services/grading.service.ts"
  wc -l src/services/grading.service.ts
else
  echo "❌ File NOT FOUND: src/services/grading.service.ts"
fi
echo ""

echo "--- 2. CEK FILE grading.repository.ts ---"
if [ -f src/repositories/grading.repository.ts ]; then
  echo "✅ File exists: src/repositories/grading.repository.ts"
  wc -l src/repositories/grading.repository.ts
else
  echo "❌ File NOT FOUND: src/repositories/grading.repository.ts"
fi
echo ""

echo "--- 3. CEK FILE grading.edge-cases.test.ts ---"
if [ -f tests/grading.edge-cases.test.ts ]; then
  echo "✅ File exists: tests/grading.edge-cases.test.ts"
  wc -l tests/grading.edge-cases.test.ts
else
  echo "❌ File NOT FOUND: tests/grading.edge-cases.test.ts"
fi
echo ""

echo "--- 4. CEK PRISMA SCHEMA - MODEL Submission ---"
grep -A 20 "model Submission" prisma/schema.prisma | head -25
echo ""

echo "--- 5. CEK PRISMA SCHEMA - MODEL Answer ---"
grep -A 15 "model Answer" prisma/schema.prisma | head -20
echo ""

echo "--- 6. CEK APAKAH ADA FUNGSI gradeSubmission DI SERVICE LAIN ---"
grep -r "gradeSubmission" src/services/ 2>/dev/null | head -5
echo ""

echo "=========================================="
echo "   CEK SELESAI                           "
echo "=========================================="
