"use strict";

/**
 * Seed demo data: admin, recruiters, students, an approved company, and jobs.
 * Port of app/scripts/seed.py.
 *
 * Run with:  npm run seed   (or: node src/scripts/seed.js)
 */

const { settings } = require("../config/env");
const { connectToMongo, closeMongoConnection } = require("../config/db");
const { hashPassword } = require("../utils/security");
const { uniqueSlug } = require("../utils/slug");
const aiEngine = require("../utils/aiEngine");
const {
  User,
  StudentProfile,
  RecruiterProfile,
  Company,
  Job,
  Application,
} = require("../models");
const {
  ApplicationStage,
  ApprovalStatus,
  JobStatus,
  JobType,
  Role,
  UserStatus,
  Workplace,
} = require("../models/enums");

async function seed() {
  await connectToMongo();
  // eslint-disable-next-line no-console
  console.log("Seeding Placera demo data...");

  // ---- Admin ----
  if (!(await User.findOne({ email: settings.SEED_ADMIN_EMAIL.toLowerCase() }))) {
    await User.create({
      email: settings.SEED_ADMIN_EMAIL.toLowerCase(),
      password_hash: await hashPassword(settings.SEED_ADMIN_PASSWORD),
      full_name: "Platform Admin",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    // eslint-disable-next-line no-console
    console.log(`  ✓ admin: ${settings.SEED_ADMIN_EMAIL} / ${settings.SEED_ADMIN_PASSWORD}`);
  }

  // ---- Recruiter + approved company ----
  let recruiter = await User.findOne({ email: "recruiter@acme.ai" });
  if (!recruiter) {
    recruiter = await User.create({
      email: "recruiter@acme.ai",
      password_hash: await hashPassword("Recruiter@123"),
      full_name: "Riya Recruiter",
      role: Role.RECRUITER,
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    const company = await Company.create({
      name: "Acme AI",
      slug: uniqueSlug("Acme AI"),
      industry: "Artificial Intelligence",
      size: "51-200",
      about: "Building applied AI products for the enterprise.",
      locations: ["Bengaluru", "Remote"],
      approval_status: ApprovalStatus.APPROVED,
      owner_id: String(recruiter.id),
      team: [String(recruiter.id)],
    });
    await User.updateOne({ _id: recruiter.id }, { $set: { company_id: String(company.id) } });
    await RecruiterProfile.create({
      user_id: String(recruiter.id),
      company_id: String(company.id),
      title: "Talent Lead",
      verified: true,
    });
    // eslint-disable-next-line no-console
    console.log("  ✓ recruiter@acme.ai / Recruiter@123 (verified, company approved)");

    // ---- Jobs ----
    const seedJobs = [
      ["Software Engineer Intern", JobType.INTERNSHIP, ["python", "react", "fastapi"]],
      ["ML Engineer Intern", JobType.INTERNSHIP, ["python", "pytorch", "ml"]],
      ["Frontend Developer", JobType.FULL_TIME, ["react", "typescript", "tailwind"]],
    ];
    for (const [title, jtype, skills] of seedJobs) {
      await Job.create({
        company_id: String(company.id),
        posted_by: String(recruiter.id),
        title,
        slug: uniqueSlug(title),
        type: jtype,
        workplace: Workplace.REMOTE,
        location: "Bengaluru, IN",
        description:
          `We are hiring a ${title} to join Acme AI. ` +
          "Work on real products with a senior team.",
        responsibilities: ["Ship features", "Collaborate with the team"],
        requirements: ["Strong fundamentals", "Good communication"],
        skills,
        salary: { min: 25000, max: 45000, currency: "INR", period: "month" },
        openings: 2,
        status: JobStatus.PUBLISHED,
      });
    }
    // eslint-disable-next-line no-console
    console.log("  ✓ 3 published jobs");
  }

  // ---- Students ----
  let student = await User.findOne({ email: "ada@uni.edu" });
  if (!student) {
    student = await User.create({
      email: "ada@uni.edu",
      password_hash: await hashPassword("Student@123"),
      full_name: "Ada Lovelace",
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      email_verified: true,
      onboarding_completed: true,
    });
    const skills = ["python", "react", "fastapi", "mongodb", "typescript"];
    const profileData = {
      user_id: String(student.id),
      headline: "CS senior · full-stack & ML",
      location: "Bengaluru, IN",
      skills,
    };
    profileData.profile_strength = aiEngine.profileStrength({
      headline: profileData.headline,
      location: profileData.location,
      skills,
    });
    await StudentProfile.create(profileData);
    // eslint-disable-next-line no-console
    console.log("  ✓ ada@uni.edu / Student@123");

    // auto-apply to first job
    const firstJob = await Job.findOne({ status: JobStatus.PUBLISHED });
    if (firstJob) {
      const match = aiEngine.matchScore(skills, firstJob.skills, firstJob.description);
      await Application.create({
        job_id: String(firstJob.id),
        company_id: firstJob.company_id,
        student_id: String(student.id),
        stage: ApplicationStage.SCREENING,
        match_score: match,
        ats_score: match,
        stage_history: [
          { stage: ApplicationStage.APPLIED, by: String(student.id) },
          { stage: ApplicationStage.SCREENING, by: firstJob.posted_by },
        ],
      });
      await Job.updateOne({ _id: firstJob.id }, { $inc: { "stats.applicants": 1 } });
      // eslint-disable-next-line no-console
      console.log("  ✓ sample application");
    }
  }

  // eslint-disable-next-line no-console
  console.log("Done. Start the API with `npm run dev`.");
  await closeMongoConnection();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err);
    process.exit(1);
  });
