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
import { getIntegration, integrationIds } from "../../integrations/registry.js";
import type { ConfigurationSelection, IntegrationId } from "../../integrations/types.js";
import type { ConflictPolicy, InstallAction, InstallContext } from "../../installer/types.js";
import semver from "semver";
import { selectDirectory } from "../../tui/select-directory.js";
import { selectTools } from "../../tui/select-tools.js";
import { selectSkills } from "../../tui/select-skills.js";
import { selectExistingAction } from "../../tui/existing-install.js";
import { confirmPlan, formatPlan } from "../../tui/confirm-plan.js";
import { formatSuccess, showSuccess } from "../../tui/result.js";
import { configureIntegration } from "../../tui/configure-integration.js";
import { detectConfigurationUpdates } from "../../installer/configuration.js";
import { migrateInstallationManifest } from "../../installer/migrations/installation/index.js";
import { promptConfigurationUpdates, formatConfigurationUpdates } from "../../tui/configuration-updates.js";
import { configureProjectIntegration } from "./config.js";
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
  conflictPolicy?: ConflictPolicy;
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

async function resolveCodexRuntime(options: InstallCommandOptions, existing: unknown, currentProfile: any, interactive: boolean, action: InstallAction): Promise<ConfigurationSelection> {
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
  const capability = getIntegration("codex").configuration!;
  if (interactive && !explicit && (action === "fresh" || action === "modify")) {
    return configureIntegration("codex", settings, {
      reason: action === "fresh" ? "fresh" : "modify",
      availableRevision: capability.revision,
      pendingChanges: capability.changes.filter(change => change.revision > (currentProfile?.revision ?? 0)),
      currentProfile: currentProfile ?? null
    });
  }
  return { settings, profile: currentProfile ?? { id: explicit ? "custom" : "inherit", revision: capability.revision } };
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
  const installedManifest = existing.manifest ? migrateInstallationManifest(existing.manifest) : null;

  if (await legacyExists(projectRoot)) {
    throw new Error("Legacy .yaaw project state detected. Automatic migration is intentionally not performed; move/validate it before installing the one-root distribution.");
  }

  const allowedActions = new Set(["fresh","quick-update","modify","repair","uninstall"]);
  if (options.action && !allowedActions.has(options.action)) {
    throw new Error(`Unknown install action: ${options.action}`);
  }
  const allowedConflictPolicies = new Set<ConflictPolicy>(["fail","keep","replace","backup-replace"]);
  if (options.conflictPolicy && !allowedConflictPolicies.has(options.conflictPolicy)) {
    throw new Error(`Unknown conflict policy: ${options.conflictPolicy}`);
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
    let conflictPolicy: ConflictPolicy = options.conflictPolicy ?? (options.forceManaged ? "replace" : "fail");
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
      uninstallBuilt = await buildInstallPlan(ctx, installedManifest);
    } catch (error) {
      if (!(error instanceof ManagedConflictError) || !interactive || options.conflictPolicy) throw error;
      conflictPolicy = await chooseConflictPolicy(error.conflicts);
      if (conflictPolicy === "fail") throw error;
      ctx = await makeUninstallContext();
      uninstallBuilt = await buildInstallPlan(ctx, installedManifest);
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
  if (!tools.length && installedManifest && ["quick-update","repair"].includes(action)) {
    tools = Object.keys(installedManifest!.integrations) as IntegrationId[];
  }
  if (interactive && (action === "fresh" || action === "modify")) {
    tools = await selectTools(projectRoot, tools.length ? tools : (Object.keys(installedManifest?.integrations ?? {}) as IntegrationId[]));
  }
  if (!tools.length) {
    throw new Error("Fresh/headless installation requires --tools; no provider is guessed.");
  }

  let skills: string[];
  if (options.skills) skills = await resolveSkillSelection(payloadRoot, options.skills);
  else if (installedManifest && ["quick-update","repair"].includes(action)) skills = existing.manifest.skills;
  else if (interactive) skills = await selectSkills(payloadRoot, installedManifest?.skills);
  else skills = await resolveSkillSelection(payloadRoot, "standard");

  const integrationSettings: Partial<Record<IntegrationId, unknown>> = {};
  const integrationProfiles: Partial<Record<IntegrationId, any>> = {};
  for (const integrationId of tools) {
    const adapter = getIntegration(integrationId);
    const capability = adapter.configuration;
    if (!capability) continue;

    const record = installedManifest?.integrations?.[integrationId];
    let selection: ConfigurationSelection;
    if (integrationId === "codex") {
      selection = await resolveCodexRuntime(
        options,
        record?.configuration?.settings ?? record?.runtime,
        record?.configuration?.profile,
        interactive,
        action
      );
    } else {
      const currentSettings = capability.normalize(record?.configuration?.settings ?? capability.defaultSettings());
      if (interactive && (action === "fresh" || action === "modify") && capability.configureInteractive) {
        selection = await configureIntegration(integrationId, currentSettings, {
          reason: action === "fresh" ? "fresh" : "modify",
          availableRevision: capability.revision,
          pendingChanges: capability.changes.filter(change => change.revision > (record?.configuration?.appliedRevision ?? 0)),
          currentProfile: record?.configuration?.profile ?? null
        });
      } else {
        selection = {
          settings: currentSettings,
          profile: record?.configuration?.profile ?? { id: "custom", revision: capability.revision }
        };
      }
    }

    if (selection.cancelled) {
      if (interactive) p.outro("Installation cancelled.");
      return;
    }
    integrationSettings[integrationId] = selection.settings;
    integrationProfiles[integrationId] = selection.profile;
  }

  const pendingConfigurationUpdates = action === "quick-update" && installedManifest ? detectConfigurationUpdates(installedManifest) : [];

  let conflictPolicy: ConflictPolicy = options.conflictPolicy ?? (options.forceManaged ? "replace" : "fail");
  const makeContext = (): InstallContext => ({
    packageVersion: "", payloadRoot, requestedDirectory: requested, projectRoot,
    mode: interactive ? "interactive" : "headless", selectedIntegrations: tools, selectedSkills: skills,
    integrationSettings,
    integrationProfiles,
    acknowledgeConfigurationUpdates: interactive && action === "quick-update" ? pendingConfigurationUpdates.map(update => update.integrationId) : [],
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
    built = await buildInstallPlan(ctx, installedManifest);
  } catch (error) {
    if (!(error instanceof ManagedConflictError) || !interactive || options.conflictPolicy) throw error;
    conflictPolicy = await chooseConflictPolicy(error.conflicts);
    if (conflictPolicy === "fail") throw error;
    ctx = makeContext();
    ctx.packageVersion = version;
    built = await buildInstallPlan(ctx, installedManifest);
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
  const result = { ok:true, projectRoot, version, tools, skills, changed, configurationUpdates: pendingConfigurationUpdates };
  if (options.json) console.log(JSON.stringify(result,null,2));
  else if (interactive) {
    showSuccess({ projectRoot, selected: tools, version, action, changed }, !(action === "quick-update" && pendingConfigurationUpdates.length));
    if (action === "quick-update" && pendingConfigurationUpdates.length) {
      const configureNow = await promptConfigurationUpdates(pendingConfigurationUpdates);
      for (const integrationId of configureNow) {
        try {
          await configureProjectIntegration({ projectRoot, integrationId, reason: "update", interactive: true, conflictPolicy, showIntro: false });
        } catch (error: any) {
          p.note(`The framework update is complete, but configuration was not applied: ${error.message}`, `${getIntegration(integrationId).displayName} configuration`);
        }
      }
      p.outro("Verified and ready.");
    }
  } else {
    console.log(formatSuccess({ projectRoot, selected: tools, version, action, changed }));
    if (pendingConfigurationUpdates.length) console.log("\n" + formatConfigurationUpdates(pendingConfigurationUpdates));
  }
  return result;
}
