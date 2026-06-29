"use strict";

/**
 * Auth + RBAC middleware. Mirrors get_current_user / require_role from
 * app/core/dependencies.py.
 *
 * - `authenticate` validates the Bearer access token, loads the user (with a
 *   short-lived Redis cache), blocks suspended/banned accounts, and attaches
 *   `req.user`.
 * - `requireRole(...roles)` enforces role-based access after authentication.
 */

const { User } = require("../models");
const { Cache } = require("../config/redis");
const { ACCESS, decodeToken } = require("../utils/security");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");
const { UserStatus } = require("../models/enums");
const asyncHandler = require("../utils/asyncHandler");

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError("Authentication required.");

  const payload = decodeToken(token, { expectedType: ACCESS });
  const userId = payload.sub || "";

  // cache the lightweight identity to avoid a DB hit on every request
  const cacheKey = `user:${userId}`;
  let user = null;
  const cached = await Cache.get(cacheKey);
  if (cached) {
    user = new User(cached);
    user.isNew = false;
  } else {
    user = await User.findById(userId);
    if (!user) throw new UnauthorizedError("User not found.");
    await Cache.set(cacheKey, user.toObject({ virtuals: false }), 30);
  }

  if ([UserStatus.SUSPENDED, UserStatus.BANNED].includes(user.status)) {
    throw new ForbiddenError("Account access has been restricted.");
  }

  req.user = user;
  next();
});

function requireRole(...roles) {
  const allowed = new Set(roles);
  return [
    authenticate,
    (req, _res, next) => {
      if (!allowed.has(req.user.role)) {
        return next(new ForbiddenError("You do not have permission to perform this action."));
      }
      return next();
    },
  ];
}

module.exports = { authenticate, requireRole, extractToken };
