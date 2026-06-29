"use strict";

const express = require("express");
const ctrl = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema, refreshSchema } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", validate(registerSchema), ctrl.register);
router.post("/login", validate(loginSchema), ctrl.login);
router.post("/refresh", validate(refreshSchema), ctrl.refresh);
router.post("/logout", validate(refreshSchema), ctrl.logout);
router.get("/me", authenticate, ctrl.me);

module.exports = router;
