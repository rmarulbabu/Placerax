"use strict";

const express = require("express");
const ctrl = require("../controllers/dashboardController");
const { requireRole } = require("../middleware/auth");
const { Role } = require("../models/enums");

const router = express.Router();

router.get("/dashboard/student", requireRole(Role.STUDENT), ctrl.studentDashboard);
router.get("/dashboard/recruiter", requireRole(Role.RECRUITER), ctrl.recruiterDashboard);
router.get("/dashboard/admin", requireRole(Role.ADMIN), ctrl.adminDashboard);
router.get("/analytics/funnel/:job_id", requireRole(Role.RECRUITER), ctrl.hiringFunnel);

module.exports = router;
