import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createNotification, notifyDebateSubscribers } from '../services/notifications';
import { findSimilarArguments } from '../services/duplicateDetection';

const router = Router();

// Find potential duplicates
router.get('/duplicates/:argumentId', authenticate, async (req, res, next) => {
  try {
    const { argumentId } = req.params;

    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
    });

    if (!argument) {
      throw new AppError('Argument not found', 404);
    }

    const similar = await findSimilarArguments(argument);

    res.json(similar);
  } catch (error) {
    next(error);
  }
});

// Create merge proposal
router.post('/proposals', authenticate, async (req, res, next) => {
  try {
    const { sourceArgumentId, targetArgumentId, reason } = z.object({
      sourceArgumentId: z.string(),
      targetArgumentId: z.string(),
      reason: z.string().min(10),
    }).parse(req.body);

    if (sourceArgumentId === targetArgumentId) {
      throw new AppError('Cannot merge argument with itself', 400);
    }

    // Verify both arguments exist
    const [source, target] = await Promise.all([
      prisma.argument.findUnique({ where: { id: sourceArgumentId }, include: { author: true } }),
      prisma.argument.findUnique({ where: { id: targetArgumentId }, include: { author: true } }),
    ]);

    if (!source || !target) {
      throw new AppError('One or both arguments not found', 404);
    }

    if (source.debateId !== target.debateId) {
      throw new AppError('Arguments must be in the same debate', 400);
    }

    // Create proposal
    const proposal = await prisma.mergeProposal.create({
      data: {
        sourceArgumentId,
        targetArgumentId,
        proposerId: req.user!.userId,
        reason,
      },
      include: {
        sourceArgument: {
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
        targetArgument: {
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
        proposer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Notify argument authors
    await Promise.all([
      createNotification({
        userId: source.authorId,
        type: 'MERGE_PROPOSAL',
        title: 'Merge proposal for your argument',
        message: `A proposal has been created to merge your argument with another`,
        argumentId: sourceArgumentId,
        fromUserId: req.user!.userId,
        actionUrl: `/debates/${source.debateId}`,
      }),
      createNotification({
        userId: target.authorId,
        type: 'MERGE_PROPOSAL',
        title: 'Merge proposal involving your argument',
        message: `A proposal has been created to merge another argument with yours`,
        argumentId: targetArgumentId,
        fromUserId: req.user!.userId,
        actionUrl: `/debates/${target.debateId}`,
      }),
    ]);

    // Notify debate subscribers
    await notifyDebateSubscribers(
      source.debateId,
      req.user!.userId,
      'MERGE_PROPOSAL',
      'New merge proposal',
      'A merge proposal has been created in this debate',
      sourceArgumentId
    );

    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
});

// Get merge proposals for a debate
router.get('/proposals/debate/:debateId', async (req, res, next) => {
  try {
    const { debateId } = req.params;

    const proposals = await prisma.mergeProposal.findMany({
      where: {
        sourceArgument: {
          debateId,
        },
      },
      include: {
        sourceArgument: {
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
        targetArgument: {
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
        proposer: {
          select: {
            id: true,
            username: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(proposals);
  } catch (error) {
    next(error);
  }
});

// Vote on merge proposal
router.post('/proposals/:id/vote', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approve } = z.object({
      approve: z.boolean(),
    }).parse(req.body);

    const proposal = await prisma.mergeProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new AppError('Merge proposal not found', 404);
    }

    if (proposal.status !== 'PENDING') {
      throw new AppError('This proposal is no longer pending', 400);
    }

    await prisma.mergeVote.upsert({
      where: {
        proposalId_userId: {
          proposalId: id,
          userId: req.user!.userId,
        },
      },
      create: {
        proposalId: id,
        userId: req.user!.userId,
        approve,
      },
      update: {
        approve,
      },
    });

    // Check if we should auto-approve (e.g., 3+ approvals)
    const approvals = await prisma.mergeVote.count({
      where: { proposalId: id, approve: true },
    });

    const rejections = await prisma.mergeVote.count({
      where: { proposalId: id, approve: false },
    });

    let newStatus = proposal.status;

    if (approvals >= 3) {
      newStatus = 'APPROVED';
      await prisma.mergeProposal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          resolvedAt: new Date(),
          resolvedBy: req.user!.userId,
        },
      });
    } else if (rejections >= 3) {
      newStatus = 'REJECTED';
      await prisma.mergeProposal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          resolvedAt: new Date(),
          resolvedBy: req.user!.userId,
        },
      });
    }

    res.json({ success: true, approvals, rejections, status: newStatus });
  } catch (error) {
    next(error);
  }
});

// Execute approved merge
router.post('/proposals/:id/execute', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const proposal = await prisma.mergeProposal.findUnique({
      where: { id },
      include: {
        sourceArgument: true,
        targetArgument: true,
      },
    });

    if (!proposal) {
      throw new AppError('Merge proposal not found', 404);
    }

    if (proposal.status !== 'APPROVED') {
      throw new AppError('Proposal must be approved before execution', 400);
    }

    // Check user is moderator or argument owner
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user?.isModerator &&
        proposal.sourceArgument.authorId !== req.user!.userId &&
        proposal.targetArgument.authorId !== req.user!.userId) {
      throw new AppError('Only moderators or argument owners can execute merges', 403);
    }

    // Execute merge in transaction
    await prisma.$transaction(async (tx) => {
      // Mark source as merged
      await tx.argument.update({
        where: { id: proposal.sourceArgumentId },
        data: {
          status: 'MERGED',
          isDeleted: true,
        },
      });

      // Record merge
      await tx.argumentMerge.create({
        data: {
          fromId: proposal.sourceArgumentId,
          intoId: proposal.targetArgumentId,
          mergedBy: req.user!.userId,
        },
      });

      // Update proposal
      await tx.mergeProposal.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
      });

      // Move children to target
      await tx.argument.updateMany({
        where: { parentId: proposal.sourceArgumentId },
        data: { parentId: proposal.targetArgumentId },
      });

      // Move votes to target (need to handle duplicates)
      const sourceVotes = await tx.vote.findMany({
        where: { argumentId: proposal.sourceArgumentId },
      });

      for (const vote of sourceVotes) {
        await tx.vote.upsert({
          where: {
            userId_argumentId: {
              userId: vote.userId,
              argumentId: proposal.targetArgumentId,
            },
          },
          create: {
            userId: vote.userId,
            argumentId: proposal.targetArgumentId,
            voteType: vote.voteType,
          },
          update: {
            voteType: vote.voteType,
          },
        });
      }

      // Delete source votes
      await tx.vote.deleteMany({
        where: { argumentId: proposal.sourceArgumentId },
      });
    });

    // Notify users
    await notifyDebateSubscribers(
      proposal.sourceArgument.debateId,
      req.user!.userId,
      'MERGE_APPROVED',
      'Arguments merged',
      'Duplicate arguments have been merged',
      proposal.targetArgumentId
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
