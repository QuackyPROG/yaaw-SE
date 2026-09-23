#!/usr/bin/env node
import { Command } from "commander";
import { packageVersion } from "../installer/context.js";
import { runInstall } from "./commands/install.js";
import { runStatus } from "./commands/status.js";
import { runDoctor } from "./commands/doctor.js";

const program = new Command();
program
  .name("yaaw-se")
  .description("Install and maintain project-local YAAW-SE workflows.")
  .version(await packageVersion());

program.command("install")
  .description("Install, update, modify, repair, or safely uninstall YAAW-SE.")
  .option("--directory <path>", "target project directory")
  .option("--tools <ids>", "comma-separated tool IDs")
  .option("--skills <profile-or-list>", "standard, core, or comma-separated skills")
  .option("--yes", "headless/noninteractive mode")
  .option("--action <action>", "fresh|quick-update|modify|repair|uninstall")
  .option("--dry-run", "plan and validate without writing")
  .option("--list-tools", "list supported tool IDs")
  .option("--list-skills", "list public YAAW skills")
  .option("--force-managed", "legacy shorthand for --conflict-policy replace; never affects project memory")
  .option("--conflict-policy <policy>", "fail|keep|replace|backup-replace for modified package-managed files/config")
  .option("--codex-runtime <mode>", "auto|isolated-required|inline")
  .option("--codex-root-model <model>", "inherit or Codex model ID")
  .option("--codex-root-reasoning <effort>", "inherit or reasoning effort")
  .option("--codex-worker-model <model>", "inherit or default subagent model ID")
  .option("--codex-worker-reasoning <effort>", "inherit or default subagent reasoning effort")
  .option("--codex-max-agents <count>", "inherit or positive concurrent thread count")
  .option("--codex-config <path>", "yaaw.codex-install/v1 JSON configuration")
  .option("--json", "emit JSON")
  .action(async options => {
    await runInstall(options);
  });

program.command("status")
  .description("Inspect the current YAAW-SE installation.")
  .option("--directory <path>", "target project directory")
  .option("--json", "emit JSON")
  .action(runStatus);

program.command("doctor")
  .description("Run read-only installation diagnostics.")
  .option("--directory <path>", "target project directory")
  .option("--repair", "repair installation infrastructure using the current manifest")
  .option("--force-managed", "legacy shorthand for --conflict-policy replace")
  .option("--conflict-policy <policy>", "fail|keep|replace|backup-replace for modified package-managed files/config")
  .option("--json", "emit JSON")
  .action(runDoctor);

await program.parseAsync(process.argv);
