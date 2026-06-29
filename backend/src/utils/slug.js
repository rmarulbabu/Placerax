"use strict";

/** Small cross-cutting helpers — mirrors app/core/utils.py. */

const crypto = require("crypto");

function slugify(text) {
  const base = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

function uniqueSlug(text) {
  return `${slugify(text)}-${crypto.randomBytes(3).toString("hex")}`;
}

module.exports = { slugify, uniqueSlug };
