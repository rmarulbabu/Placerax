"use strict";

/** Resume upload, parsing, analysis, and AI career tools.
 * Mirrors app/services/resume_service.py. */

const { Resume, StudentProfile, Job } = require("../models");
const { uploadFile } = require("../utils/storage");
const aiEngine = require("../utils/aiEngine");
const { NotFoundError } = require("../utils/errors");

/** Best-effort text extraction. PDF parsing is pluggable; here we decode text. */
function extractText(content) {
  try {
    return Buffer.isBuffer(content) ? content.toString("utf-8") : String(content || "");
  } catch {
    return "";
  }
}

async function upload(studentId, content, filename) {
  const url = await uploadFile(content, { folder: `resumes/${studentId}`, filename });
  const text = extractText(content);
  const profile = await StudentProfile.findOne({ user_id: studentId });
  const skills = profile ? profile.skills : [];

  const analysis = aiEngine.analyzeResume(text, skills);
  const resume = await Resume.create({
    student_id: studentId,
    file_url: url,
    file_name: filename,
    parsed: { text: text.slice(0, 20000), skills },
    analysis,
  });
  return resume;
}

async function list(studentId) {
  return Resume.find({ student_id: studentId }).sort({ created_at: -1 }).limit(50);
}

async function get(resumeId, studentId) {
  const resume = await Resume.findById(resumeId);
  if (!resume || resume.student_id !== studentId) {
    throw new NotFoundError("Resume not found.");
  }
  return resume;
}

async function activate(resumeId, studentId) {
  await get(resumeId, studentId);
  await Resume.updateMany({ student_id: studentId }, { $set: { is_active: false } });
  await Resume.updateOne({ _id: resumeId }, { $set: { is_active: true } });
  const profile = await StudentProfile.findOne({ user_id: studentId });
  if (profile) {
    profile.active_resume_id = resumeId;
    await profile.save();
  }
  return Resume.findById(resumeId);
}

async function reanalyze(resumeId, studentId, jobId = null) {
  const resume = await get(resumeId, studentId);
  let jobSkills = null;
  if (jobId) {
    const job = await Job.findById(jobId);
    jobSkills = job ? job.skills : null;
  }
  const profile = await StudentProfile.findOne({ user_id: studentId });
  const skills = profile ? profile.skills : (resume.parsed && resume.parsed.skills) || [];
  const analysis = aiEngine.analyzeResume(
    (resume.parsed && resume.parsed.text) || "",
    skills,
    jobSkills
  );
  await Resume.updateOne({ _id: resumeId }, { $set: { analysis } });
  return Resume.findById(resumeId);
}

async function skillGap(studentId, targetSkills) {
  const profile = await StudentProfile.findOne({ user_id: studentId });
  return aiEngine.skillGap(profile ? profile.skills : [], targetSkills);
}

async function roadmap(studentId, targetRole, targetSkills) {
  const profile = await StudentProfile.findOne({ user_id: studentId });
  const skills = profile ? profile.skills : [];
  const gap = aiEngine.skillGap(skills, targetSkills);
  return aiEngine.careerRoadmap(targetRole, skills, gap.missing);
}

module.exports = { upload, list, get, activate, reanalyze, skillGap, roadmap };
