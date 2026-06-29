"use strict";

/**
 * Redis client for caching, rate limiting, and pub/sub fan-out.
 *
 * Designed to degrade gracefully: if Redis is unavailable, the client stays
 * null and the `Cache` helpers return null (miss) instead of throwing, so the
 * API keeps serving from Mongo — identical behaviour to the original backend.
 */

const Redis = require("ioredis");
const { settings } = require("./env");
const createLogger = require("./logger");

const logger = createLogger("placera.redis");

let client = null;

async function connectToRedis() {
  try {
    const c = new Redis(settings.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // do not spin forever if redis is absent
    });
    c.on("error", () => {
      /* swallow — handled by graceful degradation */
    });
    await c.connect();
    await c.ping();
    client = c;
    logger.info("Redis connected.");
  } catch (err) {
    logger.warning(`Redis unavailable (${String(err)}); running without cache.`);
    client = null;
  }
}

async function closeRedisConnection() {
  if (client) {
    try {
      await client.quit();
    } catch {
      /* ignore */
    }
    client = null;
  }
}

function getRedis() {
  return client;
}

/** Thin cache-aside helper used by services. */
const Cache = {
  async get(key) {
    if (!client) return null;
    try {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async set(key, value, ttl = 60) {
    if (!client) return;
    try {
      await client.set(key, JSON.stringify(value), "EX", ttl);
    } catch {
      /* ignore */
    }
  },

  async delete(...keys) {
    if (!client || keys.length === 0) return;
    try {
      await client.del(...keys);
    } catch {
      /* ignore */
    }
  },

  async incrWithTtl(key, ttl) {
    if (!client) return 0;
    try {
      const pipe = client.pipeline();
      pipe.incr(key);
      pipe.expire(key, ttl);
      const results = await pipe.exec();
      return parseInt(results[0][1], 10) || 0;
    } catch {
      return 0;
    }
  },
};

module.exports = {
  connectToRedis,
  closeRedisConnection,
  getRedis,
  Cache,
};
