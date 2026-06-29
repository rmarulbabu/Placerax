"use strict";

const jobService = require("../services/jobService");
const applicationService = require("../services/applicationService");
const asyncHandler = require("../utils/asyncHandler");

const searchJobs = asyncHandler(async (req, res) => {
  const { q, type, workplace, location, skills } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = parseInt(req.query.skip, 10) || 0;
  const skillList = skills ? String(skills).split(",") : null;
  const result = await jobService.search({
    q,
    type,
    workplace,
    location,
    skills: skillList,
    limit,
    skip,
  });
  res.json(result);
});

const myCompanyJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.listForCompany(req.user.company_id);
  res.json(jobs.map((j) => j.toJSON()));
});

const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getBySlug(req.params.slug);
  res.json(job.toJSON());
});

const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.create(req.body, req.user);
  res.status(201).json(job.toJSON());
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.update(req.params.job_id, req.body, req.user);
  res.json(job.toJSON());
});

const publishJob = asyncHandler(async (req, res) => {
  const job = await jobService.publish(req.params.job_id, req.user);
  res.json(job.toJSON());
});

const closeJob = asyncHandler(async (req, res) => {
  const job = await jobService.close(req.params.job_id, req.user);
  res.json(job.toJSON());
});

const jobApplicants = asyncHandler(async (req, res) => {
  const apps = await applicationService.listForJob(req.params.job_id, req.user);
  res.json(apps.map((a) => a.toJSON()));
});

module.exports = {
  searchJobs,
  myCompanyJobs,
  getJob,
  createJob,
  updateJob,
  publishJob,
  closeJob,
  jobApplicants,
};
