import { NotificationService } from '../../src/services/NotificationService';

// Mock semua dependencies
jest.mock('../../src/repositories/NotificationRepository');
jest.mock('../../src/repositories/quiz.repository');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/EventRepository');
jest.mock('../../src/repositories/EventParticipantRepository');
jest.mock('../../src/utils/prisma');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();

    // Inject mock repository
    const { NotificationRepository } = require('../../src/repositories/NotificationRepository');
    mockRepo = new NotificationRepository();
    (service as any).notificationRepo = mockRepo;

    // Default mock implementations
    mockRepo.create = jest.fn().mockResolvedValue({ id: 'notif-1', user_id: 'user-1' });
    mockRepo.getById = jest.fn().mockResolvedValue({ id: 'notif-1', user_id: 'user-1' });
    mockRepo.markAsRead = jest.fn().mockResolvedValue({ id: 'notif-1', read_at: new Date() });
    mockRepo.delete = jest.fn().mockResolvedValue({ id: 'notif-1' });
    mockRepo.markAllAsRead = jest.fn().mockResolvedValue({ count: 5 });
    mockRepo.getByUser = jest.fn().mockResolvedValue([{ id: 'notif-1' }]);
    mockRepo.getTotalCount = jest.fn().mockResolvedValue(1);
    mockRepo.getUnreadCount = jest.fn().mockResolvedValue(1);
  });

  test('triggerSubmissionGraded creates notification', async () => {
    const result = await service.triggerSubmissionGraded(
      'sub-1',
      'user-1',
      85,
      'Test Quiz'
    );
    expect(result).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalled();
  });

  test('markAsRead sets read_at timestamp', async () => {
    const result = await service.markAsRead('notif-1', 'user-1');
    expect(result).toBeDefined();
    expect(result.read_at).toBeDefined();
  });

  test('markAsRead throws error if notification not found', async () => {
    mockRepo.getById = jest.fn().mockResolvedValue(null);
    await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(
      'Notification not found'
    );
  });

  test('markAsRead throws error if unauthorized', async () => {
    mockRepo.getById = jest.fn().mockResolvedValue({ id: 'notif-1', user_id: 'other-user' });
    await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(
      'Unauthorized'
    );
  });

  test('deleteNotification deletes notification', async () => {
    const result = await service.deleteNotification('notif-1', 'user-1');
    expect(result).toBeDefined();
    expect(mockRepo.delete).toHaveBeenCalled();
  });

  test('deleteNotification throws error if not found', async () => {
    mockRepo.getById = jest.fn().mockResolvedValue(null);
    await expect(service.deleteNotification('notif-1', 'user-1')).rejects.toThrow(
      'Notification not found'
    );
  });

  test('markAllAsRead marks all notifications as read', async () => {
    const result = await service.markAllAsRead('user-1');
    expect(result).toBeDefined();
    expect(result.count).toBe(5);
    expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-1');
  });

  test('getUserNotifications returns formatted result', async () => {
    const result = await service.getUserNotifications('user-1', true, 20, 0);
    expect(result).toHaveProperty('notifications');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('unread_count');
    expect(result.total).toBe(1);
    expect(result.unread_count).toBe(1);
    expect(Array.isArray(result.notifications)).toBe(true);
  });
});
