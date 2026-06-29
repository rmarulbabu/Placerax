"use strict";

const dashboardService = require("../services/dashboardService");
const applicationService = require("../services/applicationService");
const asyncHandler = require("../utils/asyncHandler");

const studentDashboard = asyncHandler(async (req, res) => {
  res.json(await dashboardService.student(String(req.user.id)));
});

const recruiterDashboard = asyncHandler(async (req, res) => {
  res.json(await dashboardService.recruiter(req.user.company_id));
});

const adminDashboard = asyncHandler(async (req, res) => {
  res.json(await dashboardService.admin());
});

const hiringFunnel = asyncHandler(async (req, res) => {
  const { job_id: jobId } = req.params;
  const result = await applicationService.pipeline(jobId, req.user);
  const funnel = {};
  for (const [stage, items] of Object.entries(result.board)) {
    funnel[stage] = items.length;
  }
  res.json({ job_id: jobId, funnel });
});

module.exports = { studentDashboard, recruiterDashboard, adminDashboard, hiringFunnel };
