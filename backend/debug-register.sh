#!/bin/bash

echo "=========================================="
echo "   DEBUG REGISTER FUNCTION               "
echo "=========================================="
echo ""

echo "--- 1. BACKUP auth.service.ts ---"
cp src/services/auth.service.ts src/services/auth.service.ts.bak7
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN CONSOLE.LOG DI REGISTER ---"
# Patch auth.service.ts untuk menambahkan log
sed -i '/export async function register(/,/^}/ {
  /export async function register(/a\
  console.log("🔍 REGISTER CALLED with:", { email, firstName, lastName, role });
  /try {/a\
    console.log("🔍 REGISTER: inside try block");
  /const user = await registerUser(/a\
    console.log("🔍 REGISTER: user created", user.id);
  /return {/a\
    console.log("🔍 REGISTER: returning success", user.id);
  /catch (error: any) {/a\
    console.error("🔍 REGISTER: caught error", error.message);
  /return {/a\
    console.log("🔍 REGISTER: returning error");
}' src/services/auth.service.ts

echo "✅ auth.service.ts patched with console.log"
echo ""

echo "--- 3. RUN SUBMISSION TEST (lihat console.log) ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | head -300
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
