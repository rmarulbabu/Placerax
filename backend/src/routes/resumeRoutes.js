"use strict";

const express = require("express");
const multer = require("multer");
const ctrl = require("../controllers/resumeController");
const { requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { Role } = require("../models/enums");
const { skillGapSchema, roadmapSchema } = require("../validators/miscValidators");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

// Resumes
router.post("/resumes", requireRole(Role.STUDENT), upload.single("file"), ctrl.uploadResume);
router.get("/resumes", requireRole(Role.STUDENT), ctrl.listResumes);
router.get("/resumes/:resume_id", requireRole(Role.STUDENT), ctrl.getResume);
router.post("/resumes/:resume_id/activate", requireRole(Role.STUDENT), ctrl.activateResume);
router.post("/resumes/:resume_id/analyze", requireRole(Role.STUDENT), ctrl.analyzeResume);

// AI career tools
router.post("/ai/skill-gap", requireRole(Role.STUDENT), validate(skillGapSchema), ctrl.skillGap);
router.post("/ai/roadmap", requireRole(Role.STUDENT), validate(roadmapSchema), ctrl.roadmap);
router.get("/ai/recommendations/jobs", requireRole(Role.STUDENT), ctrl.jobRecommendations);

module.exports = router;
