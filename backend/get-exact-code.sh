#!/bin/bash
echo "=========================================="
echo "  GET EXACT CODE THAT FAIL               "
echo "=========================================="
echo ""

echo "--- rbac.test.ts (line 50-70) ---"
if [ -f tests/integration/rbac.test.ts ]; then
  sed -n '50,70p' tests/integration/rbac.test.ts
else
  echo "❌ File not found"
fi

echo ""
echo "--- auth.service.ts (all organization.create calls) ---"
if [ -f src/services/auth.service.ts ]; then
  grep -n -B2 -A8 "organization.create" src/services/auth.service.ts
else
  echo "❌ File not found"
fi

echo ""
echo "--- submission.integration.test.ts (organization.create calls) ---"
if [ -f tests/integration/submission.integration.test.ts ]; then
  grep -n -B2 -A8 "organization.create" tests/integration/submission.integration.test.ts
else
  echo "❌ File not found"
fi

echo ""
echo "--- Check all organization.create in entire codebase ---"
echo "Searching all files..."
grep -r "organization.create" src tests --include="*.ts" 2>/dev/null | wc -l
echo "instances found. First 10:"
grep -r "organization.create" src tests --include="*.ts" 2>/dev/null | head -10

echo ""
echo "=========================================="
