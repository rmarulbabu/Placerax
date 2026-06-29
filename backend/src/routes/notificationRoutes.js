"use strict";

const express = require("express");
const ctrl = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { markReadSchema } = require("../validators/miscValidators");

const router = express.Router();

router.get("/", authenticate, ctrl.listNotifications);
router.post("/read", authenticate, validate(markReadSchema), ctrl.markRead);

module.exports = router;
