"use strict";

/** Application (core ATS object) document. Mirrors app/models/application.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions, subSchemaOptions } = require("./plugins");
const { ApplicationStage, ApplicationStatus, values } = require("./enums");

const noteSchema = new Schema(
  {
    author_id: { type: String, required: true },
    body: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  subSchemaOptions
);

const stageEventSchema = new Schema(
  {
    stage: { type: String, required: true },
    by: { type: String, default: null },
    at: { type: Date, default: Date.now },
  },
  subSchemaOptions
);

const qaItemSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  subSchemaOptions
);

const applicationSchema = new Schema(
  {
    job_id: { type: String, required: true },
    company_id: { type: String, required: true },
    student_id: { type: String, required: true },
    resume_id: { type: String, default: null },
    stage: { type: String, enum: values(ApplicationStage), default: ApplicationStage.APPLIED },
    status: { type: String, enum: values(ApplicationStatus), default: ApplicationStatus.ACTIVE },
    match_score: { type: Number, default: 0 },
    ats_score: { type: Number, default: 0 },
    cover_letter: { type: String, default: null },
    answers: { type: [qaItemSchema], default: [] },
    ranking: { type: Number, default: null },
    notes: { type: [noteSchema], default: [] },
    stage_history: { type: [stageEventSchema], default: [] },
  },
  baseSchemaOptions()
);

applicationSchema.index({ job_id: 1, stage: 1 });
applicationSchema.index({ student_id: 1, created_at: -1 });
applicationSchema.index({ company_id: 1, status: 1 });
applicationSchema.index({ job_id: 1, student_id: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema, "applications");

module.exports = { Application };
