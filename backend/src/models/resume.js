"use strict";

/** Resume document with parsed content + AI analysis. Mirrors app/models/resume.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions, subSchemaOptions } = require("./plugins");

const analysisSchema = new Schema(
  {
    score: { type: Number, default: 0 },
    ats_score: { type: Number, default: 0 },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    missing_keywords: { type: [String], default: [] },
  },
  subSchemaOptions
);

const resumeSchema = new Schema(
  {
    student_id: { type: String, required: true },
    file_url: { type: String, required: true },
    file_name: { type: String, required: true },
    parsed: { type: Schema.Types.Mixed, default: {} },
    analysis: { type: analysisSchema, default: () => ({}) },
    is_active: { type: Boolean, default: false },
  },
  baseSchemaOptions()
);

resumeSchema.index({ student_id: 1, is_active: 1 });

const Resume = mongoose.model("Resume", resumeSchema, "resumes");

module.exports = { Resume };
