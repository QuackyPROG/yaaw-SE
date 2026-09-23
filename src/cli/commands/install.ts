import * as p from "@clack/prompts";
import { access, mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { detectExistingInstallation } from "../../installer/detect.js";
import { packageVersion, payloadRoot as getPayloadRoot } from "../../installer/context.js";
import { buildInstallPlan, ManagedConflictError, resolveSkillSelection } from "../../installer/plan.js";
import { MANIFEST_RELATIVE_PATH, serializeManifest } from "../../installer/manifest.js";
import { resolveProjectRoot } from "../../installer/boundary.js";
import { executePlan, preflightPlan } from "../../installer/transaction.js";
import { verifyInstalledState } from "../../installer/verify.js";
import { integrationIds } from "../../integrations/registry.js";
import type { IntegrationId } from "../../integrations/types.js";
import type { ConflictPolicy, InstallAction, InstallContext } from "../../installer/types.js";
import semver from "semver";
import { selectDirectory } from "../../tui/select-directory.js";
import { selectTools } from "../../tui/select-tools.js";
import { selectSkills } from "../../tui/select-skills.js";
import { selectExistingAction } from "../../tui/existing-install.js";
import { confirmPlan, formatPlan } from "../../tui/confirm-plan.js";
import { formatSuccess, showSuccess } from "../../tui/result.js";
import { configureCodexRuntime } from "../../tui/configure-codex.js";
import { defaultCodexRuntimeSettings, normalizeCodexRuntimeSettings, parseCodexInstallConfig, type CodexRuntimeSettings } from "../../integrations/codex-runtime.js";

export interface InstallCommandOptions {
  directory?: string;
  tools?: string;
  skills?: string;
  yes?: boolean;
  action?: InstallAction;
  dryRun?: boolean;
  listTools?: boolean;
  listSkills?: boolean;
  forceManaged?: boolean;
  codexRuntime?: string;
  codexRootModel?: string;
  codexRootReasoning?: string;
  codexWorkerModel?: string;
  codexWorkerReasoning?: string;
  codexMaxAgents?: string;
  codexConfig?: string;
  json?: boolean;
}

function parseTools(raw?: string): IntegrationId[] {
  if (!raw) return [];
  const values = raw.split(",").map(x=>x.trim()).filter(Boolean);
  const unknown = values.filter(x=>!integrationIds.includes(x as IntegrationId));
  if (unknown.length) throw new Error(`Unknown tool IDs: ${unknown.join(", ")}`);
  return [...new Set(values)] as IntegrationId[];
}


function inheritValue(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === "inherit" ? null : value;
}

async function resolveCodexRuntime(options: InstallCommandOptions, existing: unknown, interactive: boolean, action: InstallAction): Promise<CodexRuntimeSettings> {
  let settings = normalizeCodexRuntimeSettings(existing ?? defaultCodexRuntimeSettings());

  if (options.codexConfig) {
    const file = resolve(options.codexConfig);
    settings = parseCodexInstallConfig(JSON.parse(await readFile(file, "utf8")));
  }

  const overlay: any = {};
  if (options.codexRuntime !== undefined) overlay.mode = options.codexRuntime;
  const rootModel = inheritValue(options.codexRootModel);
  const rootReasoning = inheritValue(options.codexRootReasoning);
  if (rootModel !== undefined || rootReasoning !== undefined) {
    overlay.orchestrator = {
      ...(rootModel !== undefined ? { model: rootModel } : {}),
      ...(rootReasoning !== undefined ? { reasoning: rootReasoning } : {})
    };
  }
  const workerModel = inheritValue(options.codexWorkerModel);
  const workerReasoning = inheritValue(options.codexWorkerReasoning);
  if (workerModel !== undefined || workerReasoning !== undefined) {
    overlay.defaultWorker = {
      ...(workerModel !== undefined ? { model: workerModel } : {}),
      ...(workerReasoning !== undefined ? { reasoning: workerReasoning } : {})
    };
  }
  if (options.codexMaxAgents !== undefined) overlay.maxConcurrentThreads = options.codexMaxAgents === "inherit" ? null : options.codexMaxAgents;
  settings = normalizeCodexRuntimeSettings(overlay, settings);

  const explicit = Boolean(
    options.codexConfig || options.codexRuntime !== undefined || options.codexRootModel !== undefined ||
    options.codexRootReasoning !== undefined || options.codexWorkerModel !== undefined ||
    options.codexWorkerReasoning !== undefined || options.codexMaxAgents !== undefined
  );
  if (interactive && !explicit && (action === "fresh" || action === "modify")) {
    settings = await configureCodexRuntime(settings);
  }
  return settings;
}

async function legacyExists(root: string) {
  try { await access(join(root, ".yaaw")); return true; } catch { return false; }
}

async function chooseConflictPolicy(conflicts: string[]): Promise<ConflictPolicy> {
  p.note(conflicts.join("\n"), "Modified YAAW-managed files found");
  const result = await p.select({
    message: "How should these managed changes be handled?",
    options: [
      { value: "keep", label: "Keep local files/sections" },
      { value: "replace", label: "Replace with package version" },
      { value: "backup-replace", label: "Backup local content and replace" },
      { value: "fail", label: "Abort update" }
    ]
  });
  if (p.isCancel(result)) return "fail";
  return result as ConflictPolicy;
}

export async function runInstall(options: InstallCommandOptions = {}) {
  const payloadRoot = getPayloadRoot();

  if (options.listTools) {
    const result = integrationIds;
    console.log(options.json ? JSON.stringify(result) : result.join("\n"));
    return result;
  }
  if (options.listSkills) {
    const registry = JSON.parse(await readFile(join(payloadRoot, "yaaw-core", "registries", "skills.json"), "utf8"));
    const result = Object.keys(registry);
    console.log(options.json ? JSON.stringify(result) : result.join("\n"));
    return result;
  }

  const interactive = !options.yes;
  if (interactive) p.intro("YAAW-SE — Artifact-first autonomous software engineering");

  const requested = interactive
    ? await selectDirectory(options.directory ?? process.cwd())
    : (options.directory ?? process.cwd());
  const projectRoot = await resolveProjectRoot(requested);
  const existing = await detectExistingInstallation(projectRoot);

  if (await legacyExists(projectRoot)) {
    throw new Error("Legacy .yaaw project state detected. Automatic migration is intentionally not performed; move/validate it before installing the one-root distribution.");
  }

  const allowedActions = new Set(["fresh","quick-update","modify","repair","uninstall"]);
  if (options.action && !allowedActions.has(options.action)) {
    throw new Error(`Unknown install action: ${options.action}`);
  }

  let action: InstallAction;
  if (options.action) action = options.action;
  else if (existing.kind === "valid") {
    if (interactive) {
      const selected = await selectExistingAction();
      if (selected === "cancel") return;
      action = selected;
    } else action = "quick-update";
  } else action = "fresh";

  if (existing.kind === "partial") {
    throw new Error(`Partial YAAW/provider state exists without a valid manifest: ${existing.signals.join(", ")}. Ownership cannot be reconstructed safely; restore a valid manifest or clean the partial package-owned files explicitly before reinstalling.`);
  }

  if (action === "uninstall") {
    let conflictPolicy: ConflictPolicy = options.forceManaged ? "replace" : "fail";
    const makeUninstallContext = async (): Promise<InstallContext> => ({
      packageVersion: await packageVersion(), payloadRoot, requestedDirectory: requested, projectRoot,
      mode: interactive ? "interactive" : "headless", selectedIntegrations: [], selectedSkills: [],
      integrationSettings: {},
      action, dryRun: Boolean(options.dryRun), forceManaged: Boolean(options.forceManaged),
      conflictPolicy
    });
    let ctx = await makeUninstallContext();
    let uninstallBuilt;
    try {
      uninstallBuilt = await buildInstallPlan(ctx, existing.manifest);
    } catch (error) {
      if (!(error instanceof ManagedConflictError) || !interactive) throw error;
      conflictPolicy = await chooseConflictPolicy(error.conflicts);
      if (conflictPolicy === "fail") throw error;
      ctx = await makeUninstallContext();
      uninstallBuilt = await buildInstallPlan(ctx, existing.manifest);
    }
    const { plan } = uninstallBuilt;
    if (options.dryRun) {
      const result = { ...plan, operations: plan.operations.map(({type,path,...rest}: any)=>({type,path: path ? path.replace(projectRoot, ".") : undefined, ...rest, content: undefined})) };
      console.log(options.json ? JSON.stringify(result,null,2) : formatPlan(plan));
      return result;
    }
    if (interactive && !(await confirmPlan(plan))) return;
    await executePlan(plan);
    if (interactive) p.outro("YAAW-SE framework/adapters removed; .yaaw-core/project was preserved.");
    return;
  }

  let tools = parseTools(options.tools);
  if (!tools.length && existing.manifest && ["quick-update","repair"].includes(action)) {
    tools = Object.keys(existing.manifest.integrations) as IntegrationId[];
  }
  if (interactive && (action === "fresh" || action === "modify")) {
    tools = await selectTools(projectRoot, tools.length ? tools : (Object.keys(existing.manifest?.integrations ?? {}) as IntegrationId[]));
  }
  if (!tools.length) {
    throw new Error("Fresh/headless installation requires --tools; no provider is guessed.");
  }

  let skills: string[];
  if (options.skills) skills = await resolveSkillSelection(payloadRoot, options.skills);
  else if (existing.manifest && ["quick-update","repair"].includes(action)) skills = existing.manifest.skills;
  else if (interactive) skills = await selectSkills(payloadRoot, existing.manifest?.skills);
  else skills = await resolveSkillSelection(payloadRoot, "standard");

  const integrationSettings: Partial<Record<IntegrationId, unknown>> = {};
  if (tools.includes("codex")) {
    integrationSettings.codex = await resolveCodexRuntime(
      options,
      existing.manifest?.integrations?.codex?.runtime,
      interactive,
      action
    );
  }

  let conflictPolicy: ConflictPolicy = options.forceManaged ? "replace" : "fail";
  const makeContext = (): InstallContext => ({
    packageVersion: "", payloadRoot, requestedDirectory: requested, projectRoot,
    mode: interactive ? "interactive" : "headless", selectedIntegrations: tools, selectedSkills: skills,
    integrationSettings,
    action, dryRun: Boolean(options.dryRun), forceManaged: Boolean(options.forceManaged), conflictPolicy
  });
  const version = await packageVersion();
  if (existing.manifest && semver.valid(existing.manifest.yaawVersion) && semver.valid(version) && semver.gt(existing.manifest.yaawVersion, version)) {
    throw new Error(`Refusing implicit downgrade from ${existing.manifest.yaawVersion} to ${version}.`);
  }
  let ctx = makeContext();
  ctx.packageVersion = version;

  let built;
  try {
    built = await buildInstallPlan(ctx, existing.manifest);
  } catch (error) {
    if (!(error instanceof ManagedConflictError) || !interactive) throw error;
    conflictPolicy = await chooseConflictPolicy(error.conflicts);
    if (conflictPolicy === "fail") throw error;
    ctx = makeContext();
    ctx.packageVersion = version;
    built = await buildInstallPlan(ctx, existing.manifest);
  }

  await preflightPlan(built.plan);
  if (options.dryRun) {
    const result = {
      action,
      projectRoot,
      tools,
      skills,
      operations: built.plan.operations.map((op:any)=>({ type:op.type, path:op.path ? op.path.replace(projectRoot, ".") : undefined, reason:op.reason }))
    };
    console.log(options.json ? JSON.stringify(result,null,2) : formatPlan(built.plan));
    return result;
  }

  if (interactive && !(await confirmPlan(built.plan))) return;
  const spinner = interactive ? p.spinner() : null;
  spinner?.start("Installing YAAW-SE");
  const manifestPath = join(projectRoot, MANIFEST_RELATIVE_PATH);
  const changed = await executePlan(built.plan, {
    manifestPath,
    manifestContent: serializeManifest(built.manifest!),
    beforeManifest: async () => verifyInstalledState(projectRoot, tools, skills)
  } as any);
  spinner?.stop("Changes applied and verified");
  if (options.json) console.log(JSON.stringify({ok:true,projectRoot,version,tools,skills,changed},null,2));
  else if (interactive) showSuccess({ projectRoot, selected: tools, version, action, changed });
  else console.log(formatSuccess({ projectRoot, selected: tools, version, action, changed }));
  return { ok:true, projectRoot, version, tools, skills, changed };
}
