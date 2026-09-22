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
  .option("--force-managed", "replace locally modified managed files/sections; never affects project memory")
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
  .option("--force-managed", "replace locally modified managed files during repair")
  .option("--json", "emit JSON")
  .action(runDoctor);

await program.parseAsync(process.argv);
