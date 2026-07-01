"use strict";

/** Company workspace document. Mirrors app/models/company.py. */

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { baseSchemaOptions } = require("./plugins");
const { ApprovalStatus, values } = require("./enums");

const companySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo_url: { type: String, default: null },
    website: { type: String, default: null },
    industry: { type: String, default: null },
    size: { type: String, default: null },
    about: { type: String, default: null },
    locations: { type: [String], default: [] },
    linkedin_url: { type: String, default: null },
    hr_email: { type: String, default: null },
    approval_status: {
      type: String,
      enum: values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    owner_id: { type: String, required: true },
    team: { type: [String], default: [] },
  },
  baseSchemaOptions()
);

companySchema.index({ approval_status: 1 });
companySchema.index({ name: "text", industry: "text" });

const Company = mongoose.model("Company", companySchema, "companies");

module.exports = { Company };
