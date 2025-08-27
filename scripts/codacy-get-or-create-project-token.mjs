#!/usr/bin/env node
/* eslint-env node */
/* global fetch, setTimeout, process, console */
/**
 * Codacy Project Token Helper
 *
 * Purpose:
 *  Programmatically obtain (or create) a Codacy project (repository) token using the Codacy REST API
 *  so we can upload coverage (lcov) from CI without manually pasting the token.
 *
 * Inputs (environment variables):
 *  CODACY_API_TOKEN          Personal API token (NEVER commit). Required.
 *  CODACY_ORG_PROVIDER       Git provider slug: gh | gl | bb. Default: gh
 *  CODACY_ORG_NAME           Organization/owner on the VCS. Default: extracted from GITHUB_REPOSITORY if possible
 *  CODACY_REPO_NAME          Repository name (no org). Default: extracted from GITHUB_REPOSITORY
 *  CODACY_BASE_URL           Optional Codacy base URL (for on‑prem). Default: https://app.codacy.com
 *
 * Outputs:
 *  - Writes the discovered/created project token to stdout (last line) in the form TOKEN=xxxx
 *  - Sets a GitHub Actions output named codacy_project_token when GITHUB_OUTPUT is defined.
 *  - Masks the token in GitHub Actions logs.
 *
 * Behavior:
 *  1. Lists existing repository tokens. If one exists, reuse the first.
 *  2. Otherwise, creates a new repository token.
 *  3. Emits token only via outputs; does not persist to disk.
 *
 * NOTE: This script purposefully does NOT cache or rotate tokens. If you want rotation, delete
 *       tokens in the Codacy UI or extend this script.
 */

import fs from 'node:fs';

// ---- Configuration & Guards -------------------------------------------------

const personalToken = process.env.CODACY_API_TOKEN;
if (!personalToken) {
  console.error('ERROR: CODACY_API_TOKEN is required.');
  process.exit(1);
}

const provider = (process.env.CODACY_ORG_PROVIDER || 'gh').trim();

// Attempt to derive org/repo from GitHub Actions context if not provided
const repoSlug = process.env.GITHUB_REPOSITORY; // e.g. orgName/repoName
let orgName = process.env.CODACY_ORG_NAME;
let repoName = process.env.CODACY_REPO_NAME;
if ((!orgName || !repoName) && repoSlug) {
  const parts = repoSlug.split('/');
  if (parts.length === 2) {
    orgName = orgName || parts[0];
    repoName = repoName || parts[1];
  }
}

if (!orgName || !repoName) {
  console.error('ERROR: CODACY_ORG_NAME and CODACY_REPO_NAME (or GITHUB_REPOSITORY) must be set.');
  process.exit(1);
}

const baseUrl = (process.env.CODACY_BASE_URL || 'https://app.codacy.com').replace(/\/$/, '');

// API endpoints (v3)
// List tokens:   GET  /api/v3/organizations/{provider}/{org}/repositories/{repo}/tokens
// Create token:  POST /api/v3/organizations/{provider}/{org}/repositories/{repo}/tokens
// (Optional) ensure repository exists: we assume it is already added via UI or prior automation.

const tokensEndpoint = `${baseUrl}/api/v3/organizations/${encodeURIComponent(provider)}/${encodeURIComponent(orgName)}/repositories/${encodeURIComponent(repoName)}/tokens`;

// ---- Helpers ----------------------------------------------------------------

async function apiFetch(url, init = {}, attempt = 1) {
  const maxAttempts = 3;
  const headers = {
    'Content-Type': 'application/json',
    'api-token': personalToken, // Documented header
    Authorization: `token ${personalToken}`, // Fallback header style
    ...(init.headers || {})
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    if (res.status >= 500 && attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, 250 * attempt));
      return apiFetch(url, init, attempt + 1);
    }
    const text = await res.text();
    throw new Error(`Codacy API ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

async function getExistingToken() {
  try {
    const data = await apiFetch(tokensEndpoint, { method: 'GET' });
    if (Array.isArray(data) && data.length > 0) {
      // Data shape example (based on docs): [{ id, value, createdAt, ... }]
      return data[0].value || data[0].token || null;
    }
  } catch (e) {
    // If 404, repository might not be on Codacy yet; surface message but continue.
    console.warn('[codacy] No existing token found or list failed:', e.message);
  }
  return null;
}

async function createToken() {
  const data = await apiFetch(tokensEndpoint, { method: 'POST' });
  // Expect shape { value: 'xxxx' } or { token: 'xxxx' }
  return data.value || data.token || null;
}

function emitOutputs(token) {
  if (process.env.GITHUB_ACTIONS) {
    // Mask token
    console.log(`::add-mask::${token}`);
  }
  // Set GitHub Actions output if available
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    try {
      fs.appendFileSync(ghOutput, `codacy_project_token=${token}\n`);
    } catch (e) {
      console.warn('[codacy] Failed to write GITHUB_OUTPUT:', e.message);
    }
  }
  // Plain stdout (greppable) – last line
  console.log(`TOKEN=${token}`);
}

// ---- Main -------------------------------------------------------------------

(async () => {
  console.log(`[codacy] Provider=${provider} Org=${orgName} Repo=${repoName}`);
  let token = await getExistingToken();
  if (token) {
    console.log('[codacy] Reusing existing repository token');
    emitOutputs(token);
    return;
  }
  console.log('[codacy] Creating new repository token');
  token = await createToken();
  if (!token) {
    console.error('ERROR: Failed to obtain Codacy repository token.');
    process.exit(1);
  }
  emitOutputs(token);
})().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
