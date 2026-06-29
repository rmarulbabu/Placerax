"use strict";

const Joi = require("joi");

const educationSchema = Joi.object({
  institution: Joi.string().required(),
  degree: Joi.string().required(),
  field: Joi.string().allow(null),
  start: Joi.number().integer().allow(null),
  end: Joi.number().integer().allow(null),
  cgpa: Joi.number().allow(null),
});

const experienceSchema = Joi.object({
  company: Joi.string().required(),
  title: Joi.string().required(),
  start: Joi.date().allow(null),
  end: Joi.date().allow(null),
  summary: Joi.string().allow(null),
});

const projectSchema = Joi.object({
  title: Joi.string().required(),
  url: Joi.string().allow(null),
  description: Joi.string().allow(null),
});

const preferencesSchema = Joi.object({
  roles: Joi.array().items(Joi.string()).default([]),
  locations: Joi.array().items(Joi.string()).default([]),
  job_types: Joi.array().items(Joi.string()).default([]),
});

const companyCreateSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  website: Joi.string().allow(null, ""),
  industry: Joi.string().allow(null, ""),
  size: Joi.string().allow(null, ""),
  about: Joi.string().allow(null, ""),
  locations: Joi.array().items(Joi.string()).default([]),
});

const companyUpdateSchema = Joi.object({
  name: Joi.string(),
  logo_url: Joi.string().allow(null, ""),
  website: Joi.string().allow(null, ""),
  industry: Joi.string().allow(null, ""),
  size: Joi.string().allow(null, ""),
  about: Joi.string().allow(null, ""),
  locations: Joi.array().items(Joi.string()),
});

const studentProfileUpdateSchema = Joi.object({
  headline: Joi.string().allow(null, ""),
  location: Joi.string().allow(null, ""),
  phone: Joi.string().allow(null, ""),
  education: Joi.array().items(educationSchema),
  experience: Joi.array().items(experienceSchema),
  skills: Joi.array().items(Joi.string()),
  projects: Joi.array().items(projectSchema),
  links: Joi.object().pattern(Joi.string(), Joi.string()),
  preferences: preferencesSchema,
});

const onboardingSchema = Joi.object({
  headline: Joi.string().required(),
  location: Joi.string().required(),
  skills: Joi.array().items(Joi.string()).required(),
  education: Joi.array().items(educationSchema).default([]),
  preferences: preferencesSchema.default({ roles: [], locations: [], job_types: [] }),
});

module.exports = {
  companyCreateSchema,
  companyUpdateSchema,
  studentProfileUpdateSchema,
  onboardingSchema,
};
