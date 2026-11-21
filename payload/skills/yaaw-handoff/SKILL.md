---
name: yaaw-handoff
description: Compact this conversation into a handoff note for a fresh session to pick up. Use when the user wants to stop and continue in a fresh session, or /yaaw-se pauses a probe half-way.
argument-hint: "What the next session will be used for"
---

# yaaw-handoff

Write a handoff note that summarises this conversation, so a fresh session can continue without reading it.

Save it to the OS temp folder (`%TEMP%` on Windows, otherwise `$TMPDIR` or `/tmp`) as `yaaw-handoff-YYYY-MM-DD-slug.md`, never inside the repo. Print the full path at the end.

The note holds:

- **Goal**: what the work is for, in 1 or 2 sentences.
- **Feature**: the `docs/yaaw-se/<slug>/` folder and its current stage, when the work is a yaaw-se feature.
- **Settled**: decisions made in this conversation that are not yet in any file.
- **Open**: questions still waiting on the user.
- **Next step**: the first thing the next session should do.
- **Suggested skills**: which skills the next session should invoke.

Point to what already lives in a file (decisions, specs, tickets, commits) by path instead of copying it. Write `<REDACTED>` in place of secrets, keys and personal details.

When an argument was passed, treat it as the focus of the next session and tailor the note to it.
