import { resolveProjectRoot } from "../../installer/boundary.js";
import { doctor } from "../../installer/status.js";
import { runInstall } from "./install.js";

export async function runDoctor(options: {directory?:string;json?:boolean;repair?:boolean;forceManaged?:boolean} = {}) {
  if (options.repair) {
    return runInstall({ directory: options.directory, action: "repair", yes: true, forceManaged: options.forceManaged, json: options.json });
  }
  const root = await resolveProjectRoot(options.directory ?? process.cwd());
  const report = await doctor(root);
  if (options.json) console.log(JSON.stringify(report,null,2));
  else {
    console.log(`YAAW-SE doctor: ${report.healthy ? "healthy" : "issues found"}`);
    for (const check of report.checks ?? []) console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
    for (const issue of report.issues ?? []) console.log(`- ${issue}`);
  }
  return report;
}
