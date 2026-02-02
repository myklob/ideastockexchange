import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notifications';

const router = Router();

// ============================================================================
// FOLLOW USER
// ============================================================================

// Follow a user
router.post('/follow/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user!.userId) {
      throw new AppError('Cannot follow yourself', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: req.user!.userId,
        followingId: userId,
      },
    });

    // Notify the followed user
    await createNotification({
      userId,
      type: 'FOLLOW',
      title: 'New follower',
      message: `${req.user!.email} started following you`,
      fromUserId: req.user!.userId,
      actionUrl: `/users/${req.user!.userId}`,
    });

    res.status(201).json(follow);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Already following this user', 400));
    }
    next(error);
  }
});

// Unfollow a user
router.delete('/follow/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;

    await prisma.follow.deleteMany({
      where: {
        followerId: req.user!.userId,
        followingId: userId,
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get user's followers
router.get('/users/:userId/followers', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            karma: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(followers.map(f => f.follower));
  } catch (error) {
    next(error);
  }
});

// Get user's following
router.get('/users/:userId/following', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            karma: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(following.map(f => f.following));
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SUBSCRIBE TO DEBATE
// ============================================================================

// Subscribe to debate
router.post('/subscribe/debate/:debateId', authenticate, async (req, res, next) => {
  try {
    const { debateId } = req.params;
    const { notifyOnArgument, notifyOnComment, notifyOnMerge } = z.object({
      notifyOnArgument: z.boolean().default(true),
      notifyOnComment: z.boolean().default(true),
      notifyOnMerge: z.boolean().default(false),
    }).parse(req.body);

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
    });

    if (!debate) {
      throw new AppError('Debate not found', 404);
    }

    const subscription = await prisma.debateSubscription.create({
      data: {
        userId: req.user!.userId,
        debateId,
        notifyOnArgument,
        notifyOnComment,
        notifyOnMerge,
      },
    });

    res.status(201).json(subscription);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('Already subscribed to this debate', 400));
    }
    next(error);
  }
});

// Unsubscribe from debate
router.delete('/subscribe/debate/:debateId', authenticate, async (req, res, next) => {
  try {
    const { debateId } = req.params;

    await prisma.debateSubscription.deleteMany({
      where: {
        userId: req.user!.userId,
        debateId,
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get user's debate subscriptions
router.get('/subscriptions/debates', authenticate, async (req, res, next) => {
  try {
    const subscriptions = await prisma.debateSubscription.findMany({
      where: { userId: req.user!.userId },
      include: {
        debate: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            _count: {
              select: {
                arguments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subscriptions.map(s => s.debate));
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// BLOCK USER
// ============================================================================

// Block a user
router.post('/block/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = z.object({
      reason: z.string().optional(),
    }).parse(req.body);

    if (userId === req.user!.userId) {
      throw new AppError('Cannot block yourself', 400);
    }

    const block = await prisma.userBlock.create({
      data: {
        blockerId: req.user!.userId,
        blockedId: userId,
        reason,
      },
    });

    res.status(201).json(block);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(new AppError('User already blocked', 400));
    }
    next(error);
  }
});

// Unblock a user
router.delete('/block/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: req.user!.userId,
        blockedId: userId,
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get blocked users
router.get('/blocked', authenticate, async (req, res, next) => {
  try {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: req.user!.userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(blocks);
  } catch (error) {
    next(error);
  }
});

export default router;
