"use strict";

const adminService = require("../services/adminService");
const asyncHandler = require("../utils/asyncHandler");
const { adminUser } = require("../utils/serialize");

const listUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = parseInt(req.query.skip, 10) || 0;
  const role = req.query.role || null;
  res.json(await adminService.listUsers({ role, limit, skip }));
});

const setUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.setUserStatus(req.params.user_id, req.body.status);
  res.json(adminUser(user));
});

const pendingRecruiters = asyncHandler(async (req, res) => {
  const items = await adminService.pendingRecruiters();
  res.json(items.map((p) => p.toJSON()));
});

const verifyRecruiter = asyncHandler(async (req, res) => {
  const profile = await adminService.verifyRecruiter(req.params.profile_id, req.body.approve);
  res.json(profile.toJSON());
});

const pendingCompanies = asyncHandler(async (req, res) => {
  const items = await adminService.pendingCompanies();
  res.json(items.map((c) => c.toJSON()));
});

const approveCompany = asyncHandler(async (req, res) => {
  const company = await adminService.moderateCompany(req.params.company_id, req.body.approve);
  res.json(company.toJSON());
});

const moderationQueue = asyncHandler(async (req, res) => {
  const items = await adminService.moderationQueue();
  res.json(items.map((j) => j.toJSON()));
});

const moderateJob = asyncHandler(async (req, res) => {
  const job = await adminService.moderateJob(req.params.job_id, req.body.approve);
  res.json(job.toJSON());
});

module.exports = {
  listUsers,
  setUserStatus,
  pendingRecruiters,
  verifyRecruiter,
  pendingCompanies,
  approveCompany,
  moderationQueue,
  moderateJob,
};
