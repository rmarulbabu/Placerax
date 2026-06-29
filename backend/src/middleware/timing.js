"use strict";

/**
 * Adds an `X-Process-Time-ms` response header — parity with the original
 * FastAPI timing middleware.
 */
function timing(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    // header must be set before finish; computed value below is informational
  });
  // Patch writeHead so the timing header is attached just before sending.
  const origWriteHead = res.writeHead;
  res.writeHead = function patchedWriteHead(...args) {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) {
      res.setHeader("X-Process-Time-ms", elapsedMs.toFixed(1));
    }
    return origWriteHead.apply(this, args);
  };
  next();
}

module.exports = { timing };
