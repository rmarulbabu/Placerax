"use strict";

/**
 * Password hashing (bcrypt) and JWT creation/verification.
 * Mirrors app/core/security.py.
 *
 * bcryptjs is wire-compatible with the original passlib/bcrypt hashes, so
 * existing user password hashes continue to verify after the migration.
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { settings } = require("../config/env");
const { UnauthorizedError } = require("./errors");

const ACCESS = "access";
const REFRESH = "refresh";
const BCRYPT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(plain, hashed) {
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}

function createAccessToken({ userId, role, email }) {
  const payload = { sub: userId, role, email, type: ACCESS };
  return jwt.sign(payload, settings.SECRET_KEY, {
    algorithm: settings.ALGORITHM,
    expiresIn: `${settings.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  });
}

/** Returns { token, jti, expiresAt } so the session can be persisted. */
function createRefreshToken({ userId }) {
  const jti = crypto.randomUUID();
  const expiresInDays = settings.REFRESH_TOKEN_EXPIRE_DAYS;
  const payload = { sub: userId, jti, type: REFRESH };
  const token = jwt.sign(payload, settings.SECRET_KEY, {
    algorithm: settings.ALGORITHM,
    expiresIn: `${expiresInDays}d`,
  });
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  return { token, jti, expiresAt };
}

function decodeToken(token, { expectedType = null } = {}) {
  let payload;
  try {
    payload = jwt.verify(token, settings.SECRET_KEY, { algorithms: [settings.ALGORITHM] });
  } catch {
    throw new UnauthorizedError("Invalid or expired token.");
  }
  if (expectedType && payload.type !== expectedType) {
    throw new UnauthorizedError("Incorrect token type.");
  }
  return payload;
}

module.exports = {
  ACCESS,
  REFRESH,
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
};
