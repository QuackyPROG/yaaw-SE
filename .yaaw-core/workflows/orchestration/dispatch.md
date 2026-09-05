# Orchestration dispatch

Run:

`inspect-state -> reconcile-state -> determine-next-action -> dispatch`.

Dispatch through `.yaaw-core/registries/workflows.json`, the same canonical mapping used by manual public skills. Continue bounded autonomous execution across safe workflow boundaries until one of these occurs:

- human product/engineering answer is required;
- evidence is insufficient / `BLOCKED`;
- destructive or externally consequential action requires approval under the host environment;
- accepted scope reaches terminal `COMPLETE`.

After each workflow, persist artifacts/state and re-enter inspection rather than trusting conversational continuity.
