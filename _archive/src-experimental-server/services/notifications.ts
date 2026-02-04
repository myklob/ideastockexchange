import { prisma } from '../index';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  debateId?: string;
  argumentId?: string;
  commentId?: string;
  fromUserId?: string;
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: params,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notifications shouldn't break the main flow
  }
}

export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
  try {
    return await prisma.notification.createMany({
      data: notifications,
    });
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
  }
}

export async function notifyDebateSubscribers(
  debateId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  message: string,
  argumentId?: string,
  commentId?: string
) {
  try {
    const subscriptions = await prisma.debateSubscription.findMany({
      where: {
        debateId,
        userId: { not: excludeUserId },
        ...(type === 'NEW_ARGUMENT' ? { notifyOnArgument: true } :
            type === 'NEW_COMMENT' ? { notifyOnComment: true } :
            type === 'MERGE_PROPOSAL' || type === 'MERGE_APPROVED' ? { notifyOnMerge: true } :
            {}),
      },
    });

    const notifications = subscriptions.map(sub => ({
      userId: sub.userId,
      type,
      title,
      message,
      debateId,
      argumentId,
      commentId,
      fromUserId: excludeUserId,
      actionUrl: `/debates/${debateId}`,
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Failed to notify debate subscribers:', error);
  }
}
