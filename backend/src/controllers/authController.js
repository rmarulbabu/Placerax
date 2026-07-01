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

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.user, req.body);
  res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user, req.body.current_password, req.body.new_password);
  res.json({ message: "Password updated." });
});

const updateSettings = asyncHandler(async (req, res) => {
  const user = await authService.updateSettings(req.user, req.body);
  res.json(user);
});

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.listSessions(String(req.user.id));
  res.json({ items: sessions });
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(String(req.user.id));
  res.json({ message: "Signed out of all devices." });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
  updateSettings,
  listSessions,
  logoutAll,
};
