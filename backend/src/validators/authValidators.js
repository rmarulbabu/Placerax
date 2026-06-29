"use strict";

const Joi = require("joi");
const { Role } = require("../models/enums");

const passwordStrength = (value, helpers) => {
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return helpers.error("password.strength");
  }
  return value;
};

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .custom(passwordStrength)
    .required()
    .messages({ "password.strength": "Password must contain letters and numbers." }),
  full_name: Joi.string().min(2).max(120).required(),
  // Admin accounts cannot be self-registered (omitted from valid set).
  role: Joi.string().valid(Role.STUDENT, Role.RECRUITER).default(Role.STUDENT),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema, refreshSchema };
