# Milestone 2 Validation

## Validation performed in the build environment

Milestone 2 was validated independently of npm registry availability.

### 1. Strict TypeScript compile of the core runtime

The core runtime and shared contracts were compiled with TypeScript strict flags, including:

```text
strict
noUncheckedIndexedAccess
exactOptionalPropertyTypes
noImplicitOverride
noFallthroughCasesInSwitch
noPropertyAccessFromIndexSignature
useUnknownInCatchVariables
verbatimModuleSyntax
isolatedModules
```

Result: **PASS**.

### 2. Runtime smoke test

The compiled core was exercised using Node.js itself plus the FFmpeg/FFprobe binaries available in the environment.

Verified:

- stdout capture;
- stderr capture;
- zero exit-code handling;
- dry-run does not spawn;
- FFmpeg binary resolution;
- FFprobe binary resolution;
- actual `ffmpeg -version` execution;
- actual `ffprobe -version` execution;
- temporary workspace creation and cleanup.

Environment observed during validation:

```text
Node.js: v22.16.0
FFmpeg: 7.1.5-0+deb13u1
FFprobe: 7.1.5-0+deb13u1
```

Result: **PASS**.

### 3. Dependency-free repository verification

```bash
node scripts/verify-foundation.mjs
node scripts/verify-runtime.mjs
```

These verify package/version alignment, required runtime files, process-boundary restrictions, `shell: false`, no `eval`/`exec`, binary resolver usage, and the updated execution JSON schema.

### 4. Full npm validation

The environment used to assemble this milestone cannot reach the npm registry, so the dependency-backed suite could not be installed here.

On a network-enabled development machine run:

```bash
npm install
npm run validate
```

The full suite includes TypeScript, ESLint, Vitest, and production build checks.

## Captured validation output

The exact dependency-free validation transcript is stored in [`validation-output.txt`](./validation-output.txt).
