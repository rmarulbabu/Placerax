"use strict";

/**
 * Structured JSON logging — mirrors the original JsonFormatter output.
 * Usage: const logger = require("./logger")("placera.db"); logger.info("msg", { extra });
 */

const LEVELS = { DEBUG: 10, INFO: 20, WARNING: 30, ERROR: 40 };

let currentLevel = LEVELS.INFO;

function configureLogging(level = "INFO") {
  currentLevel = LEVELS[String(level).toUpperCase()] || LEVELS.INFO;
}

function emit(name, level, message, extra) {
  if (LEVELS[level] < currentLevel) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    logger: name,
    message: typeof message === "string" ? message : String(message),
  };
  if (extra && typeof extra === "object") Object.assign(payload, extra);
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function createLogger(name = "placera") {
  return {
    debug: (msg, extra) => emit(name, "DEBUG", msg, extra),
    info: (msg, extra) => emit(name, "INFO", msg, extra),
    warning: (msg, extra) => emit(name, "WARNING", msg, extra),
    warn: (msg, extra) => emit(name, "WARNING", msg, extra),
    error: (msg, extra) => emit(name, "ERROR", msg, extra),
  };
}

module.exports = createLogger;
module.exports.configureLogging = configureLogging;
