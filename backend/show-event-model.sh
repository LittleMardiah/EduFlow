#!/bin/bash
echo "=========================================="
echo "  MODEL EVENT - FULL CONTENT            "
echo "=========================================="
echo ""
echo "--- Model Event (25 baris) ---"
grep -A 25 "^model Event" prisma/schema.prisma
echo ""
echo "--- Konteks organization & auditLogs ---"
grep -B 2 -A 2 "organization\|auditLogs" prisma/schema.prisma | grep -A 10 -B 10 "Event"
echo ""
echo "=========================================="
