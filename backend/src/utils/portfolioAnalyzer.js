"use strict";

/**
 * Deterministic portfolio analysis engine (dependency-free).
 *
 * Follows the same philosophy as aiEngine.js: stable, explainable heuristics
 * with no external ML calls. When the portfolio HTML is available (fetched by
 * the service) it derives real signals (meta tags, alt text, viewport, etc.);
 * otherwise it falls back to a URL-seeded deterministic baseline so the same
 * input always yields the same scores. Swap any function body for a
 * Lighthouse/LLM call behind the same signature without touching callers.
 */

const CATEGORY_WEIGHTS = {
  performance: 0.2,
  seo: 0.18,
  accessibility: 0.18,
  mobile: 0.16,
  ux: 0.14,
  project_quality: 0.14,
};

/** Stable 32-bit hash of a string. */
function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/** Deterministic baseline score in [min,max] seeded by url + salt. */
function seeded(url, salt, min = 58, max = 86) {
  const h = hashString(`${url}::${salt}`);
  return min + (h % (max - min + 1));
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const count = (html, re) => (html.match(re) || []).length;
const has = (html, re) => re.test(html);

/** Extract lightweight signals from an HTML document. */
function extractSignals(html) {
  const lower = html.toLowerCase();
  const imgTotal = count(lower, /<img\b/g);
  const imgWithAlt = count(lower, /<img\b[^>]*\balt\s*=/g);
  const scripts = count(lower, /<script\b/g);
  return {
    sizeKb: Math.round(html.length / 1024),
    hasTitle: has(lower, /<title[^>]*>[^<]{3,}<\/title>/),
    hasMetaDesc: has(lower, /<meta[^>]+name=["']description["'][^>]*>/),
    hasViewport: has(lower, /<meta[^>]+name=["']viewport["'][^>]*>/),
    hasOg: has(lower, /<meta[^>]+property=["']og:/),
    hasStructuredData: has(lower, /application\/ld\+json/),
    hasCanonical: has(lower, /<link[^>]+rel=["']canonical["']/),
    hasLang: has(lower, /<html[^>]+lang=/),
    h1Count: count(lower, /<h1\b/g),
    headingCount: count(lower, /<h[1-6]\b/g),
    imgTotal,
    imgWithAlt,
    altRatio: imgTotal ? imgWithAlt / imgTotal : 1,
    ariaCount: count(lower, /\baria-[a-z]+=/g),
    hasNav: has(lower, /<nav\b/),
    hasLazy: has(lower, /loading=["']lazy["']/),
    hasAsyncDefer: has(lower, /<script[^>]+(async|defer)/),
    scripts,
    mentionsProjects: count(lower, /project|case study|portfolio|live demo|deployed/g),
    mentionsGithub: has(lower, /github\.com/),
  };
}

function scorePerformance(url, s) {
  if (!s) return seeded(url, "perf");
  let score = 74;
  if (s.hasLazy) score += 8;
  if (s.hasAsyncDefer) score += 8;
  if (s.sizeKb <= 150) score += 6;
  else if (s.sizeKb > 600) score -= 12;
  else if (s.sizeKb > 300) score -= 6;
  if (s.scripts > 15) score -= 8;
  else if (s.scripts > 8) score -= 4;
  return clamp(score);
}

function scoreSeo(url, s) {
  if (!s) return seeded(url, "seo");
  let score = 45;
  if (s.hasTitle) score += 14;
  if (s.hasMetaDesc) score += 14;
  if (s.hasOg) score += 12;
  if (s.hasStructuredData) score += 8;
  if (s.hasCanonical) score += 4;
  if (s.h1Count >= 1) score += 3;
  return clamp(score);
}

function scoreAccessibility(url, s) {
  if (!s) return seeded(url, "a11y");
  let score = 50;
  score += Math.round(s.altRatio * 22);
  if (s.hasLang) score += 8;
  if (s.ariaCount >= 3) score += 10;
  else if (s.ariaCount >= 1) score += 5;
  if (s.headingCount >= 3) score += 6;
  return clamp(score);
}

function scoreMobile(url, s) {
  if (!s) return seeded(url, "mobile");
  let score = 55;
  if (s.hasViewport) score += 28;
  if (s.hasNav) score += 6;
  if (s.headingCount >= 3) score += 6;
  return clamp(score);
}

function scoreUx(url, s) {
  if (!s) return seeded(url, "ux");
  let score = 58;
  if (s.hasNav) score += 12;
  if (s.h1Count === 1) score += 8;
  else if (s.h1Count > 1) score -= 4;
  if (s.headingCount >= 4) score += 8;
  if (s.imgTotal >= 3) score += 6;
  return clamp(score);
}

function scoreProjectQuality(url, githubUrl, s) {
  let score = s ? 55 : seeded(url, "project");
  if (githubUrl) score += 14;
  if (s) {
    if (s.mentionsGithub) score += 8;
    if (s.mentionsProjects >= 6) score += 12;
    else if (s.mentionsProjects >= 2) score += 6;
  }
  return clamp(score);
}

/**
 * Analyze a portfolio.
 * @param {object} args
 * @param {string} args.portfolioUrl
 * @param {string|null} [args.githubUrl]
 * @param {string|null} [args.html] fetched HTML (optional)
 */
function analyzePortfolio({ portfolioUrl, githubUrl = null, html = null }) {
  const signals = html ? extractSignals(html) : null;

  const categories = {
    performance: scorePerformance(portfolioUrl, signals),
    seo: scoreSeo(portfolioUrl, signals),
    accessibility: scoreAccessibility(portfolioUrl, signals),
    mobile: scoreMobile(portfolioUrl, signals),
    ux: scoreUx(portfolioUrl, signals),
    project_quality: scoreProjectQuality(portfolioUrl, githubUrl, signals),
  };

  const overall = clamp(
    Object.entries(categories).reduce((sum, [k, v]) => sum + v * CATEGORY_WEIGHTS[k], 0)
  );

  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  const LABELS = {
    performance: "Performance",
    seo: "SEO",
    accessibility: "Accessibility",
    mobile: "Mobile responsiveness",
    ux: "UI/UX quality",
    project_quality: "Project quality",
  };

  for (const [key, value] of Object.entries(categories)) {
    if (value >= 80) strengths.push(`${LABELS[key]} is strong (${value}/100).`);
    else if (value < 65) weaknesses.push(`${LABELS[key]} needs improvement (${value}/100).`);
  }

  // Signal-driven, actionable recommendations
  if (signals) {
    if (!signals.hasMetaDesc) recommendations.push("Add a meta description for better SEO snippets.");
    if (!signals.hasOg) recommendations.push("Add Open Graph tags for rich social sharing previews.");
    if (!signals.hasStructuredData)
      recommendations.push("Add JSON-LD structured data (Person / CreativeWork).");
    if (!signals.hasViewport)
      recommendations.push("Add a responsive viewport meta tag for mobile devices.");
    if (signals.altRatio < 0.9)
      recommendations.push("Add descriptive alt text to all images for accessibility.");
    if (!signals.hasLang) recommendations.push('Set the <html lang="…"> attribute.');
    if (!signals.hasLazy) recommendations.push('Lazy-load below-the-fold images with loading="lazy".');
    if (signals.scripts > 8) recommendations.push("Reduce/bundle scripts to cut load time.");
    if (signals.h1Count !== 1)
      recommendations.push("Use exactly one <h1> to establish clear visual hierarchy.");
  } else {
    recommendations.push(
      "We could not fetch the page directly — verify the URL is public and returns HTML."
    );
    recommendations.push("Ensure meta tags, Open Graph, and a viewport tag are present.");
  }
  if (!githubUrl)
    recommendations.push("Add a GitHub link so reviewers can assess your code quality.");
  recommendations.push("Showcase 3–4 projects with descriptions, tech stack, and live/demo links.");

  // Priority fixes = the two lowest-scoring categories
  const priorityFixes = Object.entries(categories)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([key, value]) => `${LABELS[key]} (${value}/100) — highest-impact area to improve first.`);

  if (!strengths.length) strengths.push("Portfolio is live and reachable — a solid starting point.");

  return {
    portfolio_url: portfolioUrl,
    github_url: githubUrl,
    fetched: Boolean(signals),
    overall_score: overall,
    categories,
    strengths,
    weaknesses,
    recommendations: [...new Set(recommendations)].slice(0, 8),
    priority_fixes: priorityFixes,
  };
}

module.exports = { analyzePortfolio };
