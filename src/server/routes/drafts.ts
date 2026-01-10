import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createDraftSchema = z.object({
  type: z.enum(['DEBATE', 'ARGUMENT', 'COMMENT', 'MEDIA']),
  title: z.string().optional(),
  content: z.string(),
  debateId: z.string().optional(),
  argumentId: z.string().optional(),
  position: z.enum(['PRO', 'CON', 'NEUTRAL']).optional(),
  autoSaved: z.boolean().default(true),
});

// Get user's drafts
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type } = req.query;

    const drafts = await prisma.draft.findMany({
      where: {
        userId: req.user!.userId,
        ...(type ? { type: type as any } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(drafts);
  } catch (error) {
    next(error);
  }
});

// Get single draft
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const draft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!draft) {
      throw new AppError('Draft not found', 404);
    }

    if (draft.userId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    res.json(draft);
  } catch (error) {
    next(error);
  }
});

// Create or update draft
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createDraftSchema.parse(req.body);

    // Check if draft exists for this context
    const existing = await prisma.draft.findFirst({
      where: {
        userId: req.user!.userId,
        type: data.type,
        ...(data.debateId ? { debateId: data.debateId } : {}),
        ...(data.argumentId ? { argumentId: data.argumentId } : {}),
      },
    });

    let draft;
    if (existing) {
      // Update existing draft
      draft = await prisma.draft.update({
        where: { id: existing.id },
        data: {
          content: data.content,
          title: data.title,
          position: data.position,
          autoSaved: data.autoSaved,
        },
      });
    } else {
      // Create new draft
      draft = await prisma.draft.create({
        data: {
          ...data,
          userId: req.user!.userId,
        },
      });
    }

    res.json(draft);
  } catch (error) {
    next(error);
  }
});

// Delete draft
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const draft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!draft) {
      throw new AppError('Draft not found', 404);
    }

    if (draft.userId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.draft.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
