"use strict";

const { SavedJob, Job } = require("../models");
const asyncHandler = require("../utils/asyncHandler");
const { ConflictError, NotFoundError } = require("../utils/errors");

const listSaved = asyncHandler(async (req, res) => {
  const items = await SavedJob.find({ student_id: String(req.user.id) })
    .sort({ created_at: -1 })
    .limit(100);
  const result = [];
  for (const item of items) {
    const job = await Job.findById(item.job_id);
    if (job) result.push(job.toJSON());
  }
  res.json(result);
});

const saveJob = asyncHandler(async (req, res) => {
  const { job_id: jobId } = req.params;
  if (!(await Job.findById(jobId))) throw new NotFoundError("Job not found.");
  const existing = await SavedJob.findOne({ student_id: String(req.user.id), job_id: jobId });
  if (existing) throw new ConflictError("Job already saved.");
  await SavedJob.create({ student_id: String(req.user.id), job_id: jobId });
  res.json({ message: "Job saved." });
});

const unsaveJob = asyncHandler(async (req, res) => {
  await SavedJob.deleteOne({ student_id: String(req.user.id), job_id: req.params.job_id });
  res.json({ message: "Job removed from saved." });
});

module.exports = { listSaved, saveJob, unsaveJob };
