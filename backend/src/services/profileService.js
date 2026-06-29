"use strict";

/** Student & recruiter profile management + strength computation.
 * Mirrors app/services/profile_service.py. */

const { StudentProfile, Resume, Application, User } = require("../models");
const aiEngine = require("../utils/aiEngine");
const { NotFoundError } = require("../utils/errors");

async function getStudent(userId) {
  const profile = await StudentProfile.findOne({ user_id: userId });
  if (!profile) throw new NotFoundError("Student profile not found.");
  return profile;
}

async function recompute(profile) {
  const data = profile.toObject({ flattenMaps: true });
  const strength = aiEngine.profileStrength(data);
  const apps = await Application.countDocuments({ student_id: profile.user_id });
  let resumeAts = 0;
  if (profile.active_resume_id) {
    const resume = await Resume.findById(profile.active_resume_id);
    if (resume) resumeAts = resume.analysis.ats_score;
  }
  const readiness = aiEngine.placementReadiness(data, { applications: apps, resumeAts });
  profile.profile_strength = strength;
  profile.placement_readiness = readiness;
  await profile.save();
  return profile;
}

async function updateStudent(userId, data) {
  const profile = await getStudent(userId);
  const changes = { ...data };
  if (Array.isArray(changes.skills)) {
    changes.skills = changes.skills.map((s) => s.toLowerCase().trim());
  }
  profile.set(changes);
  await profile.save();
  return recompute(profile);
}

async function completeOnboarding(userId, data) {
  const profile = await getStudent(userId);
  profile.set({
    headline: data.headline,
    location: data.location,
    skills: data.skills.map((s) => s.toLowerCase().trim()),
    education: data.education || [],
    preferences: data.preferences || { roles: [], locations: [], job_types: [] },
  });
  await profile.save();
  await User.updateOne({ _id: userId }, { $set: { onboarding_completed: true } });
  return recompute(profile);
}

module.exports = { getStudent, updateStudent, completeOnboarding, recompute };
