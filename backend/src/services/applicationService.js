"use strict";

/** Application / ATS pipeline service — the product core.
 * Mirrors app/services/application_service.py. */

const { Application, Job, Resume, StudentProfile } = require("../models");
const { ApplicationStage, ApplicationStatus, JobStatus, Role } = require("../models/enums");
const aiEngine = require("../utils/aiEngine");
const notificationService = require("./notificationService");
const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} = require("../utils/errors");

async function apply(data, student) {
  const job = await Job.findById(data.job_id);
  if (!job) throw new NotFoundError("Job not found.");
  if (job.status !== JobStatus.PUBLISHED) {
    throw new ValidationError("This job is not accepting applications.");
  }

  const existing = await Application.findOne({
    job_id: data.job_id,
    student_id: String(student.id),
  });
  if (existing) throw new ConflictError("You have already applied to this job.");

  const profile = await StudentProfile.findOne({ user_id: String(student.id) });
  const skills = profile ? profile.skills : [];
  const resumeId = data.resume_id || (profile ? profile.active_resume_id : null);

  const match = aiEngine.matchScore(skills, job.skills, job.description);
  let ats = match;
  if (resumeId) {
    const resume = await Resume.findById(resumeId);
    if (resume) {
      const analysis = aiEngine.analyzeResume(
        (resume.parsed && resume.parsed.text) || "",
        skills,
        job.skills
      );
      ats = analysis.ats_score;
    }
  }

  const application = await Application.create({
    job_id: String(job.id),
    company_id: job.company_id,
    student_id: String(student.id),
    resume_id: resumeId,
    stage: ApplicationStage.APPLIED,
    match_score: match,
    ats_score: ats,
    cover_letter: data.cover_letter ?? null,
    answers: data.answers || [],
    stage_history: [{ stage: ApplicationStage.APPLIED, by: String(student.id) }],
  });

  await Job.updateOne({ _id: job.id }, { $inc: { "stats.applicants": 1 } });

  // notify the recruiter who posted the job
  await notificationService.notify(job.posted_by, {
    type: "application.created",
    title: "New applicant",
    body: `${student.full_name} applied to ${job.title}.`,
    link: `/recruiter/jobs/${job.id}/pipeline`,
  });
  return application;
}

async function listForStudent(studentId) {
  return Application.find({ student_id: studentId }).sort({ created_at: -1 }).limit(50);
}

async function get(applicationId, actor) {
  const app = await Application.findById(applicationId);
  if (!app) throw new NotFoundError("Application not found.");
  if (actor.role === Role.STUDENT && app.student_id !== String(actor.id)) {
    throw new ForbiddenError("Not your application.");
  }
  if (actor.role === Role.RECRUITER && app.company_id !== actor.company_id) {
    throw new ForbiddenError("Not your company's application.");
  }
  return app;
}

async function withdraw(applicationId, student) {
  await get(applicationId, student);
  await Application.updateOne(
    { _id: applicationId },
    { $set: { status: ApplicationStatus.WITHDRAWN } }
  );
}

async function listForJob(jobId, recruiter) {
  const job = await Job.findById(jobId);
  if (!job) throw new NotFoundError("Job not found.");
  if (job.company_id !== recruiter.company_id) {
    throw new ForbiddenError("Not your company's job.");
  }
  return Application.find({ job_id: jobId }).sort({ ranking: 1 }).limit(200);
}

async function pipeline(jobId, recruiter) {
  const job = await Job.findById(jobId);
  if (!job) throw new NotFoundError("Job not found.");
  if (job.company_id !== recruiter.company_id) {
    throw new ForbiddenError("Not your company's job.");
  }
  const apps = await Application.find({ job_id: jobId }).sort({ ranking: 1 }).limit(200);
  const board = {};
  for (const stage of job.pipeline_stages) board[stage] = [];
  for (const app of apps) {
    if (!board[app.stage]) board[app.stage] = [];
    board[app.stage].push(app.toJSON());
  }
  return { job_id: jobId, stages: job.pipeline_stages, board };
}

async function moveStage(applicationId, stage, recruiter) {
  const app = await get(applicationId, recruiter);
  await Application.updateOne(
    { _id: applicationId },
    {
      $set: { stage },
      $push: { stage_history: { stage, by: String(recruiter.id), at: new Date() } },
    }
  );
  // notify student of progress
  const stageTitle = stage.charAt(0).toUpperCase() + stage.slice(1);
  await notificationService.notify(app.student_id, {
    type: "application.stage_changed",
    title: "Application update",
    body: `Your application advanced to ${stageTitle}.`,
    link: `/student/applications/${applicationId}`,
  });
  return Application.findById(applicationId);
}

async function setRank(applicationId, ranking, recruiter) {
  await get(applicationId, recruiter);
  return Application.findByIdAndUpdate(applicationId, { $set: { ranking } }, { new: true });
}

async function addNote(applicationId, body, recruiter) {
  await get(applicationId, recruiter);
  await Application.updateOne(
    { _id: applicationId },
    { $push: { notes: { author_id: String(recruiter.id), body, created_at: new Date() } } }
  );
  return Application.findById(applicationId);
}

module.exports = {
  apply,
  listForStudent,
  get,
  withdraw,
  listForJob,
  pipeline,
  moveStage,
  setRank,
  addNote,
};
