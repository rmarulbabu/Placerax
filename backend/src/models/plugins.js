"use strict";

/**
 * Shared Mongoose schema options + a toJSON transform that reproduces the
 * original Pydantic serialization:
 *   - `_id` -> `id` (string)
 *   - drop `__v`
 *   - keep snake_case timestamps `created_at` / `updated_at`
 *   - ObjectId reference fields are stringified
 */

const TIMESTAMPS = { createdAt: "created_at", updatedAt: "updated_at" };

function isObjectId(val) {
  return val && typeof val === "object" && /objectid/i.test(String(val._bsontype));
}

/**
 * Defensive: reference fields are stored as strings (matching the original
 * backend), but if any ObjectId slips through it is stringified for output.
 */
function stringifyObjectIds(obj) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (isObjectId(val)) {
      obj[key] = val.toString();
    } else if (Array.isArray(val)) {
      obj[key] = val.map((v) => (isObjectId(v) ? v.toString() : v));
    }
  }
  return obj;
}

const baseToJSON = {
  virtuals: true,
  versionKey: false,
  flattenMaps: true,
  transform(_doc, ret) {
    if (ret._id != null) {
      ret.id = String(ret._id);
    }
    delete ret._id;
    delete ret.password_hash;
    return stringifyObjectIds(ret);
  },
};

/** Apply standard options to a schema. */
function baseSchemaOptions(extra = {}) {
  return {
    timestamps: TIMESTAMPS,
    toJSON: baseToJSON,
    toObject: { virtuals: true },
    ...extra,
  };
}

/** Options for embedded sub-schemas (no own _id, no timestamps). */
const subSchemaOptions = { _id: false };

module.exports = { TIMESTAMPS, baseSchemaOptions, subSchemaOptions, baseToJSON };
