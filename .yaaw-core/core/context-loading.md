# Context loading

Load the smallest durable context needed for the current judgment:

```text
role contract
+ workflow contract
+ active artifact
+ directly referenced decisions
+ relevant product constraints
+ relevant project rules
+ relevant repository files/diff
+ selected expertise
+ prior review finding when repairing
```

Do not automatically load every PRD revision, every ticket, every review, every expertise module, or the full repository.

A handoff should name exact artifact paths and expected output so a fresh context can continue deterministically.
