"use strict";

const express = require("express");
const ctrl = require("../controllers/adminController");
const { requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { Role } = require("../models/enums");
const { statusUpdateSchema, decisionSchema } = require("../validators/miscValidators");

const router = express.Router();

router.get("/users", requireRole(Role.ADMIN), ctrl.listUsers);
router.patch(
  "/users/:user_id/status",
  requireRole(Role.ADMIN),
  validate(statusUpdateSchema),
  ctrl.setUserStatus
);
router.get("/recruiters/pending", requireRole(Role.ADMIN), ctrl.pendingRecruiters);
router.post(
  "/recruiters/:profile_id/verify",
  requireRole(Role.ADMIN),
  validate(decisionSchema),
  ctrl.verifyRecruiter
);
router.get("/companies/pending", requireRole(Role.ADMIN), ctrl.pendingCompanies);
router.post(
  "/companies/:company_id/approve",
  requireRole(Role.ADMIN),
  validate(decisionSchema),
  ctrl.approveCompany
);
router.get("/jobs/moderation", requireRole(Role.ADMIN), ctrl.moderationQueue);
router.post(
  "/jobs/:job_id/moderate",
  requireRole(Role.ADMIN),
  validate(decisionSchema),
  ctrl.moderateJob
);

module.exports = router;
