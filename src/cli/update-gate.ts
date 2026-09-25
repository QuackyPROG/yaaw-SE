import semver from "semver";
import { invokeNpm } from "./npm-runtime.js";

export type UpdateChannel = "latest" | "next";

export interface UpdateGateResult {
  handled: boolean;
  currentVersion: string;
  channel: UpdateChannel;
  availableVersion?: string;
  targetVersion?: string;
  exitCode?: number;
  reason:
    | "disabled"
    | "handoff-child"
    | "invalid-current-version"
    | "lookup-failed"
    | "already-current"
    | "invalid-registry-version"
    | "handoff-failed"
    | "handed-off";
}

export interface UpdateGateDependencies {
  lookupVersion?: (channel: UpdateChannel) => Promise<string | null>;
  handoff?: (version: string, args: string[]) => Promise<number | null>;
}

export function updateChannelForVersion(version: string): UpdateChannel {
  const parsed = semver.parse(version);
  return parsed?.prerelease.length ? "next" : "latest";
}

export function shouldHandoff(currentVersion: string, availableVersion: string): boolean {
  return Boolean(semver.valid(currentVersion) && semver.valid(availableVersion) && semver.gt(availableVersion, currentVersion));
}

function debug(message: string, env: NodeJS.ProcessEnv) {
  if (env.YAAW_UPDATE_DEBUG === "1") console.error(`[yaaw update] ${message}`);
}

export async function lookupRegistryVersion(
  channel: UpdateChannel,
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs = 5_000
): Promise<string | null> {
  const result = invokeNpm(
    ["view", `yaaw-se@${channel}`, "version", "--json", "--prefer-online"],
    { capture: true, timeoutMs, env }
  );
  if (result.error || result.status !== 0 || !result.stdout.trim()) return null;

  try {
    const parsed = JSON.parse(result.stdout);
    const value = Array.isArray(parsed) ? parsed.at(-1) : parsed;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    const value = result.stdout.trim().replace(/^"|"$/g, "");
    return value || null;
  }
}

export async function handoffToVersion(
  version: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env
): Promise<number | null> {
  const result = invokeNpm(
    ["exec", "--yes", "--loglevel=error", `--package=yaaw-se@${version}`, "--", "yaaw-se", ...args],
    {
      capture: false,
      env: { ...env, YAAW_UPDATE_HANDOFF: version }
    }
  );
  if (result.error || result.status === null) return null;
  return result.status;
}

export async function runAutoUpdateGate(input: {
  currentVersion: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  dependencies?: UpdateGateDependencies;
}): Promise<UpdateGateResult> {
  const env = input.env ?? process.env;
  const args = input.args ?? process.argv.slice(2);
  const channel = updateChannelForVersion(input.currentVersion);

  if (env.YAAW_DISABLE_AUTO_UPDATE === "1") {
    return { handled: false, currentVersion: input.currentVersion, channel, reason: "disabled" };
  }
  if (env.YAAW_UPDATE_HANDOFF) {
    return { handled: false, currentVersion: input.currentVersion, channel, reason: "handoff-child" };
  }
  if (!semver.valid(input.currentVersion)) {
    return { handled: false, currentVersion: input.currentVersion, channel, reason: "invalid-current-version" };
  }

  const lookup = input.dependencies?.lookupVersion
    ?? ((selected: UpdateChannel) => lookupRegistryVersion(selected, env, input.timeoutMs ?? 5_000));
  const handoff = input.dependencies?.handoff
    ?? ((version: string, forwardedArgs: string[]) => handoffToVersion(version, forwardedArgs, env));

  let availableVersion: string | null;
  try {
    availableVersion = await lookup(channel);
  } catch (error) {
    debug(`lookup failed: ${error instanceof Error ? error.message : String(error)}`, env);
    return { handled: false, currentVersion: input.currentVersion, channel, reason: "lookup-failed" };
  }

  if (!availableVersion) {
    return { handled: false, currentVersion: input.currentVersion, channel, reason: "lookup-failed" };
  }
  if (!semver.valid(availableVersion)) {
    debug(`registry returned invalid version: ${availableVersion}`, env);
    return {
      handled: false,
      currentVersion: input.currentVersion,
      channel,
      availableVersion,
      reason: "invalid-registry-version"
    };
  }
  if (!shouldHandoff(input.currentVersion, availableVersion)) {
    return {
      handled: false,
      currentVersion: input.currentVersion,
      channel,
      availableVersion,
      reason: "already-current"
    };
  }

  const exitCode = await handoff(availableVersion, args);
  if (exitCode === null) {
    debug(`failed to hand off to yaaw-se@${availableVersion}; continuing current package`, env);
    return {
      handled: false,
      currentVersion: input.currentVersion,
      channel,
      availableVersion,
      targetVersion: availableVersion,
      reason: "handoff-failed"
    };
  }

  return {
    handled: true,
    currentVersion: input.currentVersion,
    channel,
    availableVersion,
    targetVersion: availableVersion,
    exitCode,
    reason: "handed-off"
  };
}
