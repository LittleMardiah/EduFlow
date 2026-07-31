import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import { env } from './config/env';
import logger from './utils/logger';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = env.PORT || 3001;

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

// Routes (will be added in Day 6-8)
// app.use('/api/v1/auth', authRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
});

export default app;
