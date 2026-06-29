"use strict";

/**
 * Domain exceptions + the uniform error envelope.
 * Mirrors app/core/exceptions.py. Every AppError renders as:
 *   { "error": { "code": <CODE>, "message": <msg>, "details": {...} } }
 */

class AppError extends Error {
  constructor(message, { details = {}, statusCode = 400, code = "APP_ERROR" } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details || {};
  }
}

class NotFoundError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: 404, code: "NOT_FOUND" });
  }
}

class ConflictError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: 409, code: "CONFLICT" });
  }
}

class UnauthorizedError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: 401, code: "UNAUTHORIZED" });
  }
}

class ForbiddenError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: 403, code: "FORBIDDEN" });
  }
}

class ValidationError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: 400, code: "VALIDATION_ERROR" });
  }
}

class RateLimitError extends AppError {
  constructor(message, opts = {}) {
    super(message, { ...opts, statusCode: 429, code: "RATE_LIMITED" });
  }
}

function envelope(code, message, details = {}) {
  return { error: { code, message, details: details || {} } };
}

module.exports = {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  envelope,
};
