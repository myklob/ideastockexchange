import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateReasonRank } from '../services/reasonRank';

const router = Router();

const createArgumentSchema = z.object({
  content: z.string().min(10).max(5000),
  debateId: z.string(),
  parentId: z.string().optional(),
  position: z.enum(['PRO', 'CON', 'NEUTRAL']).default('NEUTRAL'),
  mediaIds: z.array(z.object({
    mediaId: z.string(),
    position: z.enum(['SUPPORTS', 'REFUTES', 'NEUTRAL']),
    relevance: z.number().min(0).max(1).optional(),
  })).optional(),
});

const updateArgumentSchema = z.object({
  content: z.string().min(10).max(5000).optional(),
  position: z.enum(['PRO', 'CON', 'NEUTRAL']).optional(),
});

const scoreArgumentSchema = z.object({
  truthScore: z.number().min(0).max(1).optional(),
  importanceScore: z.number().min(0).max(1).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
});

// Get argument with children
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const argument = await prisma.argument.findUnique({
      where: { id },
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
        children: {
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
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!argument) {
      throw new AppError('Argument not found', 404);
    }

    res.json(argument);
  } catch (error) {
    next(error);
  }
});

// Create argument
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { content, debateId, parentId, position, mediaIds } =
      createArgumentSchema.parse(req.body);

    // Verify debate exists
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
    });

    if (!debate) {
      throw new AppError('Debate not found', 404);
    }

    // If has parent, verify parent exists
    if (parentId) {
      const parent = await prisma.argument.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new AppError('Parent argument not found', 404);
      }
    }

    // Create argument with media
    const argument = await prisma.argument.create({
      data: {
        content,
        debateId,
        parentId,
        position,
        authorId: req.user!.userId,
        media: mediaIds ? {
          create: mediaIds.map(m => ({
            mediaId: m.mediaId,
            position: m.position,
            relevance: m.relevance,
          })),
        } : undefined,
      },
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
      },
    });

    // Calculate initial ReasonRank
    await calculateReasonRank(argument.id);

    res.status(201).json(argument);
  } catch (error) {
    next(error);
  }
});

// Update argument
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateArgumentSchema.parse(req.body);

    // Check ownership
    const argument = await prisma.argument.findUnique({
      where: { id },
    });

    if (!argument) {
      throw new AppError('Argument not found', 404);
    }

    if (argument.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.argument.update({
      where: { id },
      data,
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
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Score argument (truth, importance, relevance)
router.post('/:id/score', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const scores = scoreArgumentSchema.parse(req.body);

    const argument = await prisma.argument.findUnique({
      where: { id },
    });

    if (!argument) {
      throw new AppError('Argument not found', 404);
    }

    // Update scores
    const updated = await prisma.argument.update({
      where: { id },
      data: scores,
    });

    // Recalculate ReasonRank
    await calculateReasonRank(id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Vote on argument
router.post('/:id/vote', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteType } = z.object({
      voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
    }).parse(req.body);

    const argument = await prisma.argument.findUnique({
      where: { id },
    });

    if (!argument) {
      throw new AppError('Argument not found', 404);
    }

    // Upsert vote
    await prisma.vote.upsert({
      where: {
        userId_argumentId: {
          userId: req.user!.userId,
          argumentId: id,
        },
      },
      create: {
        userId: req.user!.userId,
        argumentId: id,
        voteType,
      },
      update: {
        voteType,
      },
    });

    // Recalculate ReasonRank after vote
    await calculateReasonRank(id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete vote
router.delete('/:id/vote', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.vote.deleteMany({
      where: {
        userId: req.user!.userId,
        argumentId: id,
      },
    });

    // Recalculate ReasonRank after vote removal
    await calculateReasonRank(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
