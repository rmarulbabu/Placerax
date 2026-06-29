"use strict";

/** Job posting, moderation, search, and recommendations.
 * Mirrors app/services/job_service.py. */

const { Job, Company, RecruiterProfile, StudentProfile } = require("../models");
const { ApprovalStatus, JobStatus } = require("../models/enums");
const { uniqueSlug } = require("../utils/slug");
const { Cache } = require("../config/redis");
const aiEngine = require("../utils/aiEngine");
const { ForbiddenError, NotFoundError, ValidationError } = require("../utils/errors");

/** Build a Mongo query from search filters (parity with JobRepository.build_query). */
function buildJobQuery({
  q = null,
  type = null,
  workplace = null,
  skills = null,
  location = null,
  company_id = null,
  status = JobStatus.PUBLISHED,
} = {}) {
  const query = {};
  if (status) query.status = status;
  if (q) query.$text = { $search: q };
  if (type) query.type = type;
  if (workplace) query.workplace = workplace;
  if (skills && skills.length) query.skills = { $in: skills.map((s) => s.toLowerCase()) };
  if (location) query.location = { $regex: location, $options: "i" };
  if (company_id) query.company_id = company_id;
  return query;
}

async function assertCanPost(recruiter) {
  const profile = await RecruiterProfile.findOne({ user_id: String(recruiter.id) });
  if (!profile || !profile.company_id) {
    throw new ValidationError("Create a company workspace before posting jobs.");
  }
  if (!profile.verified) {
    throw new ForbiddenError("Your recruiter account must be verified to post jobs.");
  }
  const company = await Company.findById(profile.company_id);
  if (!company || company.approval_status !== ApprovalStatus.APPROVED) {
    throw new ForbiddenError("Your company must be approved before posting jobs.");
  }
  return profile.company_id;
}

async function create(data, recruiter) {
  const companyId = await assertCanPost(recruiter);
  const job = await Job.create({
    company_id: companyId,
    posted_by: String(recruiter.id),
    slug: uniqueSlug(data.title),
    title: data.title,
    type: data.type,
    workplace: data.workplace,
    location: data.location ?? null,
    description: data.description,
    responsibilities: data.responsibilities || [],
    requirements: data.requirements || [],
    skills: (data.skills || []).map((s) => s.toLowerCase()),
    experience_level: data.experience_level,
    salary: data.salary,
    openings: data.openings,
    deadline: data.deadline ?? null,
    status: JobStatus.DRAFT,
  });
  return job;
}

async function getBySlug(slug) {
  const job = await Job.findOne({ slug });
  if (!job) throw new NotFoundError("Job not found.");
  await Job.updateOne({ _id: job.id }, { $inc: { "stats.views": 1 } });
  return job;
}

async function owned(jobId, recruiter) {
  const job = await Job.findById(jobId);
  if (!job) throw new NotFoundError("Job not found.");
  if (job.posted_by !== String(recruiter.id) && job.company_id !== recruiter.company_id) {
    throw new ForbiddenError("You cannot manage this job.");
  }
  return job;
}

async function update(jobId, data, recruiter) {
  await owned(jobId, recruiter);
  const changes = { ...data };
  if (Array.isArray(changes.skills)) {
    changes.skills = changes.skills.map((s) => s.toLowerCase());
  }
  const job = await Job.findById(jobId);
  job.set(changes);
  await job.save();
  return job;
}

async function publish(jobId, recruiter) {
  await owned(jobId, recruiter);
  // goes to moderation queue before being publicly listed
  return Job.findByIdAndUpdate(
    jobId,
    { $set: { status: JobStatus.PENDING_MODERATION } },
    { new: true }
  );
}

async function close(jobId, recruiter) {
  await owned(jobId, recruiter);
  return Job.findByIdAndUpdate(jobId, { $set: { status: JobStatus.CLOSED } }, { new: true });
}

async function listForCompany(companyId) {
  if (!companyId) return [];
  return Job.find({ company_id: companyId }).sort({ created_at: -1 }).limit(200);
}

async function search({ limit = 20, skip = 0, ...filters } = {}) {
  const query = buildJobQuery(filters);
  const items = await Job.find(query).sort({ created_at: -1 }).skip(skip).limit(limit);
  const total = await Job.countDocuments(query);
  return {
    items: items.map((j) => j.toJSON()),
    total,
    limit,
    skip,
    has_more: skip + items.length < total,
  };
}

async function recommendForStudent(userId, { limit = 12 } = {}) {
  const cacheKey = `reco:jobs:${userId}`;
  const cached = await Cache.get(cacheKey);
  if (cached) return cached;

  const profile = await StudentProfile.findOne({ user_id: userId });
  const skills = profile ? profile.skills : [];
  const prefs = profile ? profile.preferences : null;

  const query = buildJobQuery({ status: JobStatus.PUBLISHED });
  if (skills && skills.length) query.skills = { $in: skills };
  if (prefs && prefs.job_types && prefs.job_types.length) query.type = { $in: prefs.job_types };

  let candidates = await Job.find(query).sort({ created_at: -1 }).limit(60);
  if (!candidates.length) {
    candidates = await Job.find({ status: JobStatus.PUBLISHED })
      .sort({ created_at: -1 })
      .limit(limit);
  }

  const ranked = candidates.map((job) => {
    const score = aiEngine.matchScore(skills, job.skills, job.description);
    const data = job.toJSON();
    data.match_score = score;
    return data;
  });
  ranked.sort((a, b) => b.match_score - a.match_score);
  const result = ranked.slice(0, limit);
  await Cache.set(cacheKey, result, 600);
  return result;
}

module.exports = {
  buildJobQuery,
  assertCanPost,
  create,
  getBySlug,
  owned,
  update,
  publish,
  close,
  listForCompany,
  search,
  recommendForStudent,
};
