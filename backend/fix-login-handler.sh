#!/bin/bash

##############################################################################
# FIX LOGIN HANDLER - OPSI A
# 
# Root Cause: Service login() return { success, data: { user, token } }
#             Controller destructure { user, token } = await login() → WRONG
#             Hasil: user dan token = undefined → ERROR
#
# Solusi: Fix controller loginHandler agar handle return object dengan benar
#         Pattern sama dengan registerHandler
##############################################################################

echo "=========================================="
echo "   FIX LOGIN HANDLER - OPSI A            "
echo "=========================================="
echo ""

# ============================================================================
# PART 1: BACKUP
# ============================================================================

echo "--- PART 1: BACKUP src/controllers/auth.controller.ts ---"
cp src/controllers/auth.controller.ts src/controllers/auth.controller.ts.bak
echo "✅ Backup created: src/controllers/auth.controller.ts.bak"
echo ""

# ============================================================================
# PART 2: REWRITE loginHandler
# ============================================================================

echo "--- PART 2: REWRITE loginHandler ---"
echo ""

# Find start line of loginHandler function
START_LINE=$(grep -n "export async function loginHandler" src/controllers/auth.controller.ts | cut -d: -f1)
END_LINE=$(tail -n +$START_LINE src/controllers/auth.controller.ts | grep -n "^}" | head -1 | cut -d: -f1)
END_LINE=$((START_LINE + END_LINE - 1))

echo "Function found at lines: $START_LINE to $END_LINE"
echo ""

# Create new loginHandler content
cat > /tmp/new-loginHandler.txt << 'HANDLEEOF'
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const loginResult = await login(email, password);
    
    // Validate login result structure
    if (!loginResult.success || !loginResult.data) {
      return res.status(401).json({
        success: false,
        error: { message: loginResult.error?.message || 'Login failed' },
      });
    }
    
    const { user, token } = loginResult.data;
    
    // Jangan return password_hash
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    res.status(401).json({
      success: false,
      error: { message: error.message },
    });
  }
}
HANDLEEOF

# Create temp file dengan content sebelum loginHandler
head -n $((START_LINE - 1)) src/controllers/auth.controller.ts > /tmp/auth-controller-new.ts

# Append new loginHandler
cat /tmp/new-loginHandler.txt >> /tmp/auth-controller-new.ts

# Append content sesudah loginHandler
tail -n +$((END_LINE + 1)) src/controllers/auth.controller.ts >> /tmp/auth-controller-new.ts

# Replace original file
cp /tmp/auth-controller-new.ts src/controllers/auth.controller.ts

echo "✅ loginHandler rewritten"
echo ""

# ============================================================================
# PART 3: VERIFY CHANGES
# ============================================================================

echo "--- PART 3: VERIFY CHANGES ---"
echo ""

echo "📄 New loginHandler:"
sed -n '/export async function loginHandler/,/^}/p' src/controllers/auth.controller.ts | head -35
echo ""

# ============================================================================
# PART 4: RUN TEST
# ============================================================================

echo "--- PART 4: RUN INTEGRATION TEST ---"
echo ""

npm test -- tests/integration/submission.integration.test.ts 2>&1 | tee /tmp/test-output-after-fix.log

echo ""
echo "=========================================="
echo "   TEST RESULT SUMMARY                   "
echo "=========================================="
echo ""

# Extract test result summary
echo "📊 TEST SUMMARY:"
grep -E "Tests:|Test Suites:" /tmp/test-output-after-fix.log | tail -5

echo ""
echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
