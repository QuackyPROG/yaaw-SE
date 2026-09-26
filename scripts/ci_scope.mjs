#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const clean = value => String(value ?? "").trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
const docsOnlyPath = path => path === "README.md" || path === "AGENTS.md" || path.startsWith("docs/");
const ciPath = path => path === ".github/workflows/validate.yml" || path === "scripts/ci_scope.mjs" || path === "tests/cli/ci-scope.test.ts";
const orchestrationPath = path =>
  /^\.yaaw-core\/system\/tools\/orchestration-(engine|runtime)\.mjs$/.test(path) ||
  path === ".yaaw-core/system/core/recovery.md" ||
  path === ".yaaw-core/system/roles/orchestrator.md" ||
  /^\.yaaw-core\/system\/workflows\/(orchestration|implementation)\//.test(path) ||
  /^\.yaaw-core\/system\/registries\/(routing-policy|reconciliation-policy|handoff-policy|transitions|execution-policy|role-io|workflows)\.json$/.test(path) ||
  /^tests\/cli\/orchestration-.*\.test\.ts$/.test(path) ||
  path === "scripts/run_lifecycle_cases.mjs";
const corePath = path =>
  /^\.yaaw-core\//.test(path) ||
  /^skills\//.test(path) ||
  ["scripts/validate_core.py","scripts/validate_behavior.py","scripts/behavior_oracle.py","scripts/validate_schemas.mjs"].includes(path) ||
  /^tests\/test_(core|behavioral|fresh_context|assumption|execution_profile|bootstrap).*\.py$/.test(path);
const distributionPath = path =>
  /^(src|installer)\//.test(path) ||
  ["package.json","package-lock.json","tsconfig.json","vitest.config.ts"].includes(path) ||
  /^scripts\/(build_npm_payload|verify_npm_payload|validate_distribution|smoke_npm_|resolve_release_version)/.test(path) ||
  (/^tests\/cli\/.*\.test\.ts$/.test(path) && !orchestrationPath(path) && !ciPath(path)) ||
  path === "tests/test_distribution_contracts.py";
const nodeFloorPath = path =>
  /^src\//.test(path) ||
  ["package.json","package-lock.json","tsconfig.json"].includes(path) ||
  /^scripts\/(build_npm_payload|verify_npm_payload)/.test(path);
const platformPath = path =>
  /^(src|installer)\//.test(path) ||
  /^scripts\/smoke_npm_/.test(path) ||
  (/^tests\/cli\/.*\.test\.ts$/.test(path) && !orchestrationPath(path) && !ciPath(path));
const releasePath = path =>
  /^\.yaaw-core\//.test(path) ||
  /^skills\//.test(path) ||
  /^(src|installer)\//.test(path) ||
  ["package.json","package-lock.json","tsconfig.json"].includes(path) ||
  /^scripts\/(build_npm_payload|verify_npm_payload)/.test(path);

export function classifyChangedFiles(values) {
  const files = [...new Set((values ?? []).map(clean).filter(Boolean))].sort();
  const out = { validate:false, release:false, ci:false, orchestration:false, core:false, distribution:false, node_floor:false, platform:false, full:false };
  for (const path of files) {
    if (docsOnlyPath(path)) continue;
    out.validate = true;
    let matched = false;
    if (ciPath(path)) { out.ci = true; matched = true; }
    if (orchestrationPath(path)) { out.orchestration = true; matched = true; }
    else if (corePath(path)) { out.core = true; matched = true; }
    if (distributionPath(path)) { out.distribution = true; matched = true; }
    if (nodeFloorPath(path)) out.node_floor = true;
    if (platformPath(path)) out.platform = true;
    if (releasePath(path)) out.release = true;
    if (!matched) { out.full = true; out.release = true; }
  }
  if (out.full) {
    out.ci = true;
    out.orchestration = true;
    out.core = true;
    out.distribution = true;
    out.node_floor = true;
    out.platform = true;
  }
  return { files, ...out };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = classifyChangedFiles(readFileSync(0, "utf8").split(/\r?\n/));
  const index = process.argv.indexOf("--github-output");
  if (index >= 0) {
    const target = process.argv[index + 1];
    if (!target) throw new Error("--github-output requires a path");
    const keys = ["validate","release","ci","orchestration","core","distribution","node_floor","platform","full"];
    appendFileSync(target, keys.map(key => `${key}=${result[key] ? "true" : "false"}`).join("\n") + "\n");
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }
}
