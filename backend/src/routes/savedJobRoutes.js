"use strict";

const express = require("express");
const ctrl = require("../controllers/savedJobController");
const { requireRole } = require("../middleware/auth");
const { Role } = require("../models/enums");

const router = express.Router();

router.get("/", requireRole(Role.STUDENT), ctrl.listSaved);
router.post("/:job_id", requireRole(Role.STUDENT), ctrl.saveJob);
router.delete("/:job_id", requireRole(Role.STUDENT), ctrl.unsaveJob);

module.exports = router;
