import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots:string[]=[];const sourceSystem=resolve(".yaaw-core/system");
function git(root:string,...args:string[]){return execFileSync("git",["-C",root,...args],{encoding:"utf8"})}
async function walk(dir:string):Promise<string[]>{const out:string[]=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
async function sha256(path:string){return createHash("sha256").update(await readFile(path)).digest("hex")}
async function fixture(status="READY"){
  const root=await mkdtemp(join(tmpdir(),"yaaw-runtime-"));roots.push(root);await mkdir(join(root,".yaaw-core"),{recursive:true});await cp(sourceSystem,join(root,".yaaw-core/system"),{recursive:true});for(const dir of ["project/specs","project/tickets","project/evidence","project/reviews","project/research","project/rules","runtime","install"])await mkdir(join(root,".yaaw-core",dir),{recursive:true});
  await writeFile(join(root,".yaaw-core/project/product.md"),`---\nschema: yaaw.product/v1\nrevision: 1\nstatus: ready\n---\n# Product\n`);
  await writeFile(join(root,".yaaw-core/project/engineering.md"),`---\nschema: yaaw.engineering/v2\nrevision: 1\nstatus: ready\nproduct_revision: 1\ncurrent_frontier: FRONTIER-001\nreadiness: PASS\nscope_status: OPEN\n---\n# Engineering\n`);
  await writeFile(join(root,".yaaw-core/project/specs/SPEC-001.md"),`---\nschema: yaaw.spec/v1\nid: SPEC-001\nrevision: 1\nstatus: ACCEPTED\nproduct_revision: 1\nengineering_revision: 1\nfrontier_id: FRONTIER-001\ndecision_ids: []\n---\n# SPEC-001\n`);
  await writeFile(join(root,".yaaw-core/project/tickets/TASK-001.md"),`---\nschema: yaaw.ticket/v1\nid: TASK-001\nrevision: 1\nspec: SPEC-001\nspec_revision: 1\nproduct_revision: 1\nengineering_revision: 1\nstatus: ${status}\ndependencies: []\ndecision_ids: []\nexpertise: []\n---\n# TASK-001\n`);
  const managedFiles:Record<string,any>={};for(const path of await walk(join(root,".yaaw-core/system"))){const r=relative(root,path).replaceAll("\\","/");managedFiles[r]={owner:"package:system",sha256:await sha256(path),localOverride:false}}
  await writeFile(join(root,".yaaw-core/install/manifest.json"),JSON.stringify({schema:"yaaw.installation/v2",yaawVersion:"0.3.0-test",systemSchema:4,installationSchema:3,projectSchema:3,installedAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z",project:{root:"."},integrations:{},skills:[],managedFiles,managedSections:{},managedConfigKeys:{}},null,2)+"\n");
  git(root,"init");git(root,"config","user.email","yaaw@example.test");git(root,"config","user.name","YAAW Test");git(root,"add",".");git(root,"commit","-m","fixture");return root;
}
function run(root:string,...extra:string[]){const tool=join(root,".yaaw-core/system/engine/runtime.mjs");try{return JSON.parse(execFileSync(process.execPath,[tool,"--workspace",root,...extra],{encoding:"utf8"}))}catch(error:any){const stdout=error?.stdout?.toString?.()??"";if(stdout)return JSON.parse(stdout);throw error}}
async function handoff(root:string){return JSON.parse(await readFile(join(root,".yaaw-core/runtime/handoff.json"),"utf8"))}
async function ticketStatus(root:string){const text=await readFile(join(root,".yaaw-core/project/tickets/TASK-001.md"),"utf8");return text.match(/^status:\s*(\S+)/m)?.[1]}
async function writeStart(root:string,repository:any){await writeFile(join(root,".yaaw-core/project/evidence/EVIDENCE-TASK-001-S1.json"),JSON.stringify({schema:"yaaw.evidence/v3",id:"EVIDENCE-TASK-001-S1",ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_start",result:"STARTED",repository,workflow:"implementation.implement-ticket",commands:[],checks:[]},null,2)+"\n")}
async function writeVerification(root:string,repository:any,result="PASS",id="V1"){await writeFile(join(root,`.yaaw-core/project/evidence/EVIDENCE-TASK-001-${id}.json`),JSON.stringify({schema:"yaaw.evidence/v3",id:`EVIDENCE-TASK-001-${id}`,ticket:"TASK-001",ticket_revision:1,spec_revision:1,kind:"implementation_verification",result,repository,workflow:"implementation.verify-ticket",commands:[],checks:[]},null,2)+"\n")}
async function writeReview(root:string,repository:any,evidence=["EVIDENCE-TASK-001-V1"]){await writeFile(join(root,".yaaw-core/project/reviews/TASK-001-R1.md"),`---\nschema: yaaw.review/v2\nticket: TASK-001\nround: 1\nresult: PASS\nticket_revision: 1\nspec_revision: 1\nrepository:\n  schema: yaaw.repository-identity/v2\n  algorithm: yaaw-worktree-v3\n  status: READY\n  workspace_scope: .\n  git_root_relation: same\n  head_commit: ${repository.head_commit}\n  dirty: ${repository.dirty}\n  worktree_digest: ${repository.worktree_digest}\n  components: null\n  changed_paths: []\n  error: null\nevidence:\n${evidence.map(x=>`  - ${x}`).join("\n")}\n---\n# Review\n`)}
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})))});

describe("compact orchestration runtime",()=>{
  it("prepares a workspace-relative v4 handoff and validates exact durable basis",async()=>{const root=await fixture();const prepared=run(root);expect(prepared.type).toBe("DISPATCH_READY");expect(prepared.workflow).toBe("implementation.implement-ticket");const h=await handoff(root);expect(h.schema).toBe("yaaw.handoff/v4");expect(h.references).toContain(".yaaw-core/project/tickets/TASK-001.md");expect(h.references.every((x:string)=>!x.startsWith(root))).toBe(true);expect(h.basis.ticket_status).toBe("READY");expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");await writeFile(join(root,".yaaw-core/runtime/observed-state.json"),"{\"replaceable\":true}\n");expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");await writeFile(join(root,".yaaw-core/project/product.md"),`---\nschema: yaaw.product/v1\nrevision: 1\nstatus: ready\n---\n# Product\nChanged semantic text.\n`);expect(run(root,"--check-handoff").type).toBe("HANDOFF_STALE")});
  it("reconstructs the same safe route after deleting runtime",async()=>{const root=await fixture();const first=run(root);await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});const second=run(root);expect(second.type).toBe("DISPATCH_READY");expect(second.workflow).toBe(first.workflow);expect(second.ticket).toBe(first.ticket)});
  it("adopts implementation start and PASS verification into ticket frontmatter",async()=>{const root=await fixture();run(root);const repo=(await handoff(root)).repository;await writeStart(root,repo);let next=run(root);expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.to).toBe("IN_PROGRESS");expect(run(root,"--reconcile-one").type).toBe("RECONCILED");expect(await ticketStatus(root)).toBe("IN_PROGRESS");await writeVerification(root,repo);next=run(root);expect(next.reconciliation.to).toBe("REVIEW_REQUIRED");expect(run(root,"--reconcile-one").type).toBe("RECONCILED");expect(await ticketStatus(root)).toBe("REVIEW_REQUIRED")});
  it("does not promote failed verification",async()=>{const root=await fixture();run(root);const repo=(await handoff(root)).repository;await writeStart(root,repo);run(root,"--reconcile-one");await writeVerification(root,repo,"FAIL");const next=run(root);expect(next.type).toBe("DISPATCH_READY");expect(next.workflow).toBe("implementation.verify-ticket");expect(await ticketStatus(root)).toBe("IN_PROGRESS")});
  it("adopts current independent review PASS",async()=>{const root=await fixture("REVIEW_REQUIRED");run(root);const inspected=run(root,"--inspect-only");const repo=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;await writeVerification(root,repo);await writeReview(root,repo);const next=run(root);expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.id).toBe("REVIEW_RESULT_UNAPPLIED");expect(next.reconciliation.to).toBe("PASS");expect(run(root,"--reconcile-one").type).toBe("RECONCILED");expect(await ticketStatus(root)).toBe("PASS");void inspected});
  it("routes DRAFT tickets to Planner admission",async()=>{const root=await fixture("DRAFT");const next=run(root);expect(next.type).toBe("DISPATCH_READY");expect(next.workflow).toBe("planning.create-tickets");expect(next.role).toBe("planner")});
  it("recovers a stale PASS then autonomously advances to the next spec, ticket, and implementation",async()=>{
    const root=await fixture("REPLAN_REQUIRED");
    const ticket=join(root,".yaaw-core/project/tickets/TASK-001.md");
    await writeFile(ticket,(await readFile(ticket,"utf8")).replace("expertise: []","expertise: []\naffected_paths: [src/task1/]"));
    run(root,"--inspect-only");
    const repository=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
    await writeVerification(root,repository);
    await writeReview(root,repository);
    const reviewPath=join(root,".yaaw-core/project/reviews/TASK-001-R1.md");
    await writeFile(reviewPath,(await readFile(reviewPath,"utf8")).replace("---\n# Review","affected_paths: [src/task1/]\nscope_verified: true\n---\n# Review"));
    let next=run(root);
    expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.id).toBe("RECOVER_ACCEPTED_HISTORY");
    expect(run(root,"--reconcile-one").type).toBe("RECONCILED");
    expect(await ticketStatus(root)).toBe("PASS");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    await writeFile(join(root,".yaaw-core/project/engineering.md"),`---\nschema: yaaw.engineering/v2\nrevision: 2\nstatus: ready\nproduct_revision: 1\ncurrent_frontier: FRONTIER-002\nreadiness: PASS\nscope_status: OPEN\nrevision_changes: [{ "revision": 2, "impact": "NONE", "reason": "Independent feature planning, no existing ENG decision changed" }]\n---\n# Engineering\n`);
    next=run(root);expect(next.type).toBe("DISPATCH_READY");expect(next.workflow).toBe("planning.create-spec");
    await writeFile(join(root,".yaaw-core/project/specs/SPEC-002.md"),`---\nschema: yaaw.spec/v1\nid: SPEC-002\nrevision: 1\nstatus: ACCEPTED\nproduct_revision: 1\nengineering_revision: 2\nfrontier_id: FRONTIER-002\ndecision_ids: [ENG-002]\n---\n# Specification 2\n`);
    next=run(root);expect(next.workflow).toBe("planning.create-tickets");
    await writeFile(join(root,".yaaw-core/project/tickets/TASK-002.md"),`---\nschema: yaaw.ticket/v1\nid: TASK-002\nrevision: 1\nspec: SPEC-002\nspec_revision: 1\nproduct_revision: 1\nengineering_revision: 2\nstatus: READY\ndependencies: [TASK-001]\ndecision_ids: [ENG-002]\nexpertise: []\naffected_paths: [src/task2/]\n---\n# Ticket 2\n`);
    next=run(root);expect(next.type).toBe("DISPATCH_READY");expect(next.workflow).toBe("implementation.implement-ticket");expect(next.ticket).toBe("TASK-002");
  });
  it("reconstructs comsoc-style pending audit and routes re-verification after runtime deletion",async()=>{
    const root=await fixture("REPLAN_REQUIRED");
    const original=run(root,"--inspect-only");
    expect(original.type).toBe("INSPECTED");
    const oldRepo=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
    await writeVerification(root,oldRepo);
    await writeReview(root,oldRepo);
    const oldEngineer=join(root,".yaaw-core/project/engineering.md");
    await writeFile(oldEngineer,(await readFile(oldEngineer,"utf8")).replace("revision: 1","revision: 2"));
    let next=run(root);expect(next.type).toBe("DISPATCH_READY");expect(next.workflow).toBe("planning.audit-revision-impact");expect(next.ticket).toBe("TASK-001");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    next=run(root);expect(next.workflow).toBe("planning.audit-revision-impact");
    await writeFile(oldEngineer,(await readFile(oldEngineer,"utf8")).replace("scope_status: OPEN",`scope_status: OPEN\nrevision_changes: [{"revision":2,"impact":"NONE","reason":"Repository discovery only; accepted foundation unchanged"}]`));
    next=run(root);expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.id).toBe("REVERIFY_UNCERTAIN");
    expect(run(root,"--reconcile-one").type).toBe("RECONCILED");
    expect(await ticketStatus(root)).toBe("REVIEW_REQUIRED");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    next=run(root);expect(next.type).toBe("DISPATCH_READY");expect(next.workflow).toBe("implementation.verify-ticket");
    const now=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
    await writeVerification(root,now,"PASS","V2");
    next=run(root);expect(next.workflow).toBe("review.review-ticket");
    const freshReview=join(root,".yaaw-core/project/reviews/TASK-001-R2.md");
    await writeFile(freshReview,(await readFile(join(root,".yaaw-core/project/reviews/TASK-001-R1.md"),"utf8")).replace("round: 1","round: 2").replace("  - EVIDENCE-TASK-001-V1","  - EVIDENCE-TASK-001-V2").replace(oldRepo.worktree_digest,now.worktree_digest).replace(oldRepo.head_commit,now.head_commit));
    next=run(root);expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.to).toBe("PASS");
    expect(run(root,"--reconcile-one").type).toBe("RECONCILED");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    next=run(root);expect(next.workflow).toBe("planning.create-spec");
    expect(await ticketStatus(root)).toBe("PASS");
  });
  it("diagnoses a pre-existing invalidated_by marker and recovers despite pending new-frontier readiness",async()=>{
    const root=await fixture("REPLAN_REQUIRED");
    const ticket=join(root,".yaaw-core/project/tickets/TASK-001.md");
    run(root,"--inspect-only");
    const old=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
    await writeVerification(root,old);await writeReview(root,old);
    await writeFile(ticket,(await readFile(ticket,"utf8")).replace("expertise: []","expertise: []\ninvalidated_by: ENGINEERING_REVISION_CHANGED"));
    const eng=join(root,".yaaw-core/project/engineering.md");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("revision: 1","revision: 2").replace("readiness: PASS",
      'readiness: pending\nrevision_changes: [{"revision":2,"impact":"NONE","reason":"Repository understanding-only refresh after foundation acceptance"}]'));
    const before=await readFile(ticket,"utf8");
    let diagnostic=run(root,"--diagnose");
    expect(diagnostic.type).toBe("DIAGNOSTIC");
    expect(diagnostic.tickets[0].invalidated_by).toBe("ENGINEERING_REVISION_CHANGED");
    expect(diagnostic.tickets[0].historical_pass_linked).toBe(true);
    expect(diagnostic.tickets[0].contract.kind).toBe("UNKNOWN");
    expect(diagnostic.next.workflow).toBe("planning.audit-revision-impact");
    expect(await readFile(ticket,"utf8")).toBe(before);
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    expect(run(root).workflow).toBe("planning.audit-revision-impact");
    // Planner audits original marker, preserving original revision and adding a dated provenance note.
    await writeFile(ticket,before.replace("invalidated_by: ENGINEERING_REVISION_CHANGED\n","")+"\n## Provenance correction\nThe legacy marker was equality-only, not material.\n");
    let next=run(root);expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.to).toBe("REVIEW_REQUIRED");
    expect(run(root,"--reconcile-one").type).toBe("RECONCILED");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    next=run(root);
    expect(next.type).toBe("DISPATCH_READY");
    expect(next.workflow).toBe("implementation.verify-ticket");
    expect(next.ticket).toBe("TASK-001");
  });

  it("after TASK-001 PASS, persists route selection and executes decision-frontier then next PRD spec",async()=>{
    const root=await fixture("PASS");
    // The original independent review certified a conservative path scope.
    const ticket=join(root,".yaaw-core/project/tickets/TASK-001.md");
    await writeFile(ticket,(await readFile(ticket,"utf8")).replace("expertise: []","expertise: []\naffected_paths: [src/task1/]"));
    run(root,"--inspect-only");
    const repo=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
    await writeVerification(root,repo);await writeReview(root,repo);
    const review=join(root,".yaaw-core/project/reviews/TASK-001-R1.md");
    await writeFile(review,(await readFile(review,"utf8")).replace("---\n# Review","affected_paths: [src/task1/]\nscope_verified: true\n---\n# Review"));
    const eng=join(root,".yaaw-core/project/engineering.md");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("readiness: PASS","readiness: pending"));
    let p=run(root);
    expect(p.type).toBe("DISPATCH_READY");expect(p.workflow).toBe("planning.route");
    expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");
    expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    const directive=[
      "planning_next:",
      "  workflow: planning.decision-frontier",
      "  product_revision: 1",
      "  engineering_revision: 1",
      "  status: ready",
      "  current_frontier: FRONTIER-001",
      "  readiness: pending",
      "  reason: Existing foundation accepted; plan the next unmet PRD frontier."
    ].join("\n");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("scope_status: OPEN","scope_status: OPEN\n"+directive));
    const diagnosis=run(root,"--diagnose");
    expect(diagnosis.planning_next?.workflow).toBe("planning.decision-frontier");
    expect(diagnosis.next.workflow).toBe("planning.decision-frontier");
    p=run(root);
    expect(p.type).toBe("DISPATCH_READY");expect(p.workflow).toBe("planning.decision-frontier");
    expect(p.role).toBe("planner");expect(p.operation).toBe("decision-frontier");
    expect((await handoff(root)).references).toContain(".yaaw-core/project/engineering.md");
    expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");
    expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    p=run(root);expect(p.workflow).toBe("planning.decision-frontier");
    // The worker executes the selected operation and consumes the old directive.
    let text=await readFile(eng,"utf8");
    text=text.replace("revision: 1","revision: 2").replace("current_frontier: FRONTIER-001","current_frontier: FRONTIER-002")
      .replace("readiness: pending","readiness: PASS")
      .replace("\n"+directive,"")
      .replace("scope_status: OPEN","scope_status: OPEN\nrevision_changes: [{\"revision\":2,\"impact\":\"NONE\",\"reason\":\"Next frontier planning does not alter accepted foundation\"}]");
    await writeFile(eng,text);
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    p=run(root);expect(p.type).toBe("DISPATCH_READY");expect(p.workflow).toBe("planning.create-spec");
    await writeFile(join(root,".yaaw-core/project/specs/SPEC-002.md"),
      "---\nschema: yaaw.spec/v1\nid: SPEC-002\nrevision: 1\nstatus: ACCEPTED\nproduct_revision: 1\nengineering_revision: 2\nfrontier_id: FRONTIER-002\ndecision_ids: [ENG-002]\n---\n# New scope\n");
    p=run(root);expect(p.workflow).toBe("planning.create-tickets");
    await writeFile(join(root,".yaaw-core/project/tickets/TASK-002.md"),
      "---\nschema: yaaw.ticket/v1\nid: TASK-002\nrevision: 1\nspec: SPEC-002\nspec_revision: 1\nproduct_revision: 1\nengineering_revision: 2\nstatus: READY\ndependencies: [TASK-001]\ndecision_ids: [ENG-002]\nexpertise: []\naffected_paths: [src/task2/]\n---\n# New ticket\n");
    p=run(root);expect(p.workflow).toBe("implementation.implement-ticket");expect(p.ticket).toBe("TASK-002");
  });
  it("ignores stale or unauthorized planner selectors and refuses repeated unchanged subworkflow",async()=>{
    const root=await fixture("READY");
    const eng=join(root,".yaaw-core/project/engineering.md");
    const directive=[
      "planning_next:",
      "  workflow: planning.decision-frontier",
      "  product_revision: 1",
      "  engineering_revision: 1",
      "  status: ready",
      "  current_frontier: FRONTIER-001",
      "  readiness: pending",
      "  reason: Determine a bounded next feature."
    ].join("\n");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("readiness: PASS","readiness: pending")
      .replace("scope_status: OPEN","scope_status: OPEN\n"+directive));
    let p=run(root);expect(p.workflow).toBe("planning.decision-frontier");
    expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    await writeFile(eng,(await readFile(eng,"utf8"))+"\n# Planner note with no completed step\n");
    p=run(root);expect(p.type).toBe("BLOCKED");expect(p.reason).toBe("NO_PROGRESS_REPEATED_HANDOFF");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("  product_revision: 1","  product_revision: 9"));
    p=run(root);expect(p.workflow).toBe("planning.route");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("  product_revision: 9","  product_revision: 1").replace("workflow: planning.decision-frontier","workflow: implementation.implement-ticket"));
    p=run(root);expect(p.workflow).toBe("planning.route");
  });

  it("SPEC-002 dependent tickets recover a dirty PASS once and remain runnable across planning churn",async()=>{
    const root=await fixture("PASS"),project=join(root,".yaaw-core/project");
    await mkdir(join(root,"lib"),{recursive:true});
    await writeFile(join(root,"lib/foundation.dart"),"void foundation() {}\n");
    const ticket=join(project,"tickets/TASK-001.md");
    await writeFile(ticket,(await readFile(ticket,"utf8")).replace("expertise: []","expertise: []\naffected_paths: [lib/]"));
    run(root,"--inspect-only");
    const original=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
    expect(original.dirty).toBe(true);
    await writeVerification(root,original,"PASS","V1");
    await writeReview(root,original);
    const r1=join(project,"reviews/TASK-001-R1.md");
    await writeFile(r1,(await readFile(r1,"utf8")).replace("---\n# Review","affected_paths: [lib/]\nscope_verified: true\n---\n# Review"));
    const eng=join(project,"engineering.md");
    await writeFile(eng,(await readFile(eng,"utf8")).replace("revision: 1","revision: 2")
      .replace("current_frontier: FRONTIER-001","current_frontier: FRONTIER-002")
      .replace("scope_status: OPEN",'scope_status: OPEN\nrevision_changes: [{"revision":2,"impact":"NONE","reason":"Next frontier only; foundation unchanged"}]'));
    await writeFile(join(project,"specs/SPEC-002.md"),
      "---\nschema: yaaw.spec/v1\nid: SPEC-002\nrevision: 1\nstatus: ACCEPTED\nproduct_revision: 1\nengineering_revision: 2\nfrontier_id: FRONTIER-002\ndecision_ids: [ENG-002]\n---\n# Identity\n");
    await writeFile(join(project,"tickets/TASK-002.md"),
      "---\nschema: yaaw.ticket/v1\nid: TASK-002\nrevision: 1\nspec: SPEC-002\nspec_revision: 1\nproduct_revision: 1\nengineering_revision: 2\nstatus: READY\ndependencies: [TASK-001]\ndecision_ids: [ENG-002]\nexpertise: []\naffected_paths: [src/identity/]\n---\n# Identity ticket\n");
    let result=run(root);
    expect(result.type).toBe("RECONCILE_REQUIRED");expect(result.reconciliation.id).toBe("REVERIFY_UNCERTAIN");
    expect(result.reconciliation.subject).toBe("TASK-001");
    expect(run(root,"--reconcile-one").type).toBe("RECONCILED");
    result=run(root);expect(result.workflow).toBe("implementation.verify-ticket");
    const latest=(await handoff(root)).repository;
    const scopeTool=join(root,".yaaw-core/system/engine/scope-identity.mjs");
    const scope=JSON.parse(execFileSync(process.execPath,[scopeTool,"--workspace",root,"--ticket","TASK-001"],{encoding:"utf8"}));
    expect(scope.status).toBe("READY");expect(scope.files).toBe(1);
    await writeVerification(root,latest,"PASS","V2");
    const v2=join(project,"evidence/EVIDENCE-TASK-001-V2.json");
    const record=JSON.parse(await readFile(v2,"utf8"));
    record.scope_identity=scope;await writeFile(v2,JSON.stringify(record,null,2)+"\n");
    result=run(root);expect(result.workflow).toBe("review.review-ticket");
    const block=(await readFile(r1,"utf8")).match(/repository:\n(?:  .*\n)+/);
    expect(block).not.toBeNull();
    const updated=[
      "repository:","  schema: "+latest.schema,"  algorithm: "+latest.algorithm,
      "  status: "+latest.status,"  workspace_scope: "+latest.workspace_scope,
      "  git_root_relation: "+latest.git_root_relation,"  head_commit: "+latest.head_commit,
      "  dirty: "+latest.dirty,"  worktree_digest: "+latest.worktree_digest,
      "  components: null","  changed_paths: []","  error: null",""
    ].join("\n");
    let review=(await readFile(r1,"utf8")).replace(block![0],updated)
      .replace("round: 1","round: 2")
      .replace("  - EVIDENCE-TASK-001-V1","  - EVIDENCE-TASK-001-V2")
      .replace("scope_verified: true","scope_verified: true\nscope_identity: "+JSON.stringify(scope));
    await writeFile(join(project,"reviews/TASK-001-R2.md"),review);
    result=run(root);expect(result.type).toBe("RECONCILE_REQUIRED");
    expect(result.reconciliation.to).toBe("PASS");
    expect(run(root,"--reconcile-one").type).toBe("RECONCILED");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    result=run(root);
    expect(result.workflow).toBe("implementation.implement-ticket");expect(result.ticket).toBe("TASK-002");
    await writeFile(eng,(await readFile(eng,"utf8"))+"\n### Future planning\nUnrelated information.\n");
    result=run(root);expect(result.workflow).toBe("implementation.implement-ticket");
    await writeFile(join(root,"lib/foundation.dart"),"void changedFoundation() {}\n");
    result=run(root);expect(result.type).toBe("RECONCILE_REQUIRED");
    expect(result.reconciliation.id).toBe("REVERIFY_REQUIRED");
    expect(result.reconciliation.subject).toBe("TASK-001");
  });

  it("PRD durable selection dispatches a question-round once and reconstructs after runtime deletion",async()=>{
    const root=await fixture("READY"),product=join(root,".yaaw-core/project/product.md");
    await writeFile(product,(await readFile(product,"utf8")).replace("status: ready","status: draft"));
    let next=run(root);expect(next.workflow).toBe("prd.route");
    expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    const directive=[
      "product_next:",
      "  workflow: prd.question-round",
      "  product_revision: 1",
      "  status: draft",
      "  reason: Material account ownership requirements need human input."
    ].join("\n");
    await writeFile(product,(await readFile(product,"utf8")).replace("status: draft","status: draft\n"+directive));
    next=run(root);expect(next.workflow).toBe("prd.question-round");expect(next.role).toBe("prd");
    expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");
    expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    await writeFile(product,(await readFile(product,"utf8"))+"\nUnrelated formatting, directive not consumed.\n");
    const repeat=run(root);expect(repeat.reason).toBe("NO_PROGRESS_REPEATED_HANDOFF");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    next=run(root);expect(next.workflow).toBe("prd.question-round");
    await writeFile(product,(await readFile(product,"utf8")).replace("status: draft\n"+directive,"status: ready"));
    next=run(root);expect(next.workflow).not.toBe("prd.question-round");
  });
  it("a missing product routes directly to PRD create, not an endless selection",async()=>{
    const root=await fixture("READY");
    await rm(join(root,".yaaw-core/project/product.md"));
    const next=run(root);
    expect(next.type).toBe("DISPATCH_READY");
    expect(next.workflow).toBe("prd.create");
    expect(next.role).toBe("prd");
  });
  it("bounds repeated identical handoffs only after a marked dispatch",async()=>{
    const root=await fixture();expect(run(root).type).toBe("DISPATCH_READY");
    expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");
    expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    const repeat=run(root);expect(repeat.type).toBe("BLOCKED");expect(repeat.reason).toBe("NO_PROGRESS_REPEATED_HANDOFF");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    expect(run(root).type).toBe("DISPATCH_READY");
  });

});

