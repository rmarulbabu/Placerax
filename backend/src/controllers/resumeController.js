"use strict";

const resumeService = require("../services/resumeService");
const jobService = require("../services/jobService");
const asyncHandler = require("../utils/asyncHandler");
const { ValidationError } = require("../utils/errors");

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ValidationError("A resume file is required.");
  const resume = await resumeService.upload(
    String(req.user.id),
    req.file.buffer,
    req.file.originalname || "resume.pdf"
  );
  res.status(201).json(resume.toJSON());
});

const listResumes = asyncHandler(async (req, res) => {
  const resumes = await resumeService.list(String(req.user.id));
  res.json(resumes.map((r) => r.toJSON()));
});

const getResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.get(req.params.resume_id, String(req.user.id));
  res.json(resume.toJSON());
});

const activateResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.activate(req.params.resume_id, String(req.user.id));
  res.json(resume.toJSON());
});

const analyzeResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.reanalyze(
    req.params.resume_id,
    String(req.user.id),
    req.query.job_id || null
  );
  res.json(resume.toJSON());
});

const skillGap = asyncHandler(async (req, res) => {
  const result = await resumeService.skillGap(String(req.user.id), req.body.target_skills);
  res.json(result);
});

const roadmap = asyncHandler(async (req, res) => {
  const result = await resumeService.roadmap(
    String(req.user.id),
    req.body.target_role,
    req.body.target_skills
  );
  res.json(result);
});

const jobRecommendations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 12;
  const result = await jobService.recommendForStudent(String(req.user.id), { limit });
  res.json(result);
});

module.exports = {
  uploadResume,
  listResumes,
  getResume,
  activateResume,
  analyzeResume,
  skillGap,
  roadmap,
  jobRecommendations,
};
