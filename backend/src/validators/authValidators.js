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

const updateMeSchema = Joi.object({
  full_name: Joi.string().min(2).max(120),
  email: Joi.string().email().lowercase(),
  avatar_url: Joi.string().uri().allow(null, ""),
}).min(1);

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .custom(passwordStrength)
    .required()
    .messages({ "password.strength": "Password must contain letters and numbers." }),
});

const settingsSchema = Joi.object({
  notifications: Joi.object({
    email: Joi.boolean(),
    application_updates: Joi.boolean(),
    interview_alerts: Joi.boolean(),
  }),
  privacy: Joi.object({
    profile_visibility: Joi.string().valid("public", "recruiters", "private"),
    portfolio_visibility: Joi.string().valid("public", "private"),
  }),
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateMeSchema,
  changePasswordSchema,
  settingsSchema,
};
