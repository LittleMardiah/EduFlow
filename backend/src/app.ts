import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import logger from './utils/logger';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
import questionRoutes from './routes/question.routes';
import optionRoutes from './routes/option.routes';
import submissionRoutes from './routes/submission.routes';
import eventRoutes from './routes/events';
import eventParticipantRoutes from './routes/event-participants';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notifications.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/options', optionRoutes);
app.use('/api/v1', submissionRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/events/:id/participants', eventParticipantRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error handler (harus di akhir)
app.use(errorHandler);

export default app;
