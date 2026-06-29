"use strict";

/**
 * Placera API entrypoint.
 *
 * Boots the HTTP server + Socket.IO, connects to MongoDB (with retry) and
 * Redis (optional), and wires graceful shutdown. Equivalent to the FastAPI
 * lifespan in app/main.py.
 */

const http = require("http");

const { settings } = require("./src/config/env");
const { configureLogging } = require("./src/config/logger");
const createLogger = require("./src/config/logger");
const { connectToMongo, closeMongoConnection } = require("./src/config/db");
const { connectToRedis, closeRedisConnection } = require("./src/config/redis");
const { createApp } = require("./src/app");
const { initSockets } = require("./src/sockets");
const connectionManager = require("./src/sockets/manager");

const logger = createLogger("placera.server");

async function start() {
  configureLogging(settings.DEBUG ? "DEBUG" : "INFO");

  // Connect dependencies (Mongo is required; Redis degrades gracefully).
  await connectToMongo();
  await connectToRedis();

  const app = createApp();
  const server = http.createServer(app);

  initSockets(server);
  await connectionManager.startPubsub();

  server.listen(settings.PORT, settings.HOST, () => {
    logger.info(`${settings.APP_NAME} API listening on http://${settings.HOST}:${settings.PORT}`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close();
    await connectionManager.stopPubsub();
    await closeRedisConnection();
    await closeMongoConnection();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.error(`Fatal startup error: ${String(err && err.stack ? err.stack : err)}`);
  process.exit(1);
});
