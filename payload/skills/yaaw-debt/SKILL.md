---
name: yaaw-debt
description: List every `shortcut:` comment in the repo as a debt ledger, flagging the ones with no upgrade trigger. Reports only.
disable-model-invocation: true
argument-hint: "Optional: another marker word to scan for, such as TODO"
---

# yaaw-debt

`yaaw-lean` marks every deliberate shortcut with a `shortcut: <the limit>, <when to upgrade>` comment. This skill collects them into one ledger, so a deferral does not quietly become permanent.

## Scan

Grep the repo for the marker, skipping `.git` and everything `.gitignore` ignores:

```
git grep -nE '(#|//|/[*]|--) ?shortcut:'
```

Add other comment prefixes when the stack uses them. When a marker word was passed, grep for that word instead. Skip hits that are not deferrals, such as a note about a keyboard shortcut.

## Output

One row per marker, grouped by file:

```
<file>:<line>, <what was simplified>. limit: <the limit named>. upgrade: <the trigger to revisit>.
```

Tag any marker that names no upgrade trigger with `no-trigger`, as those are the ones that rot. To add an owner per row, use `git blame -L<line>,<line>`.

End with `<N> markers, <M> with no trigger.` With nothing found: `No shortcut debt.`

This skill changes nothing. When the user asks for the ledger to be kept, write it to `SHORTCUT-DEBT.md`.
