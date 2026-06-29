"use strict";

const Joi = require("joi");
const { JobType, Workplace, values } = require("../models/enums");

const salarySchema = Joi.object({
  min: Joi.number().allow(null),
  max: Joi.number().allow(null),
  currency: Joi.string().default("INR"),
  period: Joi.string().default("month"),
});

const jobCreateSchema = Joi.object({
  title: Joi.string().min(3).max(160).required(),
  type: Joi.string()
    .valid(...values(JobType))
    .default(JobType.INTERNSHIP),
  workplace: Joi.string()
    .valid(...values(Workplace))
    .default(Workplace.REMOTE),
  location: Joi.string().allow(null, ""),
  description: Joi.string().min(20).required(),
  responsibilities: Joi.array().items(Joi.string()).default([]),
  requirements: Joi.array().items(Joi.string()).default([]),
  skills: Joi.array().items(Joi.string()).default([]),
  experience_level: Joi.string().default("entry"),
  salary: salarySchema.default({ currency: "INR", period: "month" }),
  openings: Joi.number().integer().min(1).default(1),
  deadline: Joi.date().allow(null),
});

const jobUpdateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  responsibilities: Joi.array().items(Joi.string()),
  requirements: Joi.array().items(Joi.string()),
  skills: Joi.array().items(Joi.string()),
  salary: salarySchema,
  openings: Joi.number().integer(),
  deadline: Joi.date().allow(null),
});

module.exports = { jobCreateSchema, jobUpdateSchema };
