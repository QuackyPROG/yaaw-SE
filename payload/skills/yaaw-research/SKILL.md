---
name: yaaw-research
description: Research a question against primary sources and save the findings as a dated note in the repo. Use when a topic needs researching, docs or API facts need gathering, or reading legwork should run in the background.
argument-hint: "The question to research"
---

# yaaw-research

Answer a question from **primary sources**: official docs, source code, specs and first-party pages, not a secondary write-up of them. Follow every claim back to the source that owns it.

## 1. Find the sources

Pin the question down to one sentence. Find the primary sources yourself, using Context7 for libraries and web search for the rest. Done when you hold a short list of sources that own the answer.

## 2. Delegate the reading

Dispatch a read-only subagent in the background with the question, the source list and this return shape: each finding as one line with the URL or path that supports it, and what the sources do not answer listed separately. Keep working while it reads. When the reading is 1 or 2 short pages, read them yourself instead.

## 3. Write the note

Save it where the repo already keeps such notes. When there is no convention, use `docs/research/YYYY-MM-DD-slug.md`:

```markdown
# <question>

## Answer
<2 to 4 sentences>

## Findings
- <claim> (<source>)

## Not answered
- <what the sources leave open>

## Sources
- <title>: <URL or path>
```

Check each claim against its cited source before it goes in. A claim with no source goes under "Not answered". Done when every finding carries a source and the user has the note's path and the answer in a few lines.
