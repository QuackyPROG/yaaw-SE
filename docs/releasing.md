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

Every successful push to `main` runs the complete validation workflow:

- semantic-core validation
- Python tests
- Node installer tests
- package build and pack inspection
- exact tarball smoke tests
- tarball-to-tarball update + tainted-framework repair smoke
- minimum supported Node 20.12 runtime smoke
- macOS and Windows smoke tests

Only after every required job succeeds does GitHub publish a unique prerelease derived from the package version and workflow run identity:

```text
0.2.0-dev.<run-id>.<run-attempt>
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

Stable npm releases are published from `main` after the full validation matrix succeeds.

npm package versions are immutable, so the workflow now resolves a fresh immutable stable target automatically. The repository version represents the requested release line:

```text
repoVersion > npmLatest
    -> target = repoVersion

repoVersion <= npmLatest
    -> target = semver.inc(npmLatest, "patch")
```

Examples:

```text
repo 0.3.0 + latest 0.3.0 -> 0.3.1
repo 0.3.0 + latest 0.3.4 -> 0.3.5
repo 0.4.0 + latest 0.3.8 -> 0.4.0
```

The workflow sets the target version **before** building, packs one tarball, smoke-tests that exact tarball, then publishes those exact bytes to `latest`. The existing current-main SHA guard remains in place so an older CI run cannot publish after a newer main commit exists.

The `next` channel follows the same prospective stable line, for example `0.3.5-dev.<run-id>.<attempt>` when `latest` is `0.3.4`.

Normal stable users can run:

```bash
npx yaaw-se install
```

The CLI itself checks `latest` before command dispatch and hands off to the exact newer stable version when reachable. Stable users are never silently moved to `next`. Registry failure is non-fatal.

For deterministic CI, regression reproduction, migration tests, support work, and exact local tarballs, disable application-level updating:

```bash
YAAW_DISABLE_AUTO_UPDATE=1 npx yaaw-se@0.3.0 status
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

The first command exercises the exact packed artifact across Codex, Claude Code, Gemini CLI, Cline, all four together, paths with spaces/Unicode, quick-update idempotence, status/doctor, durable-state sentinels, and the Codex `.codex` runtime/role surface.

The second builds a synthetic update tarball, deliberately taints an installed package-managed framework file, then upgrades using `backup-replace`. It verifies that the tainted bytes are backed up, canonical package content is restored/updated, replaceable runtime caches are invalidated, the Codex runtime migration still succeeds, and product, engineering, state, spec, ticket, review, evidence, research, and project-rule durable artifacts survive byte-for-byte.

Both exact-package smoke scripts set `YAAW_DISABLE_AUTO_UPDATE=1` so the new startup gate cannot substitute registry bytes for the tarball under test. Release jobs can pass `YAAW_SMOKE_TARBALL` so the artifact that passes smoke testing is the same tarball published to npm.

## Versioning rule

npm package versions are immutable. Do not reuse a stable version for different stable source states.

Routine `main` changes do not require a manual patch bump: CI increments from npm `latest`. To request a deliberate minor or major boundary, move the repository version ahead of npm `latest`; that repository version becomes the next stable target. Release-time `npm version --no-git-tag-version` updates the package metadata in the isolated CI workspace before payload construction.

## After the first package exists

Once `yaaw-se` has been created on npm:

1. revoke the broad bootstrap granular token;
2. create a new granular token restricted to the `yaaw-se` package;
3. keep package read/write publishing permission;
4. replace the GitHub `NPM_TOKEN` repository secret with the restricted token.

Longer term, npm Trusted Publishing/OIDC can replace the token entirely.
