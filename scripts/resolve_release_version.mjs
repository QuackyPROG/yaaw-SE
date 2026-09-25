#!/usr/bin/env node
import semver from "semver";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

function decodeRegistryValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length ? String(parsed.at(-1)) : null;
    return parsed === null || parsed === undefined ? null : String(parsed);
  } catch {
    return raw.replace(/^"|"$/g, "");
  }
}

function stableVersion(value, label) {
  const decoded = decodeRegistryValue(value);
  if (!decoded) return null;
  const parsed = semver.parse(decoded);
  if (!parsed) throw new Error(`Invalid ${label} version: ${decoded}`);
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

export function resolveStableVersion(repoVersion, npmLatest) {
  const repo = stableVersion(repoVersion, "repository");
  if (!repo) throw new Error("Repository version is required");
  const latest = stableVersion(npmLatest, "npm latest");
  if (!latest) return repo;
  if (semver.gt(repo, latest)) return repo;
  const next = semver.inc(latest, "patch");
  if (!next) throw new Error(`Could not increment npm latest version: ${latest}`);
  return next;
}

export function resolveNextVersion(repoVersion, npmLatest, runId, runAttempt) {
  if (!String(runId ?? "").trim() || !String(runAttempt ?? "").trim()) {
    throw new Error("next release requires run id and run attempt");
  }
  const base = resolveStableVersion(repoVersion, npmLatest);
  return `${base}-dev.${String(runId).trim()}.${String(runAttempt).trim()}`;
}

export function resolveReleaseVersion(channel, repoVersion, npmLatest, runId, runAttempt) {
  if (channel === "stable") return resolveStableVersion(repoVersion, npmLatest);
  if (channel === "next") return resolveNextVersion(repoVersion, npmLatest, runId, runAttempt);
  throw new Error(`Unknown release channel: ${channel}`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [channel, repoVersion, npmLatest = "", runId = "", runAttempt = ""] = process.argv.slice(2);
  try {
    process.stdout.write(resolveReleaseVersion(channel, repoVersion, npmLatest, runId, runAttempt));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
