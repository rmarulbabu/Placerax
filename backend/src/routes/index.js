"use strict";

/** Aggregates every v1 router under a single Express router (parity with router.py). */

const express = require("express");

const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const companyRoutes = require("./companyRoutes");
const jobRoutes = require("./jobRoutes");
const applicationRoutes = require("./applicationRoutes");
const resumeRoutes = require("./resumeRoutes");
const savedJobRoutes = require("./savedJobRoutes");
const notificationRoutes = require("./notificationRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/companies", companyRoutes);
router.use("/jobs", jobRoutes);
router.use("/saved-jobs", savedJobRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

// routers whose endpoints are defined with absolute paths
router.use("/", applicationRoutes);
router.use("/", resumeRoutes);
router.use("/", dashboardRoutes);

module.exports = router;
