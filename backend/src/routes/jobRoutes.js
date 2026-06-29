"use strict";

const express = require("express");
const ctrl = require("../controllers/jobController");
const { requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { Role } = require("../models/enums");
const { jobCreateSchema, jobUpdateSchema } = require("../validators/jobValidators");

const router = express.Router();

// public search
router.get("/", ctrl.searchJobs);

// recruiter management — registered before "/:slug" so it isn't shadowed
router.get("/manage/mine", requireRole(Role.RECRUITER), ctrl.myCompanyJobs);

router.post("/", requireRole(Role.RECRUITER), validate(jobCreateSchema), ctrl.createJob);

// recruiter actions on a specific job (multi-segment, no conflict with "/:slug")
router.patch("/:job_id", requireRole(Role.RECRUITER), validate(jobUpdateSchema), ctrl.updateJob);
router.post("/:job_id/publish", requireRole(Role.RECRUITER), ctrl.publishJob);
router.post("/:job_id/close", requireRole(Role.RECRUITER), ctrl.closeJob);
router.get("/:job_id/applicants", requireRole(Role.RECRUITER), ctrl.jobApplicants);

// public job detail by slug (single segment) — keep last
router.get("/:slug", ctrl.getJob);

module.exports = router;
