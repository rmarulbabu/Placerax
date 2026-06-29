"use strict";

/** Company workspace management. Mirrors app/services/company_service.py. */

const { Company, RecruiterProfile, User } = require("../models");
const { uniqueSlug } = require("../utils/slug");
const { ForbiddenError, NotFoundError } = require("../utils/errors");

async function create(data, recruiter) {
  const company = await Company.create({
    name: data.name,
    slug: uniqueSlug(data.name),
    website: data.website ?? null,
    industry: data.industry ?? null,
    size: data.size ?? null,
    about: data.about ?? null,
    locations: data.locations || [],
    owner_id: String(recruiter.id),
    team: [String(recruiter.id)],
  });

  // bind recruiter to company
  await User.updateOne({ _id: recruiter.id }, { $set: { company_id: String(company.id) } });
  const profile = await RecruiterProfile.findOne({ user_id: String(recruiter.id) });
  if (profile) {
    profile.company_id = String(company.id);
    await profile.save();
  }
  return company;
}

async function getBySlug(slug) {
  const company = await Company.findOne({ slug });
  if (!company) throw new NotFoundError("Company not found.");
  return company;
}

async function update(companyId, data, recruiter) {
  const company = await Company.findById(companyId);
  if (!company) throw new NotFoundError("Company not found.");
  if (company.owner_id !== String(recruiter.id)) {
    throw new ForbiddenError("Only the company owner can edit this workspace.");
  }
  company.set(data);
  await company.save();
  return company;
}

module.exports = { create, getBySlug, update };
