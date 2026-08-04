import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import logger from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
import questionRoutes from './routes/question.routes';
import optionRoutes from './routes/option.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - fallback aman untuk development/test
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/options', optionRoutes);

// Error handler
app.use(errorHandler);

export default app;
