"use strict";

/** Dashboard aggregation for each role. Cached per user/role.
 * Mirrors app/services/dashboard_service.py. */

const {
  User,
  StudentProfile,
  Company,
  Job,
  Application,
  Interview,
  Resume,
} = require("../models");
const { ApprovalStatus, JobStatus, UserStatus, Role } = require("../models/enums");
const { Cache } = require("../config/redis");

async function companyStageCounts(companyId) {
  const rows = await Application.aggregate([
    { $match: { company_id: companyId } },
    { $group: { _id: "$stage", count: { $sum: 1 } } },
  ]);
  const out = {};
  for (const row of rows) out[row._id] = row.count;
  return out;
}

async function student(userId) {
  const key = `dash:student:${userId}`;
  const cached = await Cache.get(key);
  if (cached !== null && cached !== undefined) return cached;

  const profile = await StudentProfile.findOne({ user_id: userId });
  const apps = await Application.find({ student_id: userId }).sort({ created_at: -1 }).limit(50);
  const interviews = await Interview.find({ student_id: userId }).sort({ start_at: 1 }).limit(100);

  let activeResumeScore = 0;
  if (profile && profile.active_resume_id) {
    const resume = await Resume.findById(profile.active_resume_id);
    if (resume) activeResumeScore = resume.analysis.score;
  }

  const stageCounts = {};
  for (const a of apps) stageCounts[a.stage] = (stageCounts[a.stage] || 0) + 1;

  const widgets = {
    profile_completion: profile ? profile.profile_strength : 0,
    placement_readiness: profile ? profile.placement_readiness : 0,
    resume_score: activeResumeScore,
    applications_sent: apps.length,
    interview_invites: interviews.length,
    stage_breakdown: stageCounts,
    skills: profile ? profile.skills.slice(0, 12) : [],
  };
  await Cache.set(key, widgets, 60);
  return widgets;
}

async function recruiter(companyId) {
  if (!companyId) {
    return { active_jobs: 0, applicants: 0, funnel: {}, interviews: 0 };
  }
  const key = `dash:recruiter:${companyId}`;
  const cached = await Cache.get(key);
  if (cached !== null && cached !== undefined) return cached;

  const activeJobs = await Job.countDocuments({
    company_id: companyId,
    status: JobStatus.PUBLISHED,
  });
  const applicants = await Application.countDocuments({ company_id: companyId });
  const funnel = await companyStageCounts(companyId);
  const interviews = await Interview.find({ company_id: companyId })
    .sort({ start_at: 1 })
    .limit(200);

  const widgets = {
    active_jobs: activeJobs,
    applicants,
    funnel,
    interview_pipeline: interviews.length,
  };
  await Cache.set(key, widgets, 60);
  return widgets;
}

async function admin() {
  const key = "dash:admin";
  const cached = await Cache.get(key);
  if (cached !== null && cached !== undefined) return cached;

  const totalUsers = await User.countDocuments({});
  const activeUsers = await User.countDocuments({ status: UserStatus.ACTIVE });
  const students = await User.countDocuments({ role: Role.STUDENT });
  const recruiters = await User.countDocuments({ role: Role.RECRUITER });
  const jobsPosted = await Job.countDocuments({});
  const publishedJobs = await Job.countDocuments({ status: JobStatus.PUBLISHED });
  const applications = await Application.countDocuments({});
  const pendingCompanies = await Company.countDocuments({
    approval_status: ApprovalStatus.PENDING,
  });

  const widgets = {
    total_users: totalUsers,
    active_users: activeUsers,
    students,
    recruiters,
    jobs_posted: jobsPosted,
    published_jobs: publishedJobs,
    applications_submitted: applications,
    pending_company_approvals: pendingCompanies,
    // placeholder revenue metric (wire to billing provider in production)
    mrr_estimate: recruiters * 49,
  };
  await Cache.set(key, widgets, 120);
  return widgets;
}

module.exports = { student, recruiter, admin, companyStageCounts };
