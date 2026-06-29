"use strict";

/** Job posting document. Mirrors app/models/job.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions, subSchemaOptions } = require("./plugins");
const { JobType, Workplace, JobStatus, DEFAULT_PIPELINE, values } = require("./enums");

const salarySchema = new Schema(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, default: "INR" },
    period: { type: String, default: "month" }, // month | year | hour | stipend
  },
  subSchemaOptions
);

const statsSchema = new Schema(
  {
    views: { type: Number, default: 0 },
    applicants: { type: Number, default: 0 },
  },
  subSchemaOptions
);

const jobSchema = new Schema(
  {
    company_id: { type: String, required: true },
    posted_by: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: values(JobType), default: JobType.INTERNSHIP },
    workplace: { type: String, enum: values(Workplace), default: Workplace.REMOTE },
    location: { type: String, default: null },
    description: { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    experience_level: { type: String, default: "entry" },
    salary: { type: salarySchema, default: () => ({}) },
    openings: { type: Number, default: 1 },
    deadline: { type: Date, default: null },
    status: { type: String, enum: values(JobStatus), default: JobStatus.DRAFT },
    pipeline_stages: { type: [String], default: () => [...DEFAULT_PIPELINE] },
    stats: { type: statsSchema, default: () => ({}) },
  },
  baseSchemaOptions()
);

jobSchema.index({ status: 1, type: 1, workplace: 1 });
jobSchema.index({ company_id: 1, status: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ created_at: -1 });
jobSchema.index({ title: "text", description: "text", skills: "text" });

const Job = mongoose.model("Job", jobSchema, "jobs");

module.exports = { Job };
