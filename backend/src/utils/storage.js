"use strict";

/**
 * Cloudinary storage adapter.
 * Falls back to a no-op local stub when Cloudinary credentials are not
 * configured, so the app remains runnable in development without external
 * storage. Mirrors app/core/storage.py.
 */

const { settings } = require("../config/env");
const createLogger = require("../config/logger");

const logger = createLogger("placera.storage");

let configured = false;
let cloudinary = null;

function ensureConfigured() {
  if (configured) return true;
  if (!settings.CLOUDINARY_CLOUD_NAME) return false;
  try {
    // eslint-disable-next-line global-require
    cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: settings.CLOUDINARY_CLOUD_NAME,
      api_key: settings.CLOUDINARY_API_KEY,
      api_secret: settings.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
    return true;
  } catch (err) {
    logger.warning(`Cloudinary not configured: ${String(err)}`);
    return false;
  }
}

/**
 * Upload bytes and return a public URL. Stubbed when unconfigured.
 * @param {Buffer} content
 * @param {object} opts
 * @param {string} opts.folder
 * @param {string} opts.filename
 * @returns {Promise<string>}
 */
async function uploadFile(content, { folder, filename }) {
  if (!ensureConfigured()) {
    logger.info(`Storage stub: pretending to upload ${folder}/${filename}`);
    return `https://storage.local/${folder}/${filename}`;
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `placera/${folder}`, resource_type: "auto", public_id: filename },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result.secure_url);
      }
    );
    stream.end(content);
  });
}

module.exports = { uploadFile };
