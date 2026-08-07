#!/bin/bash
set -e

echo "=========================================="
echo "  FINAL VISIBILITY CHECK                 "
echo "=========================================="
echo ""

echo "--- ALL organization.create() LOCATIONS ---"
echo "Searching entire codebase..."
echo ""
grep -rn "organization\.create" . --include="*.ts" --exclude-dir=node_modules 2>/dev/null | sort || echo "None found"

echo ""
echo "--- DETAIL: src/services/auth.service.ts ---"
echo "Showing ALL organization.create contexts..."
grep -n -B3 -A12 "organization\.create" src/services/auth.service.ts 2>/dev/null || echo "No matches in current file"

echo ""
echo "--- Prisma Client version ---"
grep "\"@prisma/client\"" package.json

echo ""
echo "=========================================="

