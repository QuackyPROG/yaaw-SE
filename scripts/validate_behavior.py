#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];S=ROOT/'.yaaw-core/system';errors=[]
def need(path,*phrases):
    text=path.read_text().lower()
    for phrase in phrases:
        if phrase.lower() not in text:errors.append(f'{path.relative_to(ROOT)} missing behavioral contract {phrase!r}')
need(S/'roles/orchestrator.md','traffic controller','delete `.yaaw-core/runtime/`','one deterministic','never authors product')
need(S/'roles/planner.md','facts before questions','future fog','create-tickets','status-only draft->ready')
need(S/'roles/implementer.md','before the first application mutation','immutable','never self-approve','do not edit ticket lifecycle status')
need(S/'roles/reviewer.md','actual repository work','semantically independent','immutable','style preference')
need(S/'roles/prd.md','product','not the question/challenge transcript','future fog')
runtime=(S/'engine/runtime.mjs').read_text();routing=(S/'engine/routing.mjs').read_text();identity=(S/'engine/repository-identity.mjs').read_text()
for forbidden in ['project/state.json','registries/','transition_sequence']:
    if forbidden in runtime:errors.append(f'runtime retains removed durable-state dependency: {forbidden}')
if 'deriveState' not in runtime or 'deriveState' not in routing:errors.append('runtime must derive state from artifacts')
if 'patchStatus' not in runtime or '--reconcile-one' not in runtime:errors.append('runtime must own deterministic ticket-status adoption')
if 'yaaw-worktree-v3' not in identity or '.yaaw-core/project/tickets/**' not in identity:errors.append('repository identity v3 must exclude lifecycle ticket files and bind ticket freshness separately')
if 'TICKET_STATUS' not in routing:errors.append('routing must express lifecycle reconciliation as ticket-status adoption')
if 'REVIEW_RESULT_UNAPPLIED' not in routing or 'IMPLEMENTATION_VERIFIED' not in routing:errors.append('routing lacks evidence/review adoption cases')
if errors:
    print('YAAW behavior validation failed:');[print('- '+e) for e in errors];raise SystemExit(1)
print('YAAW behavior validation passed.')
