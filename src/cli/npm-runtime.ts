import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

export interface NpmInvocationOptions {
  capture?: boolean;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function findNpmCli(env: NodeJS.ProcessEnv = process.env): string | null {
  const candidates = [
    env.npm_execpath,
    join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    join(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js")
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find(candidate => existsSync(candidate)) ?? null;
}

export function invokeNpm(args: string[], options: NpmInvocationOptions = {}) {
  const npmCli = findNpmCli(options.env);
  if (!npmCli) {
    return {
      npmCli: null,
      status: null,
      stdout: "",
      stderr: "",
      error: new Error(`Could not locate npm CLI beside Node: ${process.execPath}`)
    };
  }

  const result = spawnSync(process.execPath, [npmCli, ...args], {
    encoding: "utf8",
    stdio: options.capture === false ? "inherit" : "pipe",
    timeout: options.timeoutMs,
    env: options.env ?? process.env
  });

  return {
    npmCli,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error
  };
}
