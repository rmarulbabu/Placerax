"use strict";

const express = require("express");
const ctrl = require("../controllers/companyController");
const { requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { Role } = require("../models/enums");
const { companyCreateSchema, companyUpdateSchema } = require("../validators/companyValidators");

const router = express.Router();

router.post("/", requireRole(Role.RECRUITER), validate(companyCreateSchema), ctrl.createCompany);
// "mine" must be registered before the "/:slug" param route so it isn't shadowed.
router.get("/mine", requireRole(Role.RECRUITER), ctrl.myCompany);
router.get("/:slug", ctrl.getCompany);
router.patch(
  "/:company_id",
  requireRole(Role.RECRUITER),
  validate(companyUpdateSchema),
  ctrl.updateCompany
);

module.exports = router;
