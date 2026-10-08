#!/usr/bin/env node
import { deriveState, planNext } from "../.yaaw-core/system/engine/routing.mjs";
import { readFile } from "node:fs/promises";
const kernel=JSON.parse(await readFile(new URL("../.yaaw-core/system/kernel.yaml",import.meta.url),"utf8"));
const repo={schema:"yaaw.repository-identity/v2",algorithm:"yaaw-worktree-v3",status:"READY",workspace_scope:".",git_root_relation:"same",head_commit:"a",dirty:false,worktree_digest:"sha256:x",components:null,changed_paths:[],error:null};
const doc=(meta,path)=>({meta,path,digest:"sha256:"+path});
function artifacts(ticketStatus="READY") { return {product:doc({schema:"yaaw.product/v1",status:"ready",revision:1},".yaaw-core/project/product.md"),engineering:doc({schema:"yaaw.engineering/v2",status:"ready",revision:1,readiness:"PASS",scope_status:"OPEN",current_frontier:"FRONTIER-001"},".yaaw-core/project/engineering.md"),specs:{"SPEC-001":doc({schema:"yaaw.spec/v1",id:"SPEC-001",status:"ACCEPTED",revision:1,product_revision:1,engineering_revision:1},".yaaw-core/project/specs/SPEC-001.md")},tickets:{"TASK-001":doc({schema:"yaaw.ticket/v1",id:"TASK-001",status:ticketStatus,revision:1,spec:"SPEC-001",spec_revision:1,product_revision:1,engineering_revision:1,dependencies:[],expertise:[]},".yaaw-core/project/tickets/TASK-001.md")},reviews:{},evidence:{},research:{},rules:{}} }
let a=artifacts("READY"),state=deriveState(a),next=planNext(kernel,state,a,repo,null);if(next.workflow!=="implementation.implement-ticket")throw new Error(`READY case routed to ${next.workflow}`);
a=artifacts("DRAFT");state=deriveState(a);next=planNext(kernel,state,a,repo,null);if(next.workflow!=="planning.create-tickets")throw new Error(`DRAFT case routed to ${next.workflow}`);
a=artifacts("PASS");state=deriveState(a);next=planNext(kernel,state,a,repo,null);if(next.type!=="RECONCILE_REQUIRED"||next.reconciliation.to!=="REVIEW_REQUIRED")throw new Error('PASS without current acceptance must be revalidated');
a=artifacts("READY");a.tickets["TASK-001"].meta.product_revision=0;state=deriveState(a);next=planNext(kernel,state,a,repo,null);if(next.type!=="RECONCILE_REQUIRED"||next.reconciliation.to!=="REPLAN_REQUIRED")throw new Error('stale executable contract must replan');
console.log('YAAW lifecycle cases passed.');
