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

To publish new stable bytes, bump the version in both `package.json` and `package-lock.json`, commit that change to `main`, and push. For example, changing the package version from `0.1.x` to `0.2.0` causes a successful `main` run to publish:

```text
yaaw-se@0.2.0
dist-tag: latest
```

npm package versions are immutable. If the version already exists, the workflow does not overwrite it; it only ensures `latest` points to that already-published version. Therefore, any `main` change that must reach normal `npx yaaw-se install` users needs a package-version bump.

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

The first command exercises the exact packed artifact across Codex, Claude Code, Gemini CLI, Cline, all four together, paths with spaces/Unicode, quick-update idempotence, status/doctor, durable-state sentinels, and the Codex `.codex` runtime/role surface.

The second builds a synthetic update tarball, deliberately taints an installed package-managed framework file, then upgrades using `backup-replace`. It verifies that the tainted bytes are backed up, canonical package content is restored/updated, replaceable runtime caches are invalidated, the Codex runtime migration still succeeds, and product, engineering, state, spec, ticket, review, evidence, research, and project-rule durable artifacts survive byte-for-byte.

## Versioning rule

npm package versions are immutable. Do not reuse a stable version for different stable source states.

Before publishing a new stable release from `main`, update both `package.json` and `package-lock.json` to the intended version and commit them. Release verification uses `npm ci`, so lock drift fails rather than being silently resolved.

## After the first package exists

Once `yaaw-se` has been created on npm:

1. revoke the broad bootstrap granular token;
2. create a new granular token restricted to the `yaaw-se` package;
3. keep package read/write publishing permission;
4. replace the GitHub `NPM_TOKEN` repository secret with the restricted token.

Longer term, npm Trusted Publishing/OIDC can replace the token entirely.
