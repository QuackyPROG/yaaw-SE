import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { migrationPath, type Migration } from "../../src/installer/migrations/index.js";
import { migrateInstallationManifest } from "../../src/installer/migrations/installation/index.js";
import { projectMigrations } from "../../src/installer/migrations/project/index.js";
import { emptyManifest } from "../../src/installer/manifest.js";

function migration(from:number,to:number):Migration{return{from,to,describe:()=>`${from}->${to}`,plan:async()=>[]}}

describe("schema migration routing",()=>{
  it("composes skipped-version upgrades in order",()=>expect(migrationPath([migration(1,2),migration(2,3),migration(3,4)],1,4).map(m=>[m.from,m.to])).toEqual([[1,2],[2,3],[3,4]]));
  it("rejects schema downgrades",()=>expect(()=>migrationPath([],3,2)).toThrow(/downgrade/i));
  it("rejects incomplete migration chains",()=>expect(()=>migrationPath([migration(1,2)],1,3)).toThrow(/No migration registered/));
});

describe("project v1 -> v2 migration",()=>{
  it("preserves durable bodies while adding scope semantics",async()=>{
    const root=await mkdtemp(join(tmpdir(),"yaaw-migrate-"));try{
      const project=join(root,".yaaw-core/project");await mkdir(project,{recursive:true});
      await writeFile(join(project,"state.json"),JSON.stringify({schema:"yaaw.project-state/v1",phase:"implementation",product:{artifact:".yaaw-core/project/product.md",status:"ready",revision:1},planning:{artifact:".yaaw-core/project/engineering.md",status:"ready",revision:1,current_frontier:"F-1",readiness:"PASS",active_spec:"SPEC-001"},active_ticket:"TASK-001",tickets:{"TASK-001":"READY"},transition_sequence:1,last_transition:null,blocker:null,last_observed_commit:null,last_workflow:null},null,2));
      await writeFile(join(project,"engineering.md"),"---\nschema: yaaw.engineering/v1\nrevision: 1\nstatus: ready\nproduct_revision: 1\ncurrent_frontier: F-1\nreadiness: PASS\n---\n# Engineering\n\n## Decisions\nKeep this body.\n");
      const step=projectMigrations.find(m=>m.from===1)!;const ops:any[]=await step.plan({projectRoot:root,payloadRoot:root,fromVersion:1,toVersion:2});
      const stateOp=ops.find(op=>op.type==="migrate-project-file"&&op.path.endsWith("state.json"));const engOp=ops.find(op=>op.type==="migrate-project-file"&&op.path.endsWith("engineering.md"));
      expect(JSON.parse(stateOp.content).schema).toBe("yaaw.project-state/v2");expect(JSON.parse(stateOp.content).planning.scope_status).toBe("UNKNOWN");
      expect(engOp.content).toContain("schema: yaaw.engineering/v2");expect(engOp.content).toContain("scope_status: UNKNOWN");expect(engOp.content).toContain("Keep this body.");
    }finally{await rm(root,{recursive:true,force:true})}
  });
});

describe("installation manifest configuration migration",()=>{
  it("preserves existing Codex runtime settings exactly",()=>{const old=emptyManifest("0.2.1");old.installationSchema=2;const runtime:any={mode:"auto",orchestrator:{model:"custom-model",reasoning:"high"},defaultWorker:{model:null,reasoning:null},roles:{prd:{model:null,reasoning:null},planner:{model:"planner-custom",reasoning:"medium"},implementer:{model:null,reasoning:null},reviewer:{model:null,reasoning:null}},maxConcurrentThreads:7,sandboxMode:null,approvalPolicy:null,webSearch:null};old.integrations.codex={adapterVersion:2,skillsRoot:".agents/skills",bootstrap:"AGENTS.md",runtime};const migrated=migrateInstallationManifest(old);expect(migrated.installationSchema).toBe(3);expect(migrated.integrations.codex.configuration?.settings).toEqual(runtime)});
});
