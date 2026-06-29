"use strict";

/**
 * Centralized error handling producing the uniform error envelope.
 * Mirrors register_exception_handlers from app/core/exceptions.py.
 */

const createLogger = require("../config/logger");
const { AppError, envelope } = require("../utils/errors");

const logger = createLogger("placera.error");

/** 404 handler for unmatched routes. */
function notFoundHandler(req, res) {
  res
    .status(404)
    .json(envelope("NOT_FOUND", `Route ${req.method} ${req.path} not found.`));
}

/* eslint-disable no-unused-vars */
function errorHandler(err, _req, res, _next) {
  // Domain errors -> their declared status + code
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(envelope(err.code, err.message, err.details));
  }

  // Joi validation errors raised by the validate middleware
  if (err && err.isJoi) {
    const errors = (err.details || []).map((d) => ({
      loc: d.path,
      msg: d.message,
      type: d.type,
    }));
    return res
      .status(422)
      .json(envelope("UNPROCESSABLE_ENTITY", "Request validation failed.", { errors }));
  }

  // Mongo duplicate key -> conflict
  if (err && err.code === 11000) {
    return res
      .status(409)
      .json(envelope("CONFLICT", "A record with these details already exists.", {
        keys: Object.keys(err.keyValue || {}),
      }));
  }

  // Mongoose validation / cast errors
  if (err && (err.name === "ValidationError" || err.name === "CastError")) {
    return res
      .status(422)
      .json(envelope("UNPROCESSABLE_ENTITY", "Request validation failed.", {
        message: err.message,
      }));
  }

  logger.error("Unhandled error", { error: String(err && err.stack ? err.stack : err) });
  return res.status(500).json(envelope("INTERNAL_ERROR", "An unexpected error occurred."));
}
/* eslint-enable no-unused-vars */

module.exports = { errorHandler, notFoundHandler };
