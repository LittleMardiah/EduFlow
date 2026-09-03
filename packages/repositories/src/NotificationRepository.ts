import { prisma } from "@eduflow/database";
import { NotificationStatus } from "@eduflow/database";
import { logger } from "@eduflow/core";

export interface CreateNotificationDTO {
  user_id: string;
  type: "event_reminder" | "submission_graded" | "quiz_published" | "event_started";
  title: string;
  message: string;
  data?: any;
  status?: NotificationStatus;
}

export class NotificationRepository {
  async create(data: CreateNotificationDTO) {
    return prisma.notification.create({
      data: {
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        status: data.status || "pending",
        sent_at: new Date(),
      },
    });
  }

  async getByUser(
    userId: string,
    filters?: { unread?: boolean; limit?: number; offset?: number }
  ) {
    const where: any = { user_id: userId };
    if (filters?.unread) {
      where.read_at = null;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: filters?.offset || 0,
      take: filters?.limit || 20,
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        user_id: userId,
        read_at: null,
      },
    });
  }

  async getTotalCount(userId: string) {
    return prisma.notification.count({
      where: { user_id: userId },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, user_id: userId },
      data: { read_at: new Date(), status: "read" },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        user_id: userId,
        read_at: null,
      },
      data: { read_at: new Date(), status: "read" },
    });
  }

  async delete(notificationId: string, userId: string) {
    return prisma.notification.delete({
      where: { id: notificationId, user_id: userId },
    });
  }

  async getById(notificationId: string) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
    });
  }
}