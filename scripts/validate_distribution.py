#!/usr/bin/env python3
"""Distribution invariants for the compact YAAW-SE kernel."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/'.yaaw-core'; SYSTEM=CORE/'system'
LEGACY_RE=re.compile(r'(?<!-)\.yaaw/')
TEXT_SUFFIXES={'.md','.json','.py','.ts','.js','.mjs','.yml','.yaml'}
EXPECTED_SYSTEM={'SYSTEM.md','kernel.yaml','roles','modules','schemas','templates','engine'}
LEGACY_SYSTEM={'core','workflows','expertise','rules','registries','tools'}

def load(path:Path): return json.loads(path.read_text(encoding='utf-8'))

def main()->int:
    errors=[]
    if not SYSTEM.is_dir():
        errors.append('missing canonical .yaaw-core/system package root'); kernel={}
    else:
        try: kernel=load(SYSTEM/'kernel.yaml')
        except Exception as exc: errors.append(f'invalid kernel.yaml: {exc}'); kernel={}
    actual={p.name for p in SYSTEM.iterdir()} if SYSTEM.is_dir() else set()
    if actual!=EXPECTED_SYSTEM: errors.append(f'compact system layout drifted: {sorted(actual)}')
    for name in LEGACY_SYSTEM:
        if (SYSTEM/name).exists(): errors.append(f'legacy semantic directory remains: .yaaw-core/system/{name}')
    for name in LEGACY_SYSTEM|{'project','runtime','install'}:
        if (CORE/name).exists(): errors.append(f'legacy flat package directory remains: .yaaw-core/{name}')

    paths=kernel.get('paths',{})
    expected_paths={'workspace_root':'.','system_root':'.yaaw-core/system','project_root':'.yaaw-core/project','runtime_root':'.yaaw-core/runtime','install_root':'.yaaw-core/install','product':'.yaaw-core/project/product.md','engineering':'.yaaw-core/project/engineering.md','research':'.yaaw-core/project/research','specs':'.yaaw-core/project/specs','tickets':'.yaaw-core/project/tickets','reviews':'.yaaw-core/project/reviews','evidence':'.yaaw-core/project/evidence','project_rules':'.yaaw-core/project/rules'}
    for key,value in expected_paths.items():
        if paths.get(key)!=value: errors.append(f'kernel path {key} drifted: {paths.get(key)!r}')
    if 'state' in paths: errors.append('kernel reintroduced durable global state path')

    skills=kernel.get('skills',{}); workflows=kernel.get('workflows',{})
    for skill_id,entry in skills.items():
        path=ROOT/'skills'/skill_id/'SKILL.md'
        if not path.is_file(): errors.append(f'missing canonical skill {skill_id}'); continue
        text=path.read_text(encoding='utf-8')
        if len(text.splitlines())>24: errors.append(f'public skill too large: {skill_id}')
        if '.yaaw-core/system/engine/runtime.mjs' not in text: errors.append(f'{skill_id}: does not invoke compact runtime')
        if entry.get('requested_workflow') not in workflows: errors.append(f'{skill_id}: unresolved requested workflow')

    scan_roots=[CORE,ROOT/'skills',ROOT/'scripts',ROOT/'src',ROOT/'installer',ROOT/'tests',ROOT/'README.md',ROOT/'AGENTS.md']
    ignored={
        (ROOT/'scripts/validate_distribution.py').resolve(),
        (ROOT/'tests/test_distribution_contracts.py').resolve(),
    }
    for base in scan_roots:
        candidates=[base] if base.is_file() else ([p for p in base.rglob('*') if p.is_file()] if base.exists() else [])
        for path in candidates:
            if path.resolve() in ignored: continue
            if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {'AGENTS.md','README.md'}: continue
            text=path.read_text(encoding='utf-8',errors='ignore')
            if LEGACY_RE.search(text): errors.append(f'live legacy .yaaw root reference: {path.relative_to(ROOT)}')

    bootstrap=ROOT/'installer/templates/bootstrap'
    for name in ('codex.md','claude-code.md','gemini-cli.md','cline.md'):
        path=bootstrap/name
        if not path.is_file(): errors.append(f'missing bootstrap template: {name}'); continue
        text=path.read_text(encoding='utf-8')
        for marker in ('.yaaw-core/system/SYSTEM.md','.yaaw-core/system/kernel.yaml','.yaaw-core/system/engine/runtime.mjs'):
            if marker not in text: errors.append(f'{name}: missing compact-kernel marker {marker}')
        if len(text.splitlines())>30: errors.append(f'{name}: bootstrap template is too large')

    for rel in ('.agents','.codex','.claude','.gemini','.cline'):
        if (ROOT/rel).exists(): errors.append(f'provider adapter tree must be generated, not authored in source: {rel}')

    codex_runtime=ROOT/'installer/templates/codex/yaaw-runtime.md'
    if not codex_runtime.is_file(): errors.append('missing Codex runtime adapter template')
    else:
        text=codex_runtime.read_text(encoding='utf-8')
        for required in ('yaaw_prd','yaaw_planner','yaaw_implementer','yaaw_reviewer','BLOCKED:HOST_ISOLATION_UNAVAILABLE','BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE','HOST_INHERIT'):
            if required not in text: errors.append(f'Codex runtime adapter missing contract token: {required}')

    installer='\n'.join(p.read_text(encoding='utf-8') for p in (ROOT/'src/installer').rglob('*.ts'))
    if 'Installer-managed operation cannot mutate durable project memory' not in installer: errors.append('installer lacks durable-project preflight guard')
    if 'remove-project-file-migration' not in installer: errors.append('project schema v3 migration removal is not explicitly typed')
    for rel in ('SYSTEM.md','kernel.yaml','engine/integrity.mjs','engine/repository-identity.mjs','engine/runtime.mjs'):
        if not (SYSTEM/rel).is_file(): errors.append(f'missing package-managed compact runtime file: {rel}')

    if errors:
        print('YAAW distribution validation failed:'); [print('- '+e) for e in errors]; return 1
    print(f'YAAW distribution validation passed: {len(skills)} public skills, compact kernel, 4 Tier-1 adapters')
    return 0

if __name__=='__main__': raise SystemExit(main())
