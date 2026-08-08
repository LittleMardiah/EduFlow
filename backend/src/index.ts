import "dotenv/config";
import eventRoutes from "./routes/events";
import app from './app';
import logger from './utils/logger';
import { env } from './config/env';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
});
export default app;
