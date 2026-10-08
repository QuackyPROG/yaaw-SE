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
  it("rejects downgrades",()=>expect(()=>migrationPath([],3,2)).toThrow(/downgrade/i));
  it("rejects incomplete chains",()=>expect(()=>migrationPath([migration(1,2)],1,3)).toThrow(/No migration registered/));
  it("registers project v1->v2->v3",()=>expect(projectMigrations.map(m=>[m.from,m.to])).toEqual([[1,2],[2,3]]));
});

describe("project migrations",()=>{
  it("v1->v2 preserves engineering body and adds scope semantics",async()=>{const root=await mkdtemp(join(tmpdir(),"yaaw-migrate-"));try{const p=join(root,".yaaw-core/project");await mkdir(p,{recursive:true});await writeFile(join(p,"state.json"),JSON.stringify({schema:"yaaw.project-state/v1",phase:"implementation",product:{status:"ready",revision:1},planning:{status:"ready",revision:1,readiness:"PASS"},tickets:{"TASK-001":"READY"}}));await writeFile(join(p,"engineering.md"),"---\nschema: yaaw.engineering/v1\nrevision: 1\nstatus: ready\nproduct_revision: 1\ncurrent_frontier: F-1\nreadiness: PASS\n---\n# Engineering\nKeep this body.\n");const ops:any[]=await projectMigrations[0].plan({projectRoot:root,payloadRoot:root,fromVersion:1,toVersion:2});const eng=ops.find(op=>op.type==="migrate-project-file"&&op.path.endsWith("engineering.md"));expect(eng.content).toContain("schema: yaaw.engineering/v2");expect(eng.content).toContain("scope_status: UNKNOWN");expect(eng.content).toContain("Keep this body.")}finally{await rm(root,{recursive:true,force:true})}});
  it("v2->v3 moves lifecycle truth into tickets then removes legacy ledger",async()=>{const root=await mkdtemp(join(tmpdir(),"yaaw-migrate3-"));try{const p=join(root,".yaaw-core/project"),tickets=join(p,"tickets");await mkdir(tickets,{recursive:true});await writeFile(join(p,"state.json"),JSON.stringify({schema:"yaaw.project-state/v2",tickets:{"TASK-001":"REVIEW_REQUIRED"}}));await writeFile(join(tickets,"TASK-001.md"),"---\nschema: yaaw.ticket/v1\nid: TASK-001\nrevision: 1\nspec: SPEC-001\nspec_revision: 1\nproduct_revision: 1\nengineering_revision: 1\nstatus: READY\ndependencies: []\ndecision_ids: []\nexpertise: []\n---\n# Ticket\n");const ops:any[]=await projectMigrations[1].plan({projectRoot:root,payloadRoot:root,fromVersion:2,toVersion:3});const ticket=ops.find(op=>op.type==="migrate-project-file"&&op.path.endsWith("TASK-001.md"));expect(ticket.content).toContain("status: REVIEW_REQUIRED");expect(ops.some(op=>op.type==="remove-project-file-migration"&&op.path.endsWith("state.json"))).toBe(true)}finally{await rm(root,{recursive:true,force:true})}});
});

describe("installation manifest configuration migration",()=>{it("preserves existing Codex runtime settings",()=>{const old=emptyManifest("0.2.1");old.installationSchema=2;const runtime:any={mode:"auto",orchestrator:{model:"custom-model",reasoning:"high"},defaultWorker:{model:null,reasoning:null},roles:{prd:{model:null,reasoning:null},planner:{model:"planner-custom",reasoning:"medium"},implementer:{model:null,reasoning:null},reviewer:{model:null,reasoning:null}},maxConcurrentThreads:7,sandboxMode:null,approvalPolicy:null,webSearch:null};old.integrations.codex={adapterVersion:2,skillsRoot:".agents/skills",bootstrap:"AGENTS.md",runtime};const migrated=migrateInstallationManifest(old);expect(migrated.installationSchema).toBe(3);expect(migrated.integrations.codex.configuration?.settings).toEqual(runtime)})});
