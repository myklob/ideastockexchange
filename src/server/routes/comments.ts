import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createNotification } from '../services/notifications';

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  argumentId: z.string(),
  parentId: z.string().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Get comments for an argument
router.get('/argument/:argumentId', async (req, res, next) => {
  try {
    const { argumentId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        argumentId,
        parentId: null, // Root comments only
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            karma: true,
          },
        },
        children: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                karma: true,
              },
            },
            votes: true,
            _count: {
              select: {
                children: true,
              },
            },
          },
          where: {
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        votes: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: [
        // { votes: { _count: 'desc' } }, // TODO: Implement sorted by votes
        { createdAt: 'desc' },
      ],
    });

    res.json(comments);
  } catch (error) {
    next(error);
  }
});

// Create comment
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { content, argumentId, parentId } = createCommentSchema.parse(req.body);

    // Verify argument exists
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        author: true,
        debate: {
          select: {
            allowComments: true,
            isLocked: true,
          },
        },
      },
    });

    if (!argument) {
      throw new AppError('Argument not found', 404);
    }

    if (!argument.debate.allowComments) {
      throw new AppError('Comments are disabled for this debate', 403);
    }

    if (argument.debate.isLocked) {
      throw new AppError('This debate is locked', 403);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        argumentId,
        parentId,
        authorId: req.user!.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            karma: true,
          },
        },
      },
    });

    // Create notification for argument author
    if (argument.authorId !== req.user!.userId) {
      await createNotification({
        userId: argument.authorId,
        type: 'NEW_COMMENT',
        title: 'New comment on your argument',
        message: `${req.user!.email} commented on your argument`,
        argumentId,
        commentId: comment.id,
        fromUserId: req.user!.userId,
        actionUrl: `/debates/${argument.debateId}`,
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

// Update comment
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = updateCommentSchema.parse(req.body);

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        content,
        isEdited: true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            karma: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete comment
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== req.user!.userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Soft delete
    await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: '[deleted]',
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Vote on comment
router.post('/:id/vote', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteType } = z.object({
      voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
    }).parse(req.body);

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Upsert vote
    await prisma.commentVote.upsert({
      where: {
        userId_commentId: {
          userId: req.user!.userId,
          commentId: id,
        },
      },
      create: {
        userId: req.user!.userId,
        commentId: id,
        voteType,
      },
      update: {
        voteType,
      },
    });

    // Update karma
    const upvotes = await prisma.commentVote.count({
      where: { commentId: id, voteType: 'UPVOTE' },
    });
    const downvotes = await prisma.commentVote.count({
      where: { commentId: id, voteType: 'DOWNVOTE' },
    });

    await prisma.user.update({
      where: { id: comment.authorId },
      data: {
        karma: {
          increment: voteType === 'UPVOTE' ? 1 : -1,
        },
      },
    });

    res.json({ success: true, upvotes, downvotes });
  } catch (error) {
    next(error);
  }
});

export default router;
