import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get user profile
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        website: true,
        location: true,
        karma: true,
        reputation: true,
        isVerified: true,
        isModerator: true,
        createdAt: true,
        emailVisible: true,
        email: true,
        _count: {
          select: {
            debates: true,
            arguments: true,
            media: true,
            follows: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Hide email if not visible
    if (!user.emailVisible) {
      delete (user as any).email;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { bio, avatarUrl, website, location, emailVisible, profilePublic } = z.object({
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      website: z.string().url().optional(),
      location: z.string().max(100).optional(),
      emailVisible: z.boolean().optional(),
      profilePublic: z.boolean().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        bio,
        avatarUrl,
        website,
        location,
        emailVisible,
        profilePublic,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        website: true,
        location: true,
        karma: true,
        reputation: true,
        emailVisible: true,
        profilePublic: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user's activity
router.get('/:username/activity', async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const [debates, arguments, comments] = await Promise.all([
      prisma.debate.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.argument.findMany({
        where: { authorId: user.id, isDeleted: false },
        include: {
          debate: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.comment.findMany({
        where: { authorId: user.id, isDeleted: false },
        include: {
          argument: {
            select: {
              id: true,
              content: true,
              debate: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      debates,
      arguments,
      comments,
    });
  } catch (error) {
    next(error);
  }
});

// Get user achievements
router.get('/:username/achievements', async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const achievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    res.json(achievements);
  } catch (error) {
    next(error);
  }
});

// Get leaderboard
router.get('/leaderboard/karma', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    const users = await prisma.user.findMany({
      where: {
        profilePublic: true,
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        karma: true,
        reputation: true,
        _count: {
          select: {
            debates: true,
            arguments: true,
          },
        },
      },
      orderBy: { karma: 'desc' },
      take: Number(limit),
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
