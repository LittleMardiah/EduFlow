#!/bin/bash

echo "=========================================="
echo "  CEK MODEL EVENT DI SCHEMA             "
echo "=========================================="
echo ""

echo "--- Model Event (full) ---"
grep -A 50 "^model Event" prisma/schema.prisma || echo "❌ Model Event tidak ditemukan"
echo ""

echo "--- Model EventParticipant ---"
grep -A 30 "^model EventParticipant" prisma/schema.prisma || echo "❌ Model EventParticipant tidak ditemukan"
echo ""

echo "--- Model Analytics ---"
grep -A 30 "^model Analytics" prisma/schema.prisma || echo "❌ Model Analytics tidak ditemukan"
echo ""

echo "--- Model Notification ---"
grep -A 30 "^model Notification" prisma/schema.prisma || echo "❌ Model Notification tidak ditemukan"
echo ""

echo "=========================================="
echo "  SELESAI                              "
echo "=========================================="
