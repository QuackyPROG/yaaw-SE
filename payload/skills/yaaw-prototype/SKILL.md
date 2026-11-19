---
name: yaaw-prototype
description: Build a throwaway prototype to answer one design question. Use when the user wants to check whether a state model or logic feels right, or explore what a UI should look like, before planning it for real.
---

# yaaw-prototype

A prototype is **throwaway code that answers a question**. The question decides its shape.

## Pick a branch

- **"Does this logic or state model feel right?"** → [LOGIC.md](LOGIC.md). One shareable HTML file that pushes the state machine through the cases that are hard to reason about on paper, which a non-developer can drive.
- **"What should this look like?"** → [UI.md](UI.md). Several radically different UI variants on one route, switched by a URL search param and a floating bottom bar.

The two branches produce very different results, so a wrong pick wastes the whole prototype. When the question is unclear, ask. When nobody can be asked, pick the branch that matches the surrounding code (a backend module is logic, a page or component is UI) and state the assumption at the top of the prototype.

## Rules for both

1. **Throwaway and marked as such.** Put it next to where it will be used, with a name that says it is a prototype. Follow the project's routing conventions for UI routes.
2. **One command to run.** A UI prototype starts from the project's task runner. A logic demo is one HTML file to double-click.
3. **No persistence**, unless persistence is the question. Then use a scratch store named so it is clearly safe to wipe.
4. **No polish.** No tests, no error handling beyond what makes it run, no abstractions.
5. **Show the state.** After every action or variant switch, render the full relevant state.
6. **Capture the answer.** Write the verdict and the question it settled into the feature's `DECISIONS.md`. Commit the prototype to a throwaway branch and name that branch next to the verdict. The main branch keeps only the decision.
