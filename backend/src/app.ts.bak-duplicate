import eventRoutes from "./routes/events";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import eventParticipantRoutes from "./routes/event-participants";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import logger from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import eventParticipantRoutes from "./routes/event-participants";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import quizRoutes from './routes/quiz.routes';
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import eventParticipantRoutes from "./routes/event-participants";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import questionRoutes from './routes/question.routes';
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import eventParticipantRoutes from "./routes/event-participants";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import optionRoutes from './routes/option.routes';
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import eventParticipantRoutes from "./routes/event-participants";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import submissionRoutes from "./routes/submission.routes";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";
import eventParticipantRoutes from "./routes/event-participants";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notifications.routes";

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// @ts-ignore - CORS type mismatch in dev
// @ts-ignore
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/options', optionRoutes);
  app.use("/api/v1", submissionRoutes);

  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/events/:id/participants", eventParticipantRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
app.use(errorHandler);

export default app;
