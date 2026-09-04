#!/usr/bin/env python3
"""Validate JSON Schemas plus structured templates/config/example fixtures."""
from __future__ import annotations
import json
from pathlib import Path
from jsonschema import Draft202012Validator
from yaaw.frontmatter import parse
ROOT=Path(__file__).resolve().parents[1]; SCHEMA_DIR=ROOT/".agents/schemas"
TEMPLATE_SCHEMAS={"docs/templates/discovery-ticket.md":"ticket.schema.json","docs/templates/decision-ticket.md":"ticket.schema.json","docs/templates/delivery-ticket.md":"ticket.schema.json","docs/templates/prd.md":"prd.schema.json","docs/templates/spec.md":"spec.schema.json","docs/templates/adr.md":"adr.schema.json","docs/templates/initiative-map.md":"initiative-map.schema.json","docs/templates/plan-delta.md":"plan-delta.schema.json"}
JSON_INSTANCE_SCHEMAS={"examples/domain-pack/.yaaw/domain-pack.json":"domain-pack.schema.json","examples/domain-pack/.yaaw/domain-pack.lock.json":"domain-pack-lock.schema.json","examples/domain-pack/.yaaw/repository-map.json":"repository-map.schema.json","config/model-profiles.example.json":"model-profiles.schema.json","config/context-budget.json":"context-budget.schema.json","config/operating-modes.json":"operating-modes.schema.json","config/runtime-adapters.json":"runtime-adapters.schema.json","config/generic-command-runtime.json":"generic-command-runtime.schema.json","config/external-adapters.example.json":"external-adapters.schema.json","examples/integrations/external-observation.json":"external-observation.schema.json","examples/integrations/change-set.json":"change-set.schema.json","evals/agent-loop-fixture.json":"agent-eval.schema.json","evals/workloads/synthetic-baseline.json":"agent-eval.schema.json","evals/workloads/synthetic-governed.json":"agent-eval.schema.json","evals/workloads/synthetic-local.json":"workload.schema.json"}
def load_schema(name):
    schema=json.loads((SCHEMA_DIR/name).read_text(encoding="utf-8")); Draft202012Validator.check_schema(schema); return schema
def validate():
    errors=[]; schemas={}
    for path in sorted(SCHEMA_DIR.glob("*.json")):
        try: schemas[path.name]=load_schema(path.name)
        except Exception as exc: errors.append(f"{path.relative_to(ROOT)}: invalid schema: {exc}")
    for rel,name in TEMPLATE_SCHEMAS.items():
        if name not in schemas: continue
        try:
            metadata=parse((ROOT/rel).read_text(encoding="utf-8")).metadata
            for error in sorted(Draft202012Validator(schemas[name]).iter_errors(metadata),key=lambda e:list(e.path)): errors.append(f"{rel}:{'.'.join(str(v) for v in error.path) or '<root>'}: {error.message}")
        except Exception as exc: errors.append(f"{rel}: {exc}")
    for rel,name in JSON_INSTANCE_SCHEMAS.items():
        if name not in schemas: errors.append(f"{rel}: schema {name} is not loadable"); continue
        try:
            instance=json.loads((ROOT/rel).read_text(encoding="utf-8"))
            for error in sorted(Draft202012Validator(schemas[name]).iter_errors(instance),key=lambda e:list(e.path)): errors.append(f"{rel}:{'.'.join(str(v) for v in error.path) or '<root>'}: {error.message}")
        except Exception as exc: errors.append(f"{rel}: {exc}")
    return errors
def main():
    errors=validate()
    if errors: [print(f"ERROR: {e}") for e in errors]; return 1
    print("OK: schemas and structured fixtures validate"); return 0
if __name__=="__main__": raise SystemExit(main())
