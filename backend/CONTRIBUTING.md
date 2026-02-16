# Contributing

## Toolchain

- **Node**: 20.x (see `.nvmrc`). Use `nvm use` in the backend directory.
- **pnpm**: 8.x. CI and local installs use `pnpm install`.

## Lockfile and dependency changes

If you change any of:

- **dependencies** or **devDependencies** in `package.json`
- **pnpm overrides** (if re-added for a specific reason)
- **engines**

you **must**:

1. Run: `pnpm install --no-frozen-lockfile`
2. Commit the updated `pnpm-lock.yaml`

CI runs `pnpm install --frozen-lockfile`. If the lockfile is out of sync with `package.json`, CI will fail. That is intentional: it keeps builds reproducible.

## Adding a new dependency

- Prefer letting pnpm resolve the latest stable version:
  - `pnpm add <package>` (no version = latest)
  - Or: `pnpm add <package>@<version>` with a version you got from `pnpm view <package> version` or the npm registry.
- Do **not** type a version manually without verifying it exists on the registry.

## TypeScript

- TypeScript is pinned to an exact version in `package.json` (no caret). Do not float the compiler version.
- After install, you can verify a single TypeScript in the tree: `pnpm list typescript` (one version expected).
