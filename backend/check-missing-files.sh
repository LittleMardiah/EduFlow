#!/bin/bash
echo "=== Checking missing files ==="
echo ""
echo "--- src/controllers/auth.controller.ts ---"
if [ -f src/controllers/auth.controller.ts ]; then
  cat src/controllers/auth.controller.ts
else
  echo "❌ NOT FOUND - check if file exists:"
  find src -name "*auth*controller*" -o -name "*controller*auth*" 2>/dev/null || echo "No auth controller found"
fi
echo ""
echo "--- Routing files (auth routes) ---"
find src -name "*routes*" -o -name "*router*" 2>/dev/null | head -10 || echo "No route files found"
echo ""
echo "--- src/app.ts (first 60 lines for middleware) ---"
if [ -f src/app.ts ]; then
  head -60 src/app.ts
else
  echo "❌ NOT FOUND"
fi
