#!/bin/bash
set -e

echo "=========================================="
echo "  DEBUG EVENT INTEGRATION TEST          "
echo "=========================================="
echo ""

echo "--- 1. UPDATE TEST FILE DENGAN DEBUG LOG ---"
sed -i '/eventId = res.body.data.id;/a \    console.log("🔍 Created event ID:", eventId);' tests/integration/events.test.ts

# Tambahkan expect setelah event creation
sed -i '/expect(res.status).toBe(201);/a \    expect(eventId).toBeDefined();' tests/integration/events.test.ts

echo "✅ Debug logs added"
echo ""

echo "--- 2. RUN TEST DENGAN VERBOSE ---"
npx jest tests/integration/events.test.ts --verbose 2>&1 | head -100

echo ""
echo "=========================================="
echo "  SELESAI                               "
echo "=========================================="
