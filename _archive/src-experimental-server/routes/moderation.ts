import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notifications';

const router = Router();

// Middleware to check if user is moderator
const requireModerator = async (req: any, res: any, next: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user?.isModerator && !user?.isAdmin) {
    return next(new AppError('Moderator privileges required', 403));
  }

  next();
};

// ============================================================================
// REPORTS
// ============================================================================

// Create report
router.post('/reports', authenticate, async (req, res, next) => {
  try {
    const { targetType, argumentId, commentId, mediaId, userId, reason, description } = z.object({
      targetType: z.enum(['ARGUMENT', 'COMMENT', 'MEDIA', 'USER', 'DEBATE']),
      argumentId: z.string().optional(),
      commentId: z.string().optional(),
      mediaId: z.string().optional(),
      userId: z.string().optional(),
      reason: z.enum(['SPAM', 'HARASSMENT', 'MISINFORMATION', 'OFF_TOPIC', 'INAPPROPRIATE', 'DUPLICATE', 'OTHER']),
      description: z.string().optional(),
    }).parse(req.body);

    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.userId,
        targetType,
        argumentId,
        commentId,
        mediaId,
        userId,
        reason,
        description,
      },
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

// Get reports (moderators only)
router.get('/reports', authenticate, requireModerator, async (req, res, next) => {
  try {
    const { status, targetType } = req.query;

    const reports = await prisma.report.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(targetType ? { targetType: targetType as any } : {}),
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        argument: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Resolve report
router.post('/reports/:id/resolve', authenticate, requireModerator, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution } = z.object({
      status: z.enum(['RESOLVED', 'DISMISSED']),
      resolution: z.string(),
    }).parse(req.body);

    const report = await prisma.report.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedBy: req.user!.userId,
        resolvedAt: new Date(),
      },
    });

    // Notify reporter
    await createNotification({
      userId: report.reporterId,
      type: 'REPORT_RESOLVED',
      title: 'Report resolved',
      message: `Your report has been ${status.toLowerCase()}`,
      actionUrl: '#',
    });

    res.json(report);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MODERATION ACTIONS
// ============================================================================

// Create moderation action
router.post('/actions', authenticate, requireModerator, async (req, res, next) => {
  try {
    const { targetType, targetUserId, argumentId, commentId, debateId, action, reason, duration } = z.object({
      targetType: z.enum(['ARGUMENT', 'COMMENT', 'DEBATE', 'USER', 'MEDIA']),
      targetUserId: z.string().optional(),
      argumentId: z.string().optional(),
      commentId: z.string().optional(),
      debateId: z.string().optional(),
      action: z.enum(['DELETE', 'HIDE', 'LOCK', 'BAN_USER', 'TEMP_BAN', 'MUTE', 'WARNING', 'APPROVE', 'FEATURE']),
      reason: z.string().min(10),
      duration: z.number().optional(),
    }).parse(req.body);

    const moderationAction = await prisma.moderationAction.create({
      data: {
        moderatorId: req.user!.userId,
        targetType,
        targetUserId,
        argumentId,
        commentId,
        debateId,
        action,
        reason,
        duration,
        expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : undefined,
      },
    });

    // Execute the action
    if (action === 'DELETE' && argumentId) {
      await prisma.argument.update({
        where: { id: argumentId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    } else if (action === 'DELETE' && commentId) {
      await prisma.comment.update({
        where: { id: commentId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    } else if (action === 'LOCK' && debateId) {
      await prisma.debate.update({
        where: { id: debateId },
        data: { isLocked: true },
      });
    } else if (action === 'BAN_USER' && targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { isBanned: true },
      });
    } else if (action === 'TEMP_BAN' && targetUserId && duration) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isBanned: true,
          bannedUntil: new Date(Date.now() + duration * 60 * 60 * 1000),
        },
      });
    } else if (action === 'FEATURE' && debateId) {
      await prisma.debate.update({
        where: { id: debateId },
        data: { isFeatured: true },
      });
    }

    // Notify target user if applicable
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        type: 'MODERATION_ACTION',
        title: 'Moderation action taken',
        message: `A moderator has taken action: ${action}`,
        actionUrl: '#',
      });
    }

    res.status(201).json(moderationAction);
  } catch (error) {
    next(error);
  }
});

// Get moderation queue (pending items)
router.get('/queue', authenticate, requireModerator, async (req, res, next) => {
  try {
    const [pendingReports, pendingArguments] = await Promise.all([
      prisma.report.findMany({
        where: { status: 'PENDING' },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
            },
          },
          argument: {
            select: {
              id: true,
              content: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      prisma.argument.findMany({
        where: {
          status: 'PENDING_REVIEW',
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          debate: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
    ]);

    res.json({
      reports: pendingReports,
      arguments: pendingArguments,
      totalPending: pendingReports.length + pendingArguments.length,
    });
  } catch (error) {
    next(error);
  }
});

// Approve argument
router.post('/approve/argument/:id', authenticate, requireModerator, async (req, res, next) => {
  try {
    const { id } = req.params;

    const argument = await prisma.argument.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
      },
    });

    // Notify author
    await createNotification({
      userId: argument.authorId,
      type: 'MODERATION_ACTION',
      title: 'Argument approved',
      message: 'Your argument has been approved and published',
      argumentId: id,
      actionUrl: `/debates/${argument.debateId}`,
    });

    res.json(argument);
  } catch (error) {
    next(error);
  }
});

export default router;
