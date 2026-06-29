"use strict";

const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.list(String(req.user.id));
  res.json(result);
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(String(req.user.id), req.body.ids || null);
  res.json({ message: "Notifications marked read." });
});

module.exports = { listNotifications, markRead };
