"use strict";

const express = require("express");
const ctrl = require("../controllers/profileController");
const { requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { Role } = require("../models/enums");
const {
  studentProfileUpdateSchema,
  onboardingSchema,
} = require("../validators/companyValidators");

const router = express.Router();

router.get("/student/me", requireRole(Role.STUDENT), ctrl.myStudentProfile);
router.patch(
  "/student/me",
  requireRole(Role.STUDENT),
  validate(studentProfileUpdateSchema),
  ctrl.updateStudentProfile
);
router.post(
  "/student/onboarding",
  requireRole(Role.STUDENT),
  validate(onboardingSchema),
  ctrl.completeOnboarding
);
router.get("/recruiter/me", requireRole(Role.RECRUITER), ctrl.myRecruiterProfile);

module.exports = router;
