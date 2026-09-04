---yaaw-json
{"schema":"yaaw.ticket/v1","id":"EX-L4","kind":"DELIVERY","status":"READY","level":4,"parent":"EX-SECURITY","owner":"security","blocked_by":[],"acceptance":["Rejects unauthorized cross-tenant access and records negative authorization evidence before integration"],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["src/authz/**","tests/authz/**"],"forbidden_write":["secrets/**"],"expected_change_surface":["src/authz/**","tests/authz/**"],"source_fingerprints":{},"risk":["security","trust-boundary"],"side_effects":["repository"]}
---
# EX-L4: Trust-boundary change

High assurance is consequence-driven; this example can be small in code volume and still require L4 controls.
