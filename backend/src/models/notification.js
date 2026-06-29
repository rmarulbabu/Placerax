"use strict";

/** Notification + session + saved-job documents. Mirrors app/models/notification.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions } = require("./plugins");

const notificationSchema = new Schema(
  {
    user_id: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: null },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  baseSchemaOptions()
);

notificationSchema.index({ user_id: 1, read: 1, created_at: -1 });

const sessionSchema = new Schema(
  {
    user_id: { type: String, required: true },
    jti: { type: String, required: true, unique: true },
    user_agent: { type: String, default: null },
    ip: { type: String, default: null },
    revoked: { type: Boolean, default: false },
    expires_at: { type: Date, required: true },
  },
  baseSchemaOptions()
);

sessionSchema.index({ user_id: 1 });
// TTL index — documents auto-expire at `expires_at` (expireAfterSeconds: 0).
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const savedJobSchema = new Schema(
  {
    student_id: { type: String, required: true },
    job_id: { type: String, required: true },
  },
  baseSchemaOptions()
);

savedJobSchema.index({ student_id: 1, job_id: 1 }, { unique: true });

const Notification = mongoose.model("Notification", notificationSchema, "notifications");
const Session = mongoose.model("Session", sessionSchema, "sessions");
const SavedJob = mongoose.model("SavedJob", savedJobSchema, "saved_jobs");

module.exports = { Notification, Session, SavedJob };
