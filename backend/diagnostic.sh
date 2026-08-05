#!/bin/bash

echo "=========================================="
echo "       DIAGNOSIS START - Task 3.3         "
echo "=========================================="
echo ""

echo "--- 1. CHECK DEPENDENCIES (dev) ---"
npm list --depth=0 @types/express @types/node jest ts-jest supertest @types/supertest 2>/dev/null || echo "❌ Some dependencies missing"
echo ""

echo "--- 2. CHECK CURRENT jest.config.js ---"
if [ -f jest.config.js ]; then
  cat jest.config.js
else
  echo "❌ jest.config.js NOT FOUND"
fi
echo ""

echo "--- 3. CHECK CURRENT tsconfig.json ---"
if [ -f tsconfig.json ]; then
  cat tsconfig.json
else
  echo "❌ tsconfig.json NOT FOUND"
fi
echo ""

echo "--- 4. CHECK PACKAGE.JSON SCRIPTS (test related) ---"
grep -E '"test":|"test:integration":' package.json || echo "❌ Test scripts not found"
echo ""

echo "--- 5. RUN TEST & CAPTURE FULL ERROR (first 150 lines) ---"
echo "▶️ Executing: npm run test:integration"
npm run test:integration 2>&1 | head -150
echo ""

echo "--- 6. CHECK ENVIRONMENT (NODE_VERSION, NPM_VERSION) ---"
node -v
npm -v
echo ""

echo "=========================================="
echo "       DIAGNOSIS END                      "
echo "=========================================="
