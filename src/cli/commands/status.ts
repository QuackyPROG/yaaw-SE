import { resolveProjectRoot } from "../../installer/boundary.js";
import { inspectStatus } from "../../installer/status.js";

export async function runStatus(options: {directory?:string;json?:boolean} = {}) {
  const root = await resolveProjectRoot(options.directory ?? process.cwd());
  const status = await inspectStatus(root);
  if (options.json) console.log(JSON.stringify(status,null,2));
  else if (!status.installed) console.log("YAAW-SE is not installed in this project.");
  else {
    console.log(`YAAW-SE ${status.version}`);
    console.log(`Project: ${root}`);
    console.log(`Core: ${status.healthy ? "healthy" : "needs attention"}`);
    console.log(`Project memory: ${status.projectMemory ? "present" : "missing"}`);
    console.log(`Integrations: ${status.integrations.join(", ") || "none"}`);
    console.log(`Managed files: ${status.managedFiles.healthy} healthy, ${status.managedFiles.modified} modified, ${status.managedFiles.missing} missing, ${status.managedFiles.localOverrides} local overrides`);
    if (status.managedConfigKeys) console.log(`Managed config keys: ${status.managedConfigKeys.healthy} healthy, ${status.managedConfigKeys.modified} modified, ${status.managedConfigKeys.missing} missing, ${status.managedConfigKeys.localOverrides} local overrides`);
    if (status.issues.length) for (const issue of status.issues) console.log(`- ${issue}`);
  }
  return status;
}
