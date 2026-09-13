import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { startJobs } from "./jobs";
import { ensureAchievementCatalog } from "./services/achievementService";

async function main() {
  await connectDB();
  logger.info(`MongoDB connected -> ${env.mongodbUri}`);

  await ensureAchievementCatalog();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`API server listening on ${env.apiUrl} (${env.nodeEnv})`);
  });

  if (!env.isTest) startJobs();

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error", err);
  process.exit(1);
});
