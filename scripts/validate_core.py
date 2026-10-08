#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; SYSTEM=ROOT/'.yaaw-core/system'; errors=[]
def err(x): errors.append(x)
def load(path):
    try:return json.loads(path.read_text())
    except Exception as exc:err(f'{path.relative_to(ROOT)}: invalid JSON-compatible contract: {exc}');return {}
kernel=load(SYSTEM/'kernel.yaml')
expected={'SYSTEM.md','kernel.yaml','roles','modules','schemas','templates','engine'}
actual={p.name for p in SYSTEM.iterdir()}
if actual!=expected:err(f'system top-level must be compact: expected {sorted(expected)}, got {sorted(actual)}')
for legacy in ['core','workflows','rules','registries','expertise','tools']:
    if (SYSTEM/legacy).exists():err(f'legacy semantic directory remains: {legacy}')
if kernel.get('schema')!='yaaw.kernel/v1':err('kernel schema must be yaaw.kernel/v1')
for key in ['roles','workflows','skills','modules','artifacts','lifecycle','paths']:
    if not kernel.get(key):err(f'kernel missing {key}')
roles=kernel.get('roles',{});workflows=kernel.get('workflows',{});skills=kernel.get('skills',{})
if set(roles)!={'prd','planner','implementer','reviewer','orchestrator'}:err('kernel must define exactly five semantic roles')
for role,contract in roles.items():
    path=ROOT/contract.get('document','')
    if not path.is_file():err(f'{role}: missing role document')
for wid,wf in workflows.items():
    role=roles.get(wf.get('role')); op=wf.get('operation')
    if not role:err(f'{wid}: unknown role');continue
    text=(ROOT/role['document']).read_text()
    if f'Operation: {op}' not in text:err(f'{wid}: role document missing operation {op}')
for sid,entry in skills.items():
    p=ROOT/'skills'/sid/'SKILL.md'
    if not p.is_file():err(f'{sid}: missing public skill')
    else:
        text=p.read_text();lines=text.splitlines()
        if not text.startswith('---\n'):err(f'{sid}: invalid Agent Skill frontmatter')
        if f'name: {sid}' not in text:err(f'{sid}: name mismatch')
        if len(lines)>24:err(f'{sid}: public skill is not thin ({len(lines)} lines)')
        if 'system/engine/runtime.mjs' not in text:err(f'{sid}: old runtime path')
    if entry.get('requested_workflow') not in workflows:err(f'{sid}: unresolved requested workflow')
for name,module in kernel.get('modules',{}).items():
    if not (ROOT/module.get('path','')).is_file():err(f'module {name}: missing file')
legal=kernel.get('lifecycle',{}).get('legal',[]);states=set(kernel.get('lifecycle',{}).get('ticket_states',[]))
for row in legal:
    if row.get('from') not in states or row.get('to') not in states:err(f'invalid lifecycle row {row}')
for pair in [('DRAFT','PASS'),('READY','PASS'),('REPAIR_REQUIRED','PASS')]:
    if any(x.get('from')==pair[0] and x.get('to')==pair[1] for x in legal):err(f'forbidden shortcut present: {pair[0]} -> {pair[1]}')
if 'state' in kernel.get('paths',{}):err('kernel must not define durable global state path')
if (SYSTEM/'templates/project-state.json').exists():err('project-state template must not exist')
if (SYSTEM/'schemas/project-state.schema.json').exists():err('current project-state schema alias must not exist')
ticket=load(SYSTEM/'schemas/ticket.schema.json');enum=set(ticket.get('properties',{}).get('status',{}).get('enum',[]))
if enum!=states:err('ticket frontmatter status and lifecycle states must match')
system=(SYSTEM/'SYSTEM.md').read_text()
for phrase in ['Agents are disposable','persist semantic facts once','There is no durable global `state.json`','Runtime deletion must never lose a semantic decision','Store conclusions, not cognition','Review independence']:
    if phrase.lower() not in system.lower():err(f'SYSTEM.md missing invariant: {phrase}')
for path in SYSTEM.rglob('*'):
    if path.is_file() and path.suffix in {'.md','.json','.yaml','.mjs'}:
        text=path.read_text(errors='ignore')
        for old in ['.yaaw-core/system/core/','.yaaw-core/system/workflows/','.yaaw-core/system/rules/','.yaaw-core/system/registries/','.yaaw-core/system/expertise/','.yaaw-core/system/tools/']:
            if old in text:err(f'{path.relative_to(ROOT)} references removed path {old}')
if errors:
    print('YAAW compact-core validation failed:');[print('- '+e) for e in errors];raise SystemExit(1)
print('YAAW compact-core validation passed.')
