"use strict";

/** User identity + role-specific profile documents. Mirrors app/models/user.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions, subSchemaOptions } = require("./plugins");
const {
  Role,
  UserStatus,
  values,
} = require("./enums");

/* ----------------------------- User settings ---------------------------- */
const userSettingsSchema = new Schema(
  {
    notifications: {
      email: { type: Boolean, default: true },
      application_updates: { type: Boolean, default: true },
      interview_alerts: { type: Boolean, default: true },
    },
    privacy: {
      // public | recruiters | private
      profile_visibility: { type: String, default: "recruiters" },
      // public | private
      portfolio_visibility: { type: String, default: "public" },
    },
  },
  subSchemaOptions
);

/* --------------------------------- User --------------------------------- */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: values(Role), default: Role.STUDENT },
    full_name: { type: String, required: true },
    avatar_url: { type: String, default: null },
    status: { type: String, enum: values(UserStatus), default: UserStatus.ACTIVE },
    email_verified: { type: Boolean, default: false },
    onboarding_completed: { type: Boolean, default: false },
    company_id: { type: String, default: null },
    last_login_at: { type: Date, default: null },
    settings: { type: userSettingsSchema, default: () => ({}) },
  },
  baseSchemaOptions()
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ company_id: 1 });

/* ----------------------------- Sub-documents ---------------------------- */
const educationSchema = new Schema(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, default: null },
    start: { type: Number, default: null },
    end: { type: Number, default: null },
    cgpa: { type: Number, default: null },
  },
  subSchemaOptions
);

const experienceSchema = new Schema(
  {
    company: { type: String, required: true },
    title: { type: String, required: true },
    start: { type: Date, default: null },
    end: { type: Date, default: null },
    summary: { type: String, default: null },
  },
  subSchemaOptions
);

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, default: null },
    description: { type: String, default: null },
  },
  subSchemaOptions
);

const preferencesSchema = new Schema(
  {
    roles: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    job_types: { type: [String], default: [] },
  },
  subSchemaOptions
);

/* --------------------------- Student profile ---------------------------- */
const studentProfileSchema = new Schema(
  {
    user_id: { type: String, required: true },
    headline: { type: String, default: null },
    location: { type: String, default: null },
    phone: { type: String, default: null },
    about: { type: String, default: null },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    skills: { type: [String], default: [] },
    projects: { type: [projectSchema], default: [] },
    links: { type: Map, of: String, default: {} },
    preferences: { type: preferencesSchema, default: () => ({}) },
    profile_strength: { type: Number, default: 0 },
    placement_readiness: { type: Number, default: 0 },
    active_resume_id: { type: String, default: null },
  },
  baseSchemaOptions()
);

studentProfileSchema.index({ user_id: 1 }, { unique: true });
studentProfileSchema.index({ skills: 1 });

/* --------------------------- Recruiter profile -------------------------- */
const recruiterProfileSchema = new Schema(
  {
    user_id: { type: String, required: true },
    company_id: { type: String, default: null },
    title: { type: String, default: null },
    verified: { type: Boolean, default: false },
    verification_doc_url: { type: String, default: null },
    permissions: { type: [String], default: () => ["post_jobs", "manage_pipeline"] },
  },
  baseSchemaOptions()
);

recruiterProfileSchema.index({ user_id: 1 }, { unique: true });
recruiterProfileSchema.index({ company_id: 1 });
recruiterProfileSchema.index({ verified: 1 });

const User = mongoose.model("User", userSchema, "users");
const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema, "student_profiles");
const RecruiterProfile = mongoose.model(
  "RecruiterProfile",
  recruiterProfileSchema,
  "recruiter_profiles"
);

module.exports = { User, StudentProfile, RecruiterProfile };
