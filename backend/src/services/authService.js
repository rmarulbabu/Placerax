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
const { Cache } = require("../config/redis");

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

/** Update the current user's account fields (name, email, avatar). */
async function updateMe(user, data) {
  if (data.email && data.email.toLowerCase() !== user.email) {
    const email = data.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing && String(existing.id) !== String(user.id)) {
      throw new ConflictError("That email is already in use.");
    }
    user.email = email;
    user.email_verified = false;
  }
  if (data.full_name !== undefined) user.full_name = data.full_name;
  if (data.avatar_url !== undefined) user.avatar_url = data.avatar_url;
  await user.save();
  await Cache.delete(`user:${String(user.id)}`);
  return publicUser(user);
}

/** Change the current user's password after verifying the old one. */
async function changePassword(user, currentPassword, newPassword) {
  const fresh = await User.findById(user.id);
  if (!fresh || !(await verifyPassword(currentPassword, fresh.password_hash))) {
    throw new UnauthorizedError("Current password is incorrect.");
  }
  fresh.password_hash = await hashPassword(newPassword);
  await fresh.save();
  await Cache.delete(`user:${String(user.id)}`);
}

/** Merge notification/privacy preferences into the user's settings. */
async function updateSettings(user, incoming) {
  const fresh = await User.findById(user.id);
  if (!fresh) throw new UnauthorizedError("User not found.");
  const current = fresh.settings ? fresh.settings.toObject() : {};
  const merged = {
    notifications: { ...(current.notifications || {}), ...(incoming.notifications || {}) },
    privacy: { ...(current.privacy || {}), ...(incoming.privacy || {}) },
  };
  fresh.settings = merged;
  await fresh.save();
  await Cache.delete(`user:${String(user.id)}`);
  return publicUser(fresh);
}

/** List the user's active (non-revoked, non-expired) sessions. */
async function listSessions(userId) {
  const now = new Date();
  const sessions = await Session.find({
    user_id: userId,
    revoked: false,
    expires_at: { $gt: now },
  })
    .sort({ created_at: -1 })
    .limit(50);
  return sessions.map((s) => ({
    id: String(s.id),
    user_agent: s.user_agent ?? null,
    ip: s.ip ?? null,
    created_at: s.created_at,
    expires_at: s.expires_at,
  }));
}

/** Revoke every session for the user (logout on all devices). */
async function logoutAll(userId) {
  await Session.updateMany(
    { user_id: userId, revoked: false },
    { $set: { revoked: true } }
  );
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  issueTokens,
  tokenPair,
  updateMe,
  changePassword,
  updateSettings,
  listSessions,
  logoutAll,
};
