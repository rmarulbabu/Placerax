"use strict";

/** Authentication & session orchestration. Mirrors app/services/auth_service.py. */

const { User, StudentProfile, RecruiterProfile, Session } = require("../models");
const { Role, UserStatus } = require("../models/enums");
const {
  REFRESH,
  createAccessToken,
  createRefreshToken,
  decodeToken,
  hashPassword,
  verifyPassword,
} = require("../utils/security");
const { ConflictError, ForbiddenError, UnauthorizedError } = require("../utils/errors");
const { publicUser } = require("../utils/serialize");

function tokenPair(accessToken, refreshToken) {
  return { access_token: accessToken, refresh_token: refreshToken, token_type: "bearer" };
}

async function issueTokens(user, { ip, ua }) {
  const access = createAccessToken({
    userId: String(user.id),
    role: user.role,
    email: user.email,
  });
  const { token: refresh, jti, expiresAt } = createRefreshToken({ userId: String(user.id) });
  await Session.create({
    user_id: String(user.id),
    jti,
    expires_at: expiresAt,
    ip: ip ?? null,
    user_agent: ua ?? null,
  });
  return tokenPair(access, refresh);
}

async function register(data, { ip = null, ua = null } = {}) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new ConflictError("An account with this email already exists.");

  const user = await User.create({
    email: data.email.toLowerCase(),
    password_hash: await hashPassword(data.password),
    full_name: data.full_name,
    role: data.role,
    status: UserStatus.ACTIVE,
  });

  // create the role-specific profile
  if (user.role === Role.STUDENT) {
    await StudentProfile.create({ user_id: String(user.id) });
  } else if (user.role === Role.RECRUITER) {
    await RecruiterProfile.create({ user_id: String(user.id) });
  }

  const tokens = await issueTokens(user, { ip, ua });
  return { user: publicUser(user), tokens };
}

async function login(data, { ip = null, ua = null } = {}) {
  const user = await User.findOne({ email: data.email.toLowerCase() });
  if (!user || !(await verifyPassword(data.password, user.password_hash))) {
    throw new UnauthorizedError("Invalid email or password.");
  }
  if ([UserStatus.SUSPENDED, UserStatus.BANNED].includes(user.status)) {
    throw new ForbiddenError("This account is not permitted to sign in.");
  }

  user.last_login_at = new Date();
  await user.save();
  const tokens = await issueTokens(user, { ip, ua });
  return { user: publicUser(user), tokens };
}

async function refresh(refreshToken) {
  const payload = decodeToken(refreshToken, { expectedType: REFRESH });
  const jti = payload.jti || "";
  const session = await Session.findOne({ jti });
  if (!session || session.revoked) {
    throw new UnauthorizedError("Refresh token is no longer valid.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new UnauthorizedError("User not found.");

  // rotate: revoke old jti and issue a fresh pair
  session.revoked = true;
  await session.save();
  return issueTokens(user, { ip: session.ip, ua: session.user_agent });
}

async function logout(refreshToken) {
  try {
    const payload = decodeToken(refreshToken, { expectedType: REFRESH });
    await Session.updateOne({ jti: payload.jti || "" }, { $set: { revoked: true } });
  } catch (err) {
    if (err instanceof UnauthorizedError) return; // already invalid; treat as logged out
    throw err;
  }
}

module.exports = { register, login, refresh, logout, issueTokens, tokenPair };
