import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import debateRoutes from './routes/debates';
import argumentRoutes from './routes/arguments';
import mediaRoutes from './routes/media';
import authRoutes from './routes/auth';
import commentRoutes from './routes/comments';
import notificationRoutes from './routes/notifications';
import socialRoutes from './routes/social';
import mergeRoutes from './routes/merges';
import moderationRoutes from './routes/moderation';
import draftRoutes from './routes/drafts';
import templateRoutes from './routes/templates';
import userRoutes from './routes/users';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/arguments', argumentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/merges', mergeRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IdeaStockExchange server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
