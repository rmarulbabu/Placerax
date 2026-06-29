"use strict";

/** Notification creation + realtime fan-out. Mirrors app/services/notification_service.py. */

const { Notification } = require("../models");
const mongoose = require("mongoose");
const connectionManager = require("../sockets/manager");

async function notify(userId, { type, title, body = null, link = null }) {
  const notif = await Notification.create({
    user_id: userId,
    type,
    title,
    body,
    link,
  });
  await connectionManager.sendToUser(userId, {
    event: "notification.new",
    data: notif.toJSON(),
  });
  return notif;
}

async function list(userId) {
  const items = await Notification.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(30);
  const unread = await Notification.countDocuments({ user_id: userId, read: false });
  return {
    items: items.map((n) => n.toJSON()),
    unread,
  };
}

async function markRead(userId, ids = null) {
  const query = { user_id: userId, read: false };
  if (ids && ids.length) {
    const validIds = ids.filter((i) => mongoose.isValidObjectId(i));
    query._id = { $in: validIds };
  }
  await Notification.updateMany(query, { $set: { read: true } });
}

module.exports = { notify, list, markRead };
