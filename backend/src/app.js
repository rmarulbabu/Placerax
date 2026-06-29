"use strict";

/**
 * Express application factory. Mirrors create_app() from app/main.py:
 *   - CORS (credentialed, configurable origins)
 *   - JSON body parsing
 *   - X-Process-Time-ms timing header
 *   - /api/v1 router
 *   - /health and /ready system endpoints
 *   - uniform error envelope handling
 */

const express = require("express");
const cors = require("cors");

const { settings } = require("./config/env");
const { isConnected } = require("./config/db");
const { getRedis } = require("./config/redis");
const apiRouter = require("./routes");
const { timing } = require("./middleware/timing");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.set("trust proxy", true);
  app.disable("x-powered-by");

  app.use(
    cors({
      origin: settings.CORS_ORIGINS,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(timing);

  // System endpoints
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", app: settings.APP_NAME });
  });

  app.get("/ready", async (_req, res) => {
    const checks = { mongo: false, redis: false };
    checks.mongo = isConnected();
    const redis = getRedis();
    if (redis) {
      try {
        await redis.ping();
        checks.redis = true;
      } catch {
        /* redis down */
      }
    }
    const status = checks.mongo ? "ready" : "degraded";
    res.json({ status, checks });
  });

  // Versioned API
  app.use(settings.API_V1_PREFIX, apiRouter);

  // 404 + error envelope
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
