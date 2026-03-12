import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createDebateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

const updateDebateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Get all debates
router.get('/', async (req, res, next) => {
  try {
    const debates = await prisma.debate.findMany({
      where: { isPublic: true },
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(debates);
  } catch (error) {
    next(error);
  }
});

// Get single debate with full argument tree
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const debate = await prisma.debate.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        arguments: {
          where: { parentId: null }, // Root arguments only
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            media: {
              include: {
                media: true,
              },
            },
            _count: {
              select: {
                children: true,
                votes: true,
              },
            },
          },
          orderBy: { reasonRank: 'desc' },
        },
      },
    });

    if (!debate) {
      throw new AppError('Debate not found', 404);
    }

    res.json(debate);
  } catch (error) {
    next(error);
  }
});

// Create debate
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createDebateSchema.parse(req.body);

    const debate = await prisma.debate.create({
      data: {
        ...data,
        authorId: req.user!.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(debate);
  } catch (error) {
    next(error);
  }
});

// Update debate
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateDebateSchema.parse(req.body);

    // Check ownership
    const debate = await prisma.debate.findUnique({
      where: { id },
    });

    if (!debate) {
      throw new AppError('Debate not found', 404);
    }

    if (debate.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.debate.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete debate
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const debate = await prisma.debate.findUnique({
      where: { id },
    });

    if (!debate) {
      throw new AppError('Debate not found', 404);
    }

    if (debate.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.debate.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
