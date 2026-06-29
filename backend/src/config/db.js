"use strict";

/**
 * MongoDB connection management (Mongoose) with retry logic + index bootstrap.
 *
 * - Connects to MongoDB Atlas (or any Mongo URI) using the Mongoose ODM.
 * - Retries with exponential backoff on transient failures.
 * - Ensures model indexes are built and adds the `activity_logs` index that
 *   has no dedicated model (parity with the original index bootstrap).
 */

const mongoose = require("mongoose");
const { settings } = require("./env");
const createLogger = require("./logger");

const logger = createLogger("placera.db");

let connected = false;

/**
 * Connect to MongoDB with retry/backoff.
 * @param {object} [opts]
 * @param {number} [opts.retries=5] maximum connection attempts
 * @param {number} [opts.delayMs=2000] base delay between attempts
 */
async function connectToMongo({ retries = 5, delayMs = 2000 } = {}) {
  const safeUri = settings.MONGODB_URI.split("@").pop();
  mongoose.set("strictQuery", true);

  // surface connection lifecycle events
  mongoose.connection.on("error", (err) => logger.error("MongoDB error", { error: String(err) }));
  mongoose.connection.on("disconnected", () => logger.warning("MongoDB disconnected."));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected."));

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      logger.info(`Connecting to MongoDB at ${safeUri} (attempt ${attempt})`);
      await mongoose.connect(settings.MONGODB_URI, {
        dbName: settings.MONGODB_DB,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 50,
      });
      connected = true;
      await ensureExtraIndexes();
      logger.info("MongoDB connected and indexes ensured.");
      return mongoose.connection;
    } catch (err) {
      logger.error(`MongoDB connection failed: ${String(err)}`);
      if (attempt >= retries) throw err;
      const wait = delayMs * attempt;
      logger.warning(`Retrying MongoDB connection in ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** Build indexes that aren't owned by a Mongoose model. */
async function ensureExtraIndexes() {
  try {
    await mongoose.connection
      .collection("activity_logs")
      .createIndex({ actor_id: 1, created_at: -1 });
  } catch (err) {
    logger.warning(`Could not ensure activity_logs index: ${String(err)}`);
  }
}

async function closeMongoConnection() {
  if (connected) {
    await mongoose.connection.close();
    connected = false;
    logger.info("MongoDB connection closed.");
  }
}

function getConnection() {
  return mongoose.connection;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectToMongo,
  closeMongoConnection,
  getConnection,
  isConnected,
};
