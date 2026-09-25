# npm release automation

YAAW-SE publishes to npm through GitHub Actions after the full validation matrix succeeds.

## Required GitHub secret

The repository must define this Actions secret:

```text
NPM_TOKEN
```

Use an npm granular access token with package read/write publishing permission. Never commit the token to the repository.

## Release policy

npm versions are immutable, so every successful current-`main` publication must use a new version. The repository's `package.json` version is the requested release line, not a promise to overwrite that exact version.

The stable resolver follows this rule:

```text
repository version > npm latest
    -> publish repository version

repository version <= npm latest
    -> publish patch(npm latest)
```

Examples:

```text
repo 0.3.0 + latest 0.3.0 -> 0.3.1
repo 0.3.0 + latest 0.3.4 -> 0.3.5
repo 0.4.0 + latest 0.3.8 -> 0.4.0
```

This means normal bug fixes merged to `main` no longer require a manual patch bump just to make new bytes reachable through `latest`. Deliberate minor/major boundaries are still expressed by moving the repository version ahead.

## Continuous prerelease publishing

After the full validation matrix succeeds, the current `main` head publishes `next` from the same prospective stable release line:

```text
latest 0.3.4
next   0.3.5-dev.<run-id>.<run-attempt>
```

Development users can run:

```bash
npx yaaw-se@next install
```

Stable users are never silently moved to `next`.

## Stable publishing sequence

The release job keeps the existing current-main freshness guard, then performs:

```text
validated source
  -> resolve next immutable stable version
  -> npm version <target> --no-git-tag-version
  -> build payload with that exact version
  -> verify package/payload version alignment
  -> pack tarball
  -> smoke that exact tarball
  -> npm publish that exact tarball --tag latest
```

Publishing the same tarball that passed smoke testing closes the tested-artifact/published-artifact gap.

Normal users can run:

```bash
npx yaaw-se install
```

The CLI also performs an application-level freshness check before Commander dispatch. When the registry is reachable and a newer stable version exists, a stable invocation hands the original argv to that exact immutable release. Registry failure is non-fatal and the current package continues to run.

For deterministic CI, migration, support, or exact-tarball testing:

```bash
YAAW_DISABLE_AUTO_UPDATE=1 npx yaaw-se@0.3.0 status
```

## Local verification

Before merging a release-affecting change:

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
node scripts/smoke_npm_tarball.mjs
node scripts/smoke_npm_update.mjs
```

Exact-package smoke processes disable the application-level updater so they continue testing the intended local bytes.

## Token hardening

Once `yaaw-se` exists on npm, prefer a granular token restricted to that package. Longer term, npm Trusted Publishing/OIDC can replace the token entirely.
