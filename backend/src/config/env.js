"use strict";

/**
 * Application configuration loaded from environment variables via dotenv.
 * Mirrors the original pydantic-settings `Settings` object so every value is
 * typed/defaulted at startup. Import `settings` anywhere config is needed.
 */

require("dotenv").config();

function bool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function splitCsv(value, fallback) {
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ENV = process.env.ENV || "development";

const settings = {
  // ---- App ----
  ENV,
  APP_NAME: process.env.APP_NAME || "Placera",
  API_V1_PREFIX: process.env.API_V1_PREFIX || "/api/v1",
  DEBUG: bool(process.env.DEBUG, true),
  PORT: int(process.env.PORT, 8000),
  HOST: process.env.HOST || "0.0.0.0",

  // ---- Security / JWT ----
  SECRET_KEY: process.env.SECRET_KEY || "change-me",
  ALGORITHM: process.env.ALGORITHM || "HS256",
  ACCESS_TOKEN_EXPIRE_MINUTES: int(process.env.ACCESS_TOKEN_EXPIRE_MINUTES, 15),
  REFRESH_TOKEN_EXPIRE_DAYS: int(process.env.REFRESH_TOKEN_EXPIRE_DAYS, 7),

  // ---- Mongo ----
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017",
  MONGODB_DB: process.env.MONGODB_DB || "placera",

  // ---- Redis ----
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379/0",

  // ---- Cloudinary ----
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // ---- CORS ----
  CORS_ORIGINS: splitCsv(process.env.CORS_ORIGINS, ["http://localhost:5173"]),

  // ---- Seed ----
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "admin@placera.io",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",

  get isProduction() {
    return ENV.toLowerCase() === "production";
  },
};

module.exports = { settings };
