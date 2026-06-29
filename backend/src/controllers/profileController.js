"use strict";

const profileService = require("../services/profileService");
const { RecruiterProfile } = require("../models");
const asyncHandler = require("../utils/asyncHandler");

const myStudentProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getStudent(String(req.user.id));
  res.json(profile.toJSON());
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateStudent(String(req.user.id), req.body);
  res.json(profile.toJSON());
});

const completeOnboarding = asyncHandler(async (req, res) => {
  const profile = await profileService.completeOnboarding(String(req.user.id), req.body);
  res.json(profile.toJSON());
});

const myRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await RecruiterProfile.findOne({ user_id: String(req.user.id) });
  res.json(profile ? profile.toJSON() : null);
});

module.exports = {
  myStudentProfile,
  updateStudentProfile,
  completeOnboarding,
  myRecruiterProfile,
};
