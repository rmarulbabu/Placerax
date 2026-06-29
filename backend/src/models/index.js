"use strict";

/** Barrel export for all Mongoose models. */

const { User, StudentProfile, RecruiterProfile } = require("./user");
const { Company } = require("./company");
const { Job } = require("./job");
const { Application } = require("./application");
const { Resume } = require("./resume");
const { Interview } = require("./interview");
const { Notification, Session, SavedJob } = require("./notification");

module.exports = {
  User,
  StudentProfile,
  RecruiterProfile,
  Company,
  Job,
  Application,
  Resume,
  Interview,
  Notification,
  Session,
  SavedJob,
};
