"use strict";

/** Admin moderation, verification, and user management.
 * Mirrors app/services/admin_service.py. */

const { User, RecruiterProfile, Company, Job } = require("../models");
const { ApprovalStatus, JobStatus } = require("../models/enums");
const notificationService = require("./notificationService");
const { NotFoundError } = require("../utils/errors");
const { adminUser, page } = require("../utils/serialize");

async function listUsers({ role = null, limit = 50, skip = 0 } = {}) {
  const query = role ? { role } : {};
  const items = await User.find(query).sort({ created_at: -1 }).skip(skip).limit(limit);
  const total = await User.countDocuments(query);
  return page(items.map(adminUser), total, limit, skip);
}

async function setUserStatus(userId, status) {
  const user = await User.findByIdAndUpdate(userId, { $set: { status } }, { new: true });
  if (!user) throw new NotFoundError("User not found.");
  return user;
}

async function pendingRecruiters() {
  return RecruiterProfile.find({ verified: false }).limit(50);
}

async function verifyRecruiter(profileId, verified = true) {
  const profile = await RecruiterProfile.findByIdAndUpdate(
    profileId,
    { $set: { verified } },
    { new: true }
  );
  if (!profile) throw new NotFoundError("Recruiter profile not found.");
  await notificationService.notify(profile.user_id, {
    type: "recruiter.verified",
    title: verified ? "Recruiter verified" : "Verification declined",
    body: verified ? "You can now post jobs." : "Please resubmit your documents.",
  });
  return profile;
}

async function pendingCompanies() {
  return Company.find({ approval_status: ApprovalStatus.PENDING })
    .sort({ created_at: 1 })
    .limit(50);
}

async function moderateCompany(companyId, approve) {
  const status = approve ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
  const company = await Company.findByIdAndUpdate(
    companyId,
    { $set: { approval_status: status } },
    { new: true }
  );
  if (!company) throw new NotFoundError("Company not found.");
  await notificationService.notify(company.owner_id, {
    type: "company.moderated",
    title: `Company ${status}`,
    body: `${company.name} was ${status}.`,
  });
  return company;
}

async function moderationQueue() {
  return Job.find({ status: JobStatus.PENDING_MODERATION }).sort({ created_at: 1 }).limit(100);
}

async function moderateJob(jobId, approve) {
  const status = approve ? JobStatus.PUBLISHED : JobStatus.REJECTED;
  const job = await Job.findByIdAndUpdate(jobId, { $set: { status } }, { new: true });
  if (!job) throw new NotFoundError("Job not found.");
  await notificationService.notify(job.posted_by, {
    type: "job.moderated",
    title: `Job ${status}`,
    body: `'${job.title}' was ${status}.`,
    link: `/recruiter/jobs/${job.id}`,
  });
  return job;
}

module.exports = {
  listUsers,
  setUserStatus,
  pendingRecruiters,
  verifyRecruiter,
  pendingCompanies,
  moderateCompany,
  moderationQueue,
  moderateJob,
};
