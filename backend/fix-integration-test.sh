#!/bin/bash

echo "=========================================="
echo "       PERBAIKAN - Task 3.3               "
echo "=========================================="
echo ""

echo "--- 1. BACKUP BEFORE STATE ---"
cp tsconfig.json tsconfig.json.bak
echo "✅ Backup tsconfig.json → tsconfig.json.bak"
echo ""

echo "--- 2. REWRITE tsconfig.json (FIX TYPES + STRUCTURE) ---"
cat > tsconfig.json <<'JSONEOF'
{
  "compilerOptions": {
    "types": ["node", "jest", "express"],
    "typeRoots": ["node_modules/@types"],
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "tests", "dist"]
}
JSONEOF
echo "✅ tsconfig.json updated"
echo ""

echo "--- 3. UPDATE jest.config.js (isolatedModules: true) ---"
cat > jest.config.js <<'JSONEOF'
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/env.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: 'tsconfig.json',
    },
  },
};
JSONEOF
echo "✅ jest.config.js updated (isolatedModules: true)"
echo ""

echo "--- 4. ADD SCRIPT test:integration TO package.json ---"
if ! grep -q '"test:integration"' package.json; then
  # Hati-hati dengan sed, kita pakai jq jika ada, fallback ke sed manual
  if command -v jq &> /dev/null; then
    jq '.scripts["test:integration"] = "jest --testMatch='\''**/tests/integration/**/*.test.ts'\''"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo "✅ Added test:integration script (via jq)"
  else
    # Fallback: inject dengan sed (cari "scripts" dan tambahkan)
    sed -i '/"scripts": {/a \    "test:integration": "jest --testMatch='\''**/tests/integration/**/*.test.ts'\''",' package.json
    echo "✅ Added test:integration script (via sed fallback)"
  fi
else
  echo "⚠️ test:integration already exists, skipping"
fi
echo ""

echo "--- 5. RUN npm test (FULL TEST SUITE + INTEGRATION) ---"
echo "▶️ Executing: npm test"
npm test 2>&1 | head -200
echo ""

echo "=========================================="
echo "       PERBAIKAN & VERIFIKASI SELESAI     "
echo "=========================================="
