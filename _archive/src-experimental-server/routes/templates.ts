import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  thesisTemplate: z.string(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  structure: z.any().optional(),
  isPublic: z.boolean().default(true),
});

// Get all templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get single template
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Create template
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createTemplateSchema.parse(req.body);

    const template = await prisma.template.create({
      data: {
        ...data,
        creatorId: req.user!.userId,
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

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Use template to create debate
router.post('/:id/use', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = z.object({
      title: z.string().min(5),
      description: z.string().optional(),
    }).parse(req.body);

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Create debate from template
    const debate = await prisma.debate.create({
      data: {
        title,
        description,
        thesis: template.thesisTemplate,
        tags: template.tags,
        category: template.categories[0],
        templateId: id,
        authorId: req.user!.userId,
      },
    });

    // Update template usage count
    await prisma.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    res.status(201).json(debate);
  } catch (error) {
    next(error);
  }
});

export default router;
