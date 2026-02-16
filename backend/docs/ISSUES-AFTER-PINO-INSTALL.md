# Issues After Adding Pino / nestjs-pino (Structured Logging)

**Context:** We added production-style structured logging using `pino`, `pino-pretty`, and `nestjs-pino` to the NestJS backend. The following issues occurred during and after adding these dependencies.

**Environment:** Node/pnpm project, NestJS 11, TypeScript 5.7, `tsconfig` target `ES2023`, pnpm (version in use was 8.x; 10.x available).

---

## Issue 1: No Matching Version for nestjs-pino@^5.0.0

**What happened:**  
`pnpm install` failed with:

```text
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for nestjs-pino@^5.0.0
The latest release of nestjs-pino is "4.5.0".
```

**Cause:**  
In `package.json` we had added `nestjs-pino@^5.0.0`. There is no 5.x release of `nestjs-pino` on npm; the latest is **4.5.0**. The 5.0.0 version was assumed without checking the registry.

**Fix applied:**  
- Set `nestjs-pino` to `^4.5.0`.
- Set `pino` to `^8.17.0` and `pino-pretty` to `^10.3.0` to match nestjs-pino 4.x compatibility (we had used pino 9.x / pino-pretty 13.x).

**Permanent discipline:** Use `pnpm add <package>` (no version) or `pnpm view <package> version` before adding; never invent versions. See CONTRIBUTING.md.

---

## Issue 2: TypeScript “Cannot Find Global Type” and Missing lib.es2023.full.d.ts

**What happened:**  
After installing dependencies, the TypeScript compiler (e.g. in the IDE or `nest start --watch`) reported errors like:

```text
error TS2318: Cannot find global type 'Array'.
error TS2318: Cannot find global type 'Boolean'.
error TS2318: Cannot find global type 'Function'.
...
error TS6053: File '.../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2023.full.d.ts' not found.
  Default library for target 'es2023'
```

**Cause:**  
- Our **project** uses `typescript@^5.7.3` in `devDependencies` and `tsconfig.json` has `"target": "ES2023"`.
- pnpm had resolved a **different** TypeScript version (**5.9.3**) for some transitive dependencies (e.g. `@nestjs/schematics`, `typescript-eslint`, `ts-node`, `fork-ts-checker-webpack-plugin`, etc.).
- The compiler/tooling was using TypeScript 5.9.3 (from inside `.pnpm`). Either that version’s lib layout differs or the lib files were not present/visible, so `lib.es2023.full.d.ts` was missing and global types (Array, Boolean, etc.) could not be resolved.

**Temporary fix (at the time):**  
We added a pnpm override to force TypeScript 5.7.3 across the tree. The **permanent fix** is below (exact pin + no override).

---

## Issue 3: pnpm Lockfile Out of Sync After Adding overrides

**What happened:**  
After adding the `pnpm.overrides` block to `package.json`, running `pnpm install` failed with:

```text
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation.
The current "overrides" configuration doesn't match the value found in the lockfile.
Update your lockfile using "pnpm install --no-frozen-lockfile"
```

**Cause:**  
The lockfile had been generated **before** the `overrides` section existed. pnpm requires the lockfile to reflect the current `overrides` (and other config), so a “frozen” install (default in CI or when lockfile is committed) correctly refused to install.

**Fix applied:**  
Run once locally: `pnpm install --no-frozen-lockfile` to regenerate the lockfile with the new overrides, then commit the updated lockfile.

**Permanent discipline:** Documented in CONTRIBUTING.md. CI must run `pnpm install --frozen-lockfile`; if lockfile and package.json diverge, CI fails. That is intended.

---

## Issue 4: EPERM During pnpm install (Possible Sandbox / Permissions)

**What happened:**  
When running `pnpm install --no-frozen-lockfile` (e.g. from an automated or sandboxed environment), install failed with:

```text
ERR_PNPM_EPERM  EPERM: operation not permitted, mkdir '.../node_modules/.pnpm/.../node_modules/@nestjs/config_tmp_.../.vscode'
```

**Cause (suspected):**  
- pnpm or a postinstall script tried to create a directory (e.g. `.vscode`) inside a package under `node_modules`.
- This could be due to: sandbox/permission restrictions, antivirus, or pnpm/node version quirks. We did not change any VSCode or package scripts; it appeared only after adding the new dependencies and overrides.

**Fix applied:**  
Running `pnpm install --no-frozen-lockfile` outside the sandbox (normal terminal) may succeed. We have not confirmed whether this still happens on a clean clone.

**Permanent discipline:** Do not run installs from IDE sandbox terminals. Use Node/pnpm versions from `.nvmrc` and `engines`; if EPERM persists, `rm -rf node_modules pnpm-lock.yaml` then `pnpm install` in a normal terminal.

---

## Summary Table

| Issue | Symptom | Root cause | Fix |
|-------|---------|------------|-----|
| 1 | `No matching version nestjs-pino@^5.0.0` | 5.x doesn’t exist; wrong version in package.json | Use nestjs-pino ^4.5.0 and compatible pino/pino-pretty |
| 2 | TS2318 global types + missing lib.es2023.full.d.ts | Transitive TypeScript 5.9.3 used; lib path/layout issue | Pin TypeScript exactly (no caret); overrides removed (see below) |
| 3 | Lockfile config mismatch after adding overrides | Lockfile generated before overrides | Run `pnpm install --no-frozen-lockfile`, commit lockfile |
| 4 | EPERM when creating dir under node_modules | Sandbox/permissions or tooling | Run install outside sandbox; document if it persists |

---

## Files Touched (original)

- `package.json` – dependency versions (nestjs-pino, pino, pino-pretty); previously had `pnpm.overrides` (removed in permanent fix).
- `pnpm-lock.yaml` – must be updated when deps/overrides/engines change (`pnpm install --no-frozen-lockfile` then commit).
- `tsconfig.json` – unchanged; uses `"target": "ES2023"`.

---

## Permanent Fixes (Senior Engineer Discipline)

**Root problem:** These were not Pino issues. They were **version discipline**, **toolchain consistency**, **lockfile integrity**, and **environment reproducibility**. The project crossed a “maturity threshold”; the tooling was not pinned tightly enough.

### What Was Changed

1. **TypeScript pinned exactly**  
   In `package.json`: `"typescript": "5.7.3"` (no caret). TypeScript is treated as infrastructure; no floating compiler version.

2. **pnpm.overrides removed**  
   Overrides are a last resort. With exact TypeScript pin and a clean lockfile, one TypeScript version in the tree is expected. If `pnpm list typescript` later shows multiple versions, reintroduce an override only then.

3. **engines added**  
   `"engines": { "node": ">=20 <21", "pnpm": ">=8 <9" }` to avoid random Node/pnpm upgrades across machines.

4. **.nvmrc added**  
   `20.11.1` so `nvm use` in backend gives a consistent Node version.

5. **CONTRIBUTING.md created**  
   - When to run `pnpm install --no-frozen-lockfile` and commit `pnpm-lock.yaml` (after changing deps, overrides, or engines).
   - Rule: never type a dependency version manually without verifying it exists on the registry; prefer `pnpm add <pkg>` or `pnpm view <pkg> version`.
   - Note that CI must use `pnpm install --frozen-lockfile` so lockfile drift fails the build.

6. **README.md updated**  
   Node 20.x and pnpm 8.x are stated as required; reference to `.nvmrc` and `engines` added.

### Clean install after these changes

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

Then commit the new lockfile. CI should run `pnpm install --frozen-lockfile`. No fluff—engineering discipline.
