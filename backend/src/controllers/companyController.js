"use strict";

const companyService = require("../services/companyService");
const asyncHandler = require("../utils/asyncHandler");

const createCompany = asyncHandler(async (req, res) => {
  const company = await companyService.create(req.body, req.user);
  res.status(201).json(company.toJSON());
});

const getCompany = asyncHandler(async (req, res) => {
  const company = await companyService.getBySlug(req.params.slug);
  res.json(company.toJSON());
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await companyService.update(req.params.company_id, req.body, req.user);
  res.json(company.toJSON());
});

module.exports = { createCompany, getCompany, updateCompany };
