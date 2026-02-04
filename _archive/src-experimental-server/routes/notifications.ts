import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get user's notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.userId,
        ...(unreadOnly === 'true' ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread/count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user!.userId,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
