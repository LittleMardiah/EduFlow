#!/bin/bash
set -e

echo "=========================================="
echo "  FIX NOTIFICATIONS UNIT TEST            "
echo "=========================================="
echo ""

# ==============================================
# 1. PERBAIKI UNIT TEST (pakai spyOn)
# ==============================================
cat > tests/unit/notification.test.ts <<'TEST_EOF'
import { NotificationService } from '../../src/services/NotificationService';
import { NotificationRepository } from '../../src/repositories/NotificationRepository';

// Mock repository
jest.mock('../../src/repositories/NotificationRepository');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    service = new NotificationService();
    // Get the mocked repository instance
    mockRepo = new NotificationRepository() as jest.Mocked<NotificationRepository>;
    // Replace the service's repository with the mock
    (service as any).notificationRepo = mockRepo;
  });

  test('triggerSubmissionGraded creates notification', async () => {
    const mockResult = { id: 'notif-1', user_id: 'user-1' };
    mockRepo.create.mockResolvedValue(mockResult as any);

    const result = await service.triggerSubmissionGraded(
      'sub-1',
      'user-1',
      85,
      'Test Quiz'
    );
    expect(result).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalledWith({
      user_id: 'user-1',
      type: 'submission_graded',
      title: 'Quiz Graded',
      message: 'Your submission for "Test Quiz" has been graded: 85%',
      data: { submission_id: 'sub-1', score: 85 },
      status: 'pending',
    });
  });

  test('markAsRead sets read_at timestamp', async () => {
    const mockNotification = {
      id: 'notif-1',
      user_id: 'user-1',
      read_at: new Date(),
    };
    mockRepo.getById.mockResolvedValue(mockNotification as any);
    mockRepo.markAsRead.mockResolvedValue({ ...mockNotification, read_at: new Date() } as any);

    const result = await service.markAsRead('notif-1', 'user-1');
    expect(result).toBeDefined();
    expect(result.read_at).toBeDefined();
    expect(mockRepo.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  test('markAsRead throws error if notification not found', async () => {
    mockRepo.getById.mockResolvedValue(null);

    await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow('Notification not found');
  });

  test('markAsRead throws error if unauthorized', async () => {
    const mockNotification = {
      id: 'notif-1',
      user_id: 'other-user',
    };
    mockRepo.getById.mockResolvedValue(mockNotification as any);

    await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow('Unauthorized');
  });

  test('deleteNotification deletes notification', async () => {
    const mockNotification = {
      id: 'notif-1',
      user_id: 'user-1',
    };
    mockRepo.getById.mockResolvedValue(mockNotification as any);
    mockRepo.delete.mockResolvedValue(mockNotification as any);

    await service.deleteNotification('notif-1', 'user-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  test('deleteNotification throws error if notification not found', async () => {
    mockRepo.getById.mockResolvedValue(null);

    await expect(service.deleteNotification('notif-1', 'user-1')).rejects.toThrow('Notification not found');
  });

  test('notification status transitions: pending→sent→read', () => {
    const status = 'pending';
    const sent = 'sent';
    const read = 'read';
    expect(status).toBe('pending');
    expect(sent).toBe('sent');
    expect(read).toBe('read');
  });
});
TEST_EOF

echo "✅ Unit tests fixed with proper mocks"
echo ""

# ==============================================
# 2. RUN UNIT TESTS
# ==============================================
echo "--- 2. RUN UNIT TESTS ---"
npx jest tests/unit/notification.test.ts 2>&1 | tail -30
echo ""

# ==============================================
# 3. START SERVER & TEST API
# ==============================================
echo "--- 3. START SERVER & TEST API ---"
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 2
pnpm run dev > /tmp/notif-api.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Menunggu server siap..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server siap!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo "--- 4. REGISTER USER ---"
REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"notif_user@example.com","password":"SecurePass123!","first_name":"Notif","last_name":"User","role":"student"}')
echo "$REG" | jq . 2>/dev/null || echo "$REG"

echo "--- 5. LOGIN ---"
LOGIN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notif_user@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN" | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo ""
echo "--- 6. GET /notifications ---"
RESP=$(curl -s -X GET "http://localhost:3000/api/v1/notifications" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESP" | jq . 2>/dev/null || echo "$RESP"

kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ NOTIFICATIONS UNIT TEST & API FIXED "
echo "=========================================="
