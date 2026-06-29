"use strict";

/**
 * Request validation middleware backed by Joi.
 * Replaces FastAPI/Pydantic request-model validation. On failure, forwards a
 * Joi error which the error handler renders as a 422 envelope.
 *
 * Usage: router.post("/x", validate(schema), handler)  // validates req.body
 *        validate(schema, "query") to validate the query string.
 */

function validate(schema, property = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) return next(error);
    req[property] = value;
    return next();
  };
}

module.exports = { validate };
