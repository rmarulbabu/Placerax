"use strict";

/** Company workspace management. Mirrors app/services/company_service.py. */

const { Company, RecruiterProfile, User } = require("../models");
const { ApprovalStatus } = require("../models/enums");
const { uniqueSlug } = require("../utils/slug");
const { Cache } = require("../config/redis");
const { ForbiddenError, NotFoundError } = require("../utils/errors");

function resolveLocations(data) {
  if (Array.isArray(data.locations) && data.locations.length) return data.locations;
  if (data.location) return [data.location];
  return [];
}

async function create(data, recruiter) {
  const company = await Company.create({
    name: data.name,
    slug: uniqueSlug(data.name),
    logo_url: data.logo_url ?? null,
    website: data.website ?? null,
    industry: data.industry ?? null,
    size: data.size ?? null,
    about: data.about ?? null,
    locations: resolveLocations(data),
    linkedin_url: data.linkedin_url ?? null,
    hr_email: data.hr_email ?? null,
    // Self-serve: the workspace is usable immediately so the recruiter can post.
    approval_status: ApprovalStatus.APPROVED,
    owner_id: String(recruiter.id),
    team: [String(recruiter.id)],
  });

  // Bind the recruiter to the company and mark them verified (self-serve).
  await User.updateOne({ _id: recruiter.id }, { $set: { company_id: String(company.id) } });
  const profile = await RecruiterProfile.findOne({ user_id: String(recruiter.id) });
  if (profile) {
    profile.company_id = String(company.id);
    profile.verified = true;
    await profile.save();
  } else {
    await RecruiterProfile.create({
      user_id: String(recruiter.id),
      company_id: String(company.id),
      verified: true,
    });
  }

  // Invalidate the cached identity so req.user.company_id is fresh next request.
  await Cache.delete(`user:${String(recruiter.id)}`);
  return company;
}

async function getBySlug(slug) {
  const company = await Company.findOne({ slug });
  if (!company) throw new NotFoundError("Company not found.");
  return company;
}

/** Return the recruiter's own company (or null if none). */
async function getMine(recruiter) {
  let companyId = recruiter.company_id || null;
  if (!companyId) {
    const profile = await RecruiterProfile.findOne({ user_id: String(recruiter.id) });
    companyId = profile && profile.company_id ? profile.company_id : null;
  }
  let company = companyId ? await Company.findById(companyId) : null;
  if (!company) {
    company = await Company.findOne({ owner_id: String(recruiter.id) });
  }
  return company;
}

async function update(companyId, data, recruiter) {
  const company = await Company.findById(companyId);
  if (!company) throw new NotFoundError("Company not found.");
  if (company.owner_id !== String(recruiter.id)) {
    throw new ForbiddenError("Only the company owner can edit this workspace.");
  }
  if (data.location && !data.locations) {
    data.locations = [data.location];
  }
  delete data.location;
  company.set(data);
  await company.save();
  return company;
}

module.exports = { create, getBySlug, getMine, update };
