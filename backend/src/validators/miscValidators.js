"use strict";

const Joi = require("joi");
const { UserStatus, values } = require("../models/enums");

/* ---- Resume / AI career tools ---- */
const skillGapSchema = Joi.object({
  target_skills: Joi.array().items(Joi.string()).required(),
});

const roadmapSchema = Joi.object({
  target_role: Joi.string().required(),
  target_skills: Joi.array().items(Joi.string()).required(),
});

/* ---- Notifications ---- */
const markReadSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).allow(null),
});

/* ---- Admin ---- */
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(...values(UserStatus))
    .required(),
});

const decisionSchema = Joi.object({
  approve: Joi.boolean().default(true),
});

module.exports = {
  skillGapSchema,
  roadmapSchema,
  markReadSchema,
  statusUpdateSchema,
  decisionSchema,
};
