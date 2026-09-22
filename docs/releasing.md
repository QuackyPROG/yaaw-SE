# Manual npm release

npm publishing is manual for the first YAAW-SE release. There is intentionally no publish GitHub Action.

## Verify

```bash
git status
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python scripts/validate_distribution.py
python -m unittest discover -s tests -v

npm install
npm test
npm run build
npm pack --dry-run
```

Inspect the pack list. It should contain `package.json`, `README.md`, `dist/cli/**`, and `dist/payload/**`, and must not contain tests, git metadata, repository-development `AGENTS.md`, project memory, environment files, or private keys.

## Test the exact tarball

```bash
npm pack
mkdir -p /tmp/yaaw-codex-test
cd /tmp/yaaw-codex-test
npm exec --package=/path/to/yaaw-se-0.1.0.tgz -- yaaw-se install --directory . --tools codex --skills standard --yes
npx /path/to/yaaw-se-0.1.0.tgz status
npx /path/to/yaaw-se-0.1.0.tgz doctor
```

The repository also includes `node scripts/smoke_npm_tarball.mjs`, which packs the exact built artifact and exercises Codex, Claude Code, Gemini CLI, Cline, all four together, paths with spaces/Unicode, quick-update idempotence, status/doctor, and durable-state sentinels through `npm exec --package=<tarball>`.

`node scripts/smoke_npm_update.mjs` additionally builds a synthetic `0.1.1` tarball, updates a real `0.1.0` installation, verifies package-managed core changed, and proves product, engineering, state, spec, ticket, review, evidence, and project-rule sentinels survive byte-for-byte.

Repeat any additional host-native/manual smoke checks needed for the release environment, especially Windows before claiming Windows support.

Before the first publish, confirm npm identity and package-name availability:

```bash
npm whoami
npm view yaaw-se
npm publish --dry-run
```

The registry name was unclaimed during implementation on 2026-09-22, but this check must be repeated immediately before publishing.

## Publish

For a normal public release:

```bash
npm publish
```

For prerelease testing:

```bash
npm publish --tag next
```

After publishing, smoke-test from a directory with no YAAW checkout:

```bash
mkdir /tmp/yaaw-public-smoke
cd /tmp/yaaw-public-smoke
npx yaaw-se@0.1.0 install
```

A release is not distribution-ready until the exact published package installs, discovers `yaaw-orchestrator`, and reaches the canonical `.yaaw-core` workflow without Python or the source checkout.
