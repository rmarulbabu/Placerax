"use strict";

/** Enumerations shared across the domain — mirrors app/models/enums.py. */

const Role = { STUDENT: "student", RECRUITER: "recruiter", ADMIN: "admin" };

const UserStatus = {
  ACTIVE: "active",
  PENDING: "pending",
  SUSPENDED: "suspended",
  BANNED: "banned",
};

const JobType = {
  INTERNSHIP: "internship",
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract",
};

const Workplace = { REMOTE: "remote", ONSITE: "onsite", HYBRID: "hybrid" };

const JobStatus = {
  DRAFT: "draft",
  PENDING_MODERATION: "pending_moderation",
  PUBLISHED: "published",
  CLOSED: "closed",
  REJECTED: "rejected",
};

const ApplicationStage = {
  APPLIED: "applied",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFER: "offer",
  HIRED: "hired",
  REJECTED: "rejected",
};

const DEFAULT_PIPELINE = [
  ApplicationStage.APPLIED,
  ApplicationStage.SCREENING,
  ApplicationStage.INTERVIEW,
  ApplicationStage.OFFER,
  ApplicationStage.HIRED,
  ApplicationStage.REJECTED,
];

const ApplicationStatus = {
  ACTIVE: "active",
  WITHDRAWN: "withdrawn",
  REJECTED: "rejected",
  HIRED: "hired",
};

const ApprovalStatus = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" };

const InterviewType = {
  SCREENING: "screening",
  TECHNICAL: "technical",
  HR: "hr",
  MANAGERIAL: "managerial",
};

const InterviewStatus = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

const values = (obj) => Object.values(obj);

module.exports = {
  Role,
  UserStatus,
  JobType,
  Workplace,
  JobStatus,
  ApplicationStage,
  DEFAULT_PIPELINE,
  ApplicationStatus,
  ApprovalStatus,
  InterviewType,
  InterviewStatus,
  values,
};
