"use strict";

const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const { publicUser } = require("../utils/serialize");

function client(req) {
  return { ip: req.ip || null, ua: req.headers["user-agent"] || null };
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, client(req));
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, client(req));
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refresh_token);
  res.json(tokens);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refresh_token);
  res.json({ message: "Logged out." });
});

const me = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
});

module.exports = { register, login, refresh, logout, me };
