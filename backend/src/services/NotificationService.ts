import { NotificationRepository } from '../repositories/NotificationRepository';
import { getQuizById } from '../repositories/quiz.repository';
import { getUserById } from '../repositories/user.repository';
import { EventRepository } from '../repositories/EventRepository';
import { EventParticipantRepository } from '../repositories/EventParticipantRepository';
import logger from '../utils/logger';
import prisma from '../utils/prisma';

const notificationRepo = new NotificationRepository();
const participantRepo = new EventParticipantRepository();
const eventRepo = new EventRepository();

export class NotificationService {
  private async createNotification(
    userId: string,
    type: 'event_reminder' | 'submission_graded' | 'quiz_published' | 'event_started',
    title: string,
    message: string,
    data?: any
  ) {
    try {
      const user = await getUserById(userId);
      if (!user) {
        logger.warn(`User ${userId} not found, skipping notification`);
        return null;
      }

      const notification = await notificationRepo.create({
        user_id: userId,
        type,
        title,
        message,
        data,
      });
      logger.debug(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      logger.error(`Failed to create notification: ${error}`);
      return null;
    }
  }

  async triggerSubmissionGraded(submissionId: string, studentId: string, score: number, quizTitle: string) {
    const title = 'Quiz Graded';
    const message = `Your submission for "${quizTitle}" has been graded: ${score}%`;
    const data = { submission_id: submissionId, score };
    return this.createNotification(studentId, 'submission_graded', title, message, data);
  }

  async triggerQuizPublished(quizId: string, instructorId: string) {
    const quiz = await getQuizById(quizId);
    if (!quiz) {
      logger.warn(`Quiz ${quizId} not found for publication notification`);
      return { created: 0 };
    }

    const title = 'New Quiz Available';
    const message = `"${quiz.title}" is now available for students.`;
    const data = { quiz_id: quizId };

    const students = await prisma.user.findMany({
      where: {
        organization_id: quiz.organization_id,
        role: 'student',
        status: 'active',
      },
      select: { id: true },
    });

    let created = 0;
    for (const student of students) {
      const result = await this.createNotification(student.id, 'quiz_published', title, message, data);
      if (result) created++;
    }

    logger.info(`Quiz publication notification sent to ${created} students`);
    return { created };
  }

  async triggerEventStarted(eventId: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      logger.warn(`Event ${eventId} not found for started notification`);
      return { created: 0 };
    }

    const participants = await participantRepo.findByEvent(eventId);
    if (!participants.length) {
      logger.info(`No participants for event ${eventId}, skipping notification`);
      return { created: 0 };
    }

    const title = 'Event Started';
    const message = `"${event.title}" has started. Go to event to take the quiz.`;
    const data = { event_id: eventId, quiz_id: event.quiz_id };

    let created = 0;
    for (const p of participants) {
      if (p.status === 'withdrew') continue;
      const result = await this.createNotification(p.student_id, 'event_started', title, message, data);
      if (result) created++;
    }

    logger.info(`Event started notification sent to ${created} participants`);
    return { created };
  }

  async triggerEventReminder(eventId: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      logger.warn(`Event ${eventId} not found for reminder notification`);
      return { created: 0 };
    }

    const participants = await participantRepo.findByEvent(eventId);
    if (!participants.length) {
      logger.info(`No participants for event ${eventId}, skipping reminder`);
      return { created: 0 };
    }

    const title = 'Event Reminder';
    const message = `"${event.title}" starts in 1 hour. Click to view event details.`;
    const data = { event_id: eventId, quiz_id: event.quiz_id };

    let created = 0;
    for (const p of participants) {
      if (p.status === 'withdrew') continue;
      const result = await this.createNotification(p.student_id, 'event_reminder', title, message, data);
      if (result) created++;
    }

    logger.info(`Event reminder sent to ${created} participants for event ${eventId}`);
    return { created };
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false, limit: number = 20, offset: number = 0) {
    const [notifications, total, unreadCount] = await Promise.all([
      notificationRepo.getByUser(userId, { unread: unreadOnly, limit, offset }),
      notificationRepo.getTotalCount(userId),
      notificationRepo.getUnreadCount(userId),
    ]);

    return {
      notifications,
      total,
      unread_count: unreadCount,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await notificationRepo.getById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.user_id !== userId) {
      throw new Error('Unauthorized');
    }
    return notificationRepo.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepo.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await notificationRepo.getById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.user_id !== userId) {
      throw new Error('Unauthorized');
    }
    return notificationRepo.delete(notificationId, userId);
  }
}

export const notificationService = new NotificationService();
