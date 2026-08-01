import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import { env } from './config/env';
import logger from './utils/logger';
import { errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
// Import nested routers for questions and options inside quiz routes
import questionRoutes from './routes/question.routes';
import optionRoutes from './routes/option.routes';

const app = express();
const PORT = env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);

// Quiz routes with nested question and option routes
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/quizzes/:quizId/questions', questionRoutes);
app.use('/api/v1/questions/:questionId/options', optionRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   Auth: http://localhost:${PORT}/api/v1/auth`);
  logger.info(`   Quiz: http://localhost:${PORT}/api/v1/quizzes`);
});

export default app;
