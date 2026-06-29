"use strict";

/**
 * Socket.IO server setup + JWT-authenticated realtime endpoint.
 * Port of app/websockets/routes.py — clients connect with an access token
 * (handshake auth or `?token=` query) and are placed into a per-user room.
 */

const { Server } = require("socket.io");
const { ACCESS, decodeToken } = require("../utils/security");
const { settings } = require("../config/env");
const connectionManager = require("./manager");
const createLogger = require("../config/logger");

const logger = createLogger("placera.ws");

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: settings.CORS_ORIGINS,
      credentials: true,
    },
  });

  // authenticate every connection via the access token
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth && socket.handshake.auth.token) ||
      (socket.handshake.query && socket.handshake.query.token);
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = decodeToken(token, { expectedType: ACCESS });
      socket.data.userId = payload.sub;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    connectionManager.connect(userId, socket);
    socket.emit("connection.ready", { user_id: userId });

    socket.on("disconnect", () => {
      connectionManager.disconnect(userId, socket);
    });
  });

  connectionManager.setIo(io);
  logger.info("Socket.IO initialized.");
  return io;
}

module.exports = { initSockets };
