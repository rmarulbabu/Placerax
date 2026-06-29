"use strict";

const express = require("express");
const ctrl = require("../controllers/applicationController");
const { requireRole, authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { Role } = require("../models/enums");
const {
  applicationCreateSchema,
  stageUpdateSchema,
  rankUpdateSchema,
  noteCreateSchema,
} = require("../validators/applicationValidators");

const router = express.Router();

router.post(
  "/applications",
  requireRole(Role.STUDENT),
  validate(applicationCreateSchema),
  ctrl.apply
);
router.get("/applications/me", requireRole(Role.STUDENT), ctrl.myApplications);
router.get("/applications/:application_id", authenticate, ctrl.getApplication);
router.delete("/applications/:application_id", requireRole(Role.STUDENT), ctrl.withdraw);
router.patch(
  "/applications/:application_id/stage",
  requireRole(Role.RECRUITER),
  validate(stageUpdateSchema),
  ctrl.moveStage
);
router.patch(
  "/applications/:application_id/rank",
  requireRole(Role.RECRUITER),
  validate(rankUpdateSchema),
  ctrl.setRank
);
router.post(
  "/applications/:application_id/notes",
  requireRole(Role.RECRUITER),
  validate(noteCreateSchema),
  ctrl.addNote
);
router.get("/pipeline/:job_id", requireRole(Role.RECRUITER), ctrl.pipeline);

module.exports = router;
