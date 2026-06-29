"use strict";

const applicationService = require("../services/applicationService");
const asyncHandler = require("../utils/asyncHandler");

const apply = asyncHandler(async (req, res) => {
  const app = await applicationService.apply(req.body, req.user);
  res.status(201).json(app.toJSON());
});

const myApplications = asyncHandler(async (req, res) => {
  const apps = await applicationService.listForStudent(String(req.user.id));
  res.json(apps.map((a) => a.toJSON()));
});

const getApplication = asyncHandler(async (req, res) => {
  const app = await applicationService.get(req.params.application_id, req.user);
  res.json(app.toJSON());
});

const withdraw = asyncHandler(async (req, res) => {
  await applicationService.withdraw(req.params.application_id, req.user);
  res.json({ message: "Application withdrawn." });
});

const moveStage = asyncHandler(async (req, res) => {
  const app = await applicationService.moveStage(
    req.params.application_id,
    req.body.stage,
    req.user
  );
  res.json(app.toJSON());
});

const setRank = asyncHandler(async (req, res) => {
  const app = await applicationService.setRank(
    req.params.application_id,
    req.body.ranking,
    req.user
  );
  res.json(app.toJSON());
});

const addNote = asyncHandler(async (req, res) => {
  const app = await applicationService.addNote(
    req.params.application_id,
    req.body.body,
    req.user
  );
  res.json(app.toJSON());
});

const pipeline = asyncHandler(async (req, res) => {
  const result = await applicationService.pipeline(req.params.job_id, req.user);
  res.json(result);
});

module.exports = {
  apply,
  myApplications,
  getApplication,
  withdraw,
  moveStage,
  setRank,
  addNote,
  pipeline,
};
