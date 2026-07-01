"use strict";

/**
 * Portfolio analysis orchestration.
 * Best-effort fetches the portfolio HTML (Node 18+ global fetch, with a
 * timeout and size cap) and runs the deterministic analyzer. Network failures
 * degrade gracefully to a URL-seeded analysis so the endpoint never errors on
 * an unreachable site.
 */

const { analyzePortfolio } = require("../utils/portfolioAnalyzer");
const createLogger = require("../config/logger");

const logger = createLogger("placera.portfolio");

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512 * 1024; // cap parsed HTML at 512KB

async function fetchHtml(url) {
  if (typeof fetch !== "function") return null; // very old Node — skip fetch
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "PlaceraPortfolioAnalyzer/1.0" },
    });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.includes("text/html")) return null;
    const text = await res.text();
    return text.slice(0, MAX_HTML_BYTES);
  } catch (err) {
    logger.warning(`Portfolio fetch failed for ${url}: ${String(err)}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function analyze({ portfolioUrl, githubUrl = null }) {
  const html = await fetchHtml(portfolioUrl);
  return analyzePortfolio({ portfolioUrl, githubUrl, html });
}

module.exports = { analyze };
