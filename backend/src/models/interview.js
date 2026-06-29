"use strict";

/** Interview scheduling document. Mirrors app/models/interview.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions, subSchemaOptions } = require("./plugins");
const { InterviewType, InterviewStatus, values } = require("./enums");

const feedbackSchema = new Schema(
  {
    interviewer_id: { type: String, required: true },
    rating: { type: Number, default: 0 },
    recommendation: { type: String, default: "maybe" }, // yes | no | maybe
    notes: { type: String, default: null },
  },
  subSchemaOptions
);

const interviewSchema = new Schema(
  {
    application_id: { type: String, required: true },
    job_id: { type: String, required: true },
    company_id: { type: String, required: true },
    student_id: { type: String, required: true },
    scheduled_by: { type: String, required: true },
    type: { type: String, enum: values(InterviewType), default: InterviewType.TECHNICAL },
    mode: { type: String, default: "video" },
    start_at: { type: Date, required: true },
    duration_min: { type: Number, default: 45 },
    meeting_url: { type: String, default: null },
    panel: { type: [String], default: [] },
    status: { type: String, enum: values(InterviewStatus), default: InterviewStatus.SCHEDULED },
    feedback: { type: [feedbackSchema], default: [] },
  },
  baseSchemaOptions()
);

interviewSchema.index({ student_id: 1, start_at: 1 });
interviewSchema.index({ company_id: 1, start_at: 1 });

const Interview = mongoose.model("Interview", interviewSchema, "interviews");

module.exports = { Interview };
