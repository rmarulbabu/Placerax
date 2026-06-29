"use strict";

const Joi = require("joi");
const { ApplicationStage, values } = require("../models/enums");

const qaItemSchema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required(),
});

const applicationCreateSchema = Joi.object({
  job_id: Joi.string().required(),
  resume_id: Joi.string().allow(null),
  cover_letter: Joi.string().allow(null, ""),
  answers: Joi.array().items(qaItemSchema).default([]),
});

const stageUpdateSchema = Joi.object({
  stage: Joi.string()
    .valid(...values(ApplicationStage))
    .required(),
});

const rankUpdateSchema = Joi.object({
  ranking: Joi.number().integer().min(0).required(),
});

const noteCreateSchema = Joi.object({
  body: Joi.string().min(1).max(2000).required(),
});

module.exports = {
  applicationCreateSchema,
  stageUpdateSchema,
  rankUpdateSchema,
  noteCreateSchema,
};
