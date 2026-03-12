import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createMediaSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  url: z.string().url().optional(),
  mediaType: z.enum(['BOOK', 'VIDEO', 'ARTICLE', 'IMAGE', 'PODCAST', 'DOCUMENTARY', 'PAPER', 'WEBSITE']),
  thumbnailUrl: z.string().url().optional(),
  author: z.string().optional(),
  publishDate: z.string().datetime().optional(),
  isbn: z.string().optional(),
  duration: z.number().optional(),
  sourceUrl: z.string().url().optional(),
  credibilityScore: z.number().min(0).max(1).optional(),
  biasScore: z.number().min(-1).max(1).optional(),
});

const updateMediaSchema = createMediaSchema.partial();

// Get all media
router.get('/', async (req, res, next) => {
  try {
    const { type, search } = req.query;

    const where: any = {};

    if (type) {
      where.mediaType = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { author: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const media = await prisma.media.findMany({
      where,
      include: {
        creator: {
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

    res.json(media);
  } catch (error) {
    next(error);
  }
});

// Get single media item
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        arguments: {
          include: {
            argument: {
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
            },
          },
        },
      },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    res.json(media);
  } catch (error) {
    next(error);
  }
});

// Create media
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createMediaSchema.parse(req.body);

    const media = await prisma.media.create({
      data: {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
        authorId: req.user!.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
});

// Update media
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateMediaSchema.parse(req.body);

    // Check ownership
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    if (media.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.media.update({
      where: { id },
      data: {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
      },
      include: {
        creator: {
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

// Delete media
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    if (media.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.media.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Link media to argument
router.post('/:mediaId/link/:argumentId', authenticate, async (req, res, next) => {
  try {
    const { mediaId, argumentId } = req.params;
    const { position, relevance } = z.object({
      position: z.enum(['SUPPORTS', 'REFUTES', 'NEUTRAL']),
      relevance: z.number().min(0).max(1).optional(),
    }).parse(req.body);

    // Verify media and argument exist
    const [media, argument] = await Promise.all([
      prisma.media.findUnique({ where: { id: mediaId } }),
      prisma.argument.findUnique({ where: { id: argumentId } }),
    ]);

    if (!media || !argument) {
      throw new AppError('Media or argument not found', 404);
    }

    // Create link
    const link = await prisma.argumentMedia.create({
      data: {
        mediaId,
        argumentId,
        position,
        relevance,
      },
      include: {
        media: true,
        argument: true,
      },
    });

    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
});

export default router;
