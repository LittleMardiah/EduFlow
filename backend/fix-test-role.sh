#!/bin/bash

##############################################################################
# FIX TEST - CHANGE ROLE TO INSTRUCTOR
#
# Root Cause: Test register user dengan role 'student'
#             Quiz route require role 'instructor' atau 'admin'
#             Akibatnya: requireRole middleware block request
#
# Solusi: Change role 'student' → 'instructor' di test setup
##############################################################################

echo "=========================================="
echo "   FIX TEST - CHANGE ROLE TO INSTRUCTOR   "
echo "=========================================="
echo ""

# ============================================================================
# PART 1: BACKUP
# ============================================================================

echo "--- PART 1: BACKUP ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-role
echo "✅ Backup created: tests/integration/submission.integration.test.ts.bak-role"
echo ""

# ============================================================================
# PART 2: REPLACE role
# ============================================================================

echo "--- PART 2: REPLACE 'student' WITH 'instructor' ---"
sed -i "s/role: 'student'/role: 'instructor'/g" tests/integration/submission.integration.test.ts
echo "✅ Role updated in test file"
echo ""

# ============================================================================
# PART 3: VERIFY CHANGES
# ============================================================================

echo "--- PART 3: VERIFY CHANGES ---"
echo ""

echo "📄 Lines containing 'role:':"
grep -n "role:" tests/integration/submission.integration.test.ts
echo ""

echo "Count of 'instructor':"
grep -c "role: 'instructor'" tests/integration/submission.integration.test.ts
echo ""

# ============================================================================
# PART 4: RUN TEST
# ============================================================================

echo "--- PART 4: RUN INTEGRATION TEST ---"
echo ""

npm test -- tests/integration/submission.integration.test.ts 2>&1 | tee /tmp/test-output-role-fix.log

echo ""
echo "=========================================="
echo "   TEST RESULT SUMMARY                   "
echo "=========================================="
echo ""

# Extract test result
echo "📊 TEST SUMMARY:"
grep -E "Tests:|Test Suites:|passed|failed" /tmp/test-output-role-fix.log | tail -10

echo ""

# Check if all passed
if grep -q "5 passed" /tmp/test-output-role-fix.log; then
  echo "✅ SUCCESS! All 5 tests PASSED!"
  echo ""
  echo "🎉 ROOT CAUSE SOLVED:"
  echo "   - Changed role: 'student' → 'instructor'"
  echo "   - Quiz route requireRole middleware now allows request"
  echo "   - createQuizHandler successfully creates quiz"
  echo "   - Response structure correct: { success: true, data: quiz }"
  RESULT="SUCCESS"
elif grep -q "passed" /tmp/test-output-role-fix.log; then
  RESULT="PARTIAL"
  echo "⚠️  Some tests passed but not all 5"
else
  RESULT="FAILED"
  echo "❌ Tests still failing"
  echo ""
  echo "Check output above for details"
fi

echo ""
echo "=========================================="
echo "   SELESAI - RESULT: $RESULT                "
echo "=========================================="
echo ""

# ============================================================================
# PART 5: DETAILED ERROR (if any)
# ============================================================================

if [ "$RESULT" != "SUCCESS" ]; then
  echo "📋 DETAILED ERROR (if exists):"
  echo "==========================================="
  grep -A 5 "●" /tmp/test-output-role-fix.log | head -30
  echo ""
fi