// TASK-001 accepted at product 23; REQ-047 added at product 24.
async function legacyUiFixture(){
  const root=await fixture("PASS");
  for(const name of ["specs/SPEC-001.md","tickets/TASK-001.md"]){
    const path=join(root,".yaaw-core/project",name);
    await writeFile(path,(await readFile(path,"utf8")).replace("product_revision: 1","product_revision: 23"));
  }
  await writeFile(join(root,".yaaw-core/project/product.md"),'---\nschema: yaaw.product/v1\nrevision: 23\nstatus: ready\n---\n# Product\n');
  run(root,"--inspect-only");
  const repo=JSON.parse(await readFile(join(root,".yaaw-core/runtime/observed-state.json"),"utf8")).repository;
  await writeVerification(root,repo);await writeReview(root,repo);
  await writeFile(join(root,".yaaw-core/project/product.md"),'---\nschema: yaaw.product/v1\nrevision: 24\nstatus: ready\nrevision_changes: [{"revision":24,"impact":"SCOPED","ids":["REQ-047"],"reason":"Preserve original Flutter UI on corresponding PWA screens"}]\n---\n# Product\n');
  return root;
}
async function recordAudit(root:string,owner="product",result="INSUFFICIENT_PROVENANCE",missing=["Planner comparison of accepted foundation contract against REQ-047"]){
  const diagnostic=run(root,"--diagnose"),basis=diagnostic.tickets.find((x:any)=>x.ticket==="TASK-001").audit_basis;
  const path=join(root,`.yaaw-core/project/${owner}.md`),text=await readFile(path,"utf8");
  const record={ticket:"TASK-001",basis,result,reason:"Compared legacy foundation contract and original independent PASS with scoped UI addition",evidence:[".yaaw-core/project/specs/SPEC-001.md",".yaaw-core/project/reviews/TASK-001-R1.md"],missing_evidence:result==="INSUFFICIENT_PROVENANCE"?missing:[]};
  await writeFile(path,text.replace(/\n---\n/,`\nrevision_audits: ${JSON.stringify([record])}\n---\n`));return record;
}
describe("completed legacy provenance audits",()=>{
  it("routes the completed TASK-001 / REQ-047 PRD audit to Planner, including after cache removal",async()=>{
    const root=await legacyUiFixture();
    expect(run(root).workflow).toBe("prd.audit-revision-impact");
    expect(run(root,"--check-handoff").type).toBe("HANDOFF_FRESH");expect(run(root,"--dispatch-start").type).toBe("DISPATCH_STARTED");
    await recordAudit(root);
    expect(run(root).workflow).toBe("planning.audit-revision-impact");
    await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    expect(run(root).workflow).toBe("planning.audit-revision-impact");expect(await ticketStatus(root)).toBe("PASS");
  });
  it("stops a completed unresolved Planner audit with exact missing evidence, preserving historic bytes",async()=>{
    const root=await legacyUiFixture();const review=await readFile(join(root,".yaaw-core/project/reviews/TASK-001-R1.md"),"utf8"),verification=await readFile(join(root,".yaaw-core/project/evidence/EVIDENCE-TASK-001-V1.json"),"utf8");
    await recordAudit(root);await recordAudit(root,"engineering","INSUFFICIENT_PROVENANCE",["Human decision whether foundation overview must reproduce the legacy member shell"]);
    for(let n=0;n<2;n++){
      const next=run(root);expect(next.type).toBe("BLOCKED");expect(next.reason).toContain("AUDIT_INSUFFICIENT_PROVENANCE:TASK-001:planner:Human decision");
      await rm(join(root,".yaaw-core/runtime"),{recursive:true,force:true});
    }
    expect(await ticketStatus(root)).toBe("PASS");
    expect(await readFile(join(root,".yaaw-core/project/reviews/TASK-001-R1.md"),"utf8")).toBe(review);
    expect(await readFile(join(root,".yaaw-core/project/evidence/EVIDENCE-TASK-001-V1.json"),"utf8")).toBe(verification);
    expect(run(root,"--diagnose").tickets[0].contract.kind).toBe("UNKNOWN");
  });
  it("accepts evidence-backed Planner applicability without rewriting legacy IDs and requires fresh verification",async()=>{
    const root=await legacyUiFixture();await recordAudit(root);await recordAudit(root,"engineering","CURRENT");
    const next=run(root);expect(next.type).toBe("RECONCILE_REQUIRED");expect(next.reconciliation.id).toBe("REVERIFY_UNCERTAIN");
    run(root,"--reconcile-one");expect(run(root).workflow).toBe("implementation.verify-ticket");
    expect(await readFile(join(root,".yaaw-core/project/tickets/TASK-001.md"),"utf8")).not.toContain("requirement_ids");
  });
  it("routes proven Planner invalidation to replan, while an insufficient audit alone never invalidates",async()=>{
    const root=await legacyUiFixture();await recordAudit(root);await recordAudit(root,"engineering","INVALIDATED");
    const next=run(root);expect(next.reconciliation.id).toBe("CONTRACT_INVALIDATED");
    run(root,"--reconcile-one");expect(run(root).workflow).toBe("planning.replan");
  });
  it("blocks unresolved product revision records instead of handing missing product meaning to Planner",async()=>{
    const root=await legacyUiFixture();const path=join(root,".yaaw-core/project/product.md");
    await writeFile(path,(await readFile(path,"utf8")).replace(/^revision_changes:.*\n/m,""));
    await recordAudit(root,"product","INSUFFICIENT_PROVENANCE",["Historical product 24 change classification"]);
    const next=run(root);expect(next.type).toBe("BLOCKED");expect(next.reason).toContain("Historical product 24 change classification");
  });
  it("rejects stale audit results after contract text changes and never overrides explicit source invalidation",async()=>{
    const root=await legacyUiFixture();await recordAudit(root);await recordAudit(root,"engineering","CURRENT");
    const path=join(root,".yaaw-core/project/tickets/TASK-001.md");await writeFile(path,(await readFile(path,"utf8"))+"\nChanged contract obligation\n");
    expect(run(root).workflow).toBe("prd.audit-revision-impact");
    await writeFile(path,(await readFile(path,"utf8")).replace("expertise: []","expertise: []\nrequirement_ids: [REQ-047]"));
    await recordAudit(root,"engineering","CURRENT");expect(run(root).reconciliation.id).toBe("CONTRACT_INVALIDATED");
  });
  it("permits admitted independent work but blocks a dependency on unknown acceptance",async()=>{
    const root=await legacyUiFixture();await recordAudit(root);await recordAudit(root,"engineering","INSUFFICIENT_PROVENANCE",["Historical source mapping"]);
    await writeFile(join(root,".yaaw-core/project/specs/SPEC-002.md"),'---\nschema: yaaw.spec/v1\nid: SPEC-002\nrevision: 1\nstatus: ACCEPTED\nproduct_revision: 24\nengineering_revision: 1\nfrontier_id: FRONTIER-002\n---\n# Independent UI\n');
    const path=join(root,".yaaw-core/project/tickets/TASK-002.md");
    const text='---\nschema: yaaw.ticket/v1\nid: TASK-002\nrevision: 1\nspec: SPEC-002\nspec_revision: 1\nproduct_revision: 24\nengineering_revision: 1\nstatus: READY\ndependencies: []\nexpertise: []\n---\n# Independent UI\n';
    await writeFile(path,text);expect(run(root).ticket).toBe("TASK-002");expect(run(root).workflow).toBe("implementation.implement-ticket");
    await writeFile(path,text.replace("dependencies: []","dependencies: [TASK-001]"));expect(run(root).type).toBe("BLOCKED");
  });
});
