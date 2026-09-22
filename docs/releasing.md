# npm release automation

YAAW-SE publishes to npm through GitHub Actions after the full validation matrix succeeds.

## Required GitHub secret

The repository must define this Actions secret:

```text
NPM_TOKEN
```

Use an npm granular access token with package read/write publishing permission. For the initial package creation, the token may need access to all packages because `yaaw-se` does not exist yet. After the package exists, replace the bootstrap token with a token restricted to `yaaw-se` only.

Never commit the token to the repository.

## Continuous prerelease publishing

Every successful push to `yaaw-SEv2` runs the complete validation workflow:

- semantic-core validation
- Python tests
- Node installer tests
- package build and pack inspection
- exact tarball smoke tests
- tarball-to-tarball update smoke
- minimum supported Node 20.12 runtime smoke
- macOS and Windows smoke tests

Only after every required job succeeds does GitHub publish a unique prerelease derived from the package version and workflow run identity:

```text
0.1.0-dev.<run-id>.<run-attempt>
```

The prerelease is published under the npm dist-tag:

```text
next
```

Development users can therefore run:

```bash
npx yaaw-se@next install
```

A failed CI run never publishes.

## Stable releases

Stable npm releases are driven by Git tags matching `v*`.

The tag must exactly match the version in `package.json`. For example:

```bash
# package.json version: 0.1.0
git tag v0.1.0
git push origin v0.1.0
```

The tag starts the same full validation matrix. If all required jobs succeed, GitHub publishes:

```text
yaaw-se@0.1.0
dist-tag: latest
```

If that exact npm version already exists, the workflow does not try to overwrite the immutable package version; it ensures the `latest` dist-tag points to that version.

Normal users can then run:

```bash
npx yaaw-se install
```

## Local verification before a stable tag

Before creating a stable release tag, verify locally:

```bash
git status
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python scripts/validate_distribution.py
python -m unittest discover -s tests -v

npm ci
npm test
npm run build
npm pack --dry-run
```

Inspect the pack list. It should contain `package.json`, `README.md`, `dist/cli/**`, and `dist/payload/**`, and must not contain tests, git metadata, repository-development `AGENTS.md`, project memory, environment files, or private keys.

The repository also includes:

```bash
node scripts/smoke_npm_tarball.mjs
node scripts/smoke_npm_update.mjs
```

The first command exercises the exact packed artifact across Codex, Claude Code, Gemini CLI, Cline, all four together, paths with spaces/Unicode, quick-update idempotence, status/doctor, and durable-state sentinels.

The second builds a synthetic update tarball and verifies that package-managed core changes while product, engineering, state, spec, ticket, review, evidence, and project-rule durable artifacts survive byte-for-byte.

## Versioning rule

npm package versions are immutable. Do not reuse a stable version for different stable source states.

Before tagging a new stable release, update both `package.json` and `package-lock.json` to the intended version and commit them. Release verification uses `npm ci`, so lock drift fails rather than being silently resolved.

## After the first package exists

Once `yaaw-se` has been created on npm:

1. revoke the broad bootstrap granular token;
2. create a new granular token restricted to the `yaaw-se` package;
3. keep package read/write publishing permission;
4. replace the GitHub `NPM_TOKEN` repository secret with the restricted token.

Longer term, npm Trusted Publishing/OIDC can replace the token entirely.
