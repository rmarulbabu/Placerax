"use strict";

/**
 * Socket.IO connection manager with Redis pub/sub fan-out.
 *
 * Port of app/websockets/manager.py. Each API/WS instance keeps Socket.IO
 * rooms (one room per user id) and subscribes to a Redis channel. When any
 * instance publishes an event for a user, every instance receives it and
 * delivers to whichever local sockets belong to that user — enabling realtime
 * delivery under horizontal scaling. Falls back to local emit when Redis is
 * unavailable.
 */

const Redis = require("ioredis");
const { settings } = require("../config/env");
const { getRedis } = require("../config/redis");
const createLogger = require("../config/logger");

const logger = createLogger("placera.ws");
const CHANNEL = "placera:events";

class ConnectionManager {
  constructor() {
    this.io = null;
    this.subscriber = null;
  }

  /** Wire the Socket.IO server instance. */
  setIo(io) {
    this.io = io;
  }

  /** Register a connected, authenticated socket for a user. */
  connect(userId, socket) {
    socket.join(userId);
    logger.info(`WS connected user=${userId} total=${this.total}`);
  }

  disconnect(userId, socket) {
    socket.leave(userId);
  }

  get total() {
    if (!this.io) return 0;
    return this.io.engine ? this.io.engine.clientsCount : 0;
  }

  /** Deliver a message to all local sockets in the user's room. */
  deliverLocal(userId, message) {
    if (!this.io) return;
    this.io.to(userId).emit(message.event, message.data);
    // also emit a generic envelope for clients that prefer a single channel
    this.io.to(userId).emit("message", message);
  }

  /** Publish to Redis so all instances fan out; fall back to local delivery. */
  async sendToUser(userId, message) {
    const redis = getRedis();
    const envelope = { user_id: userId, message };
    if (redis) {
      try {
        await redis.publish(CHANNEL, JSON.stringify(envelope));
        return;
      } catch {
        /* fall through to local delivery */
      }
    }
    this.deliverLocal(userId, message);
  }

  /** Start the Redis subscriber loop (no-op if Redis is unavailable). */
  async startPubsub() {
    const redis = getRedis();
    if (!redis) return;
    try {
      this.subscriber = new Redis(settings.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      this.subscriber.on("error", () => {
        /* swallow */
      });
      await this.subscriber.subscribe(CHANNEL);
      this.subscriber.on("message", (_channel, raw) => {
        try {
          const payload = JSON.parse(raw);
          this.deliverLocal(payload.user_id, payload.message);
        } catch {
          /* ignore malformed messages */
        }
      });
      logger.info("WS Redis pub/sub subscribed.");
    } catch (err) {
      logger.warning(`WS pub/sub unavailable: ${String(err)}`);
      this.subscriber = null;
    }
  }

  async stopPubsub() {
    if (this.subscriber) {
      try {
        await this.subscriber.quit();
      } catch {
        /* ignore */
      }
      this.subscriber = null;
    }
  }
}

// singleton — shared by services (notificationService) and the socket server
module.exports = new ConnectionManager();
