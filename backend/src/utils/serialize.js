"use strict";

/**
 * Serialization helpers that match the original Pydantic response schemas.
 */

/** UserPublic shape — never includes password_hash. */
function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    avatar_url: user.avatar_url ?? null,
    status: user.status,
    email_verified: user.email_verified,
    onboarding_completed: user.onboarding_completed,
    company_id: user.company_id ? String(user.company_id) : null,
    settings: user.settings
      ? typeof user.settings.toObject === "function"
        ? user.settings.toObject()
        : user.settings
      : undefined,
  };
}

/** Admin user listing shape — full document minus password_hash. */
function adminUser(user) {
  const obj = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete obj.password_hash;
  return obj;
}

/** Build the standard paginated envelope. */
function page(items, total, limit, skip) {
  return {
    items,
    total,
    limit,
    skip,
    has_more: skip + items.length < total,
  };
}

module.exports = { publicUser, adminUser, page };
