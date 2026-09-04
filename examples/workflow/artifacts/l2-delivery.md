---yaaw-json
{"schema":"yaaw.ticket/v1","id":"EX-L2","kind":"DELIVERY","status":"READY","level":2,"parent":"EX-FEATURE","owner":"auth","blocked_by":[],"acceptance":["Persists the new session field and returns it through the public API without changing existing authorization semantics"],"qa":{"required":true,"profile":"INDEPENDENT"},"allowed_write":["src/auth/**","src/api/**","tests/**"],"forbidden_write":[],"expected_change_surface":["src/auth/**","src/api/**","tests/**"],"source_fingerprints":{},"risk":[],"side_effects":["repository"]}
---
# EX-L2: Cross-subsystem feature slice

This fixture demonstrates planned-feature routing and independent QA.
