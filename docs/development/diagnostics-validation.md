# Milestone 8 — Validation

## Assembly environment

- Node.js: 22.16.0
- FFmpeg/FFprobe available locally
- npm registry: unavailable/timed out during package installation

## Static compilation

The complete `src/diagnostics/` dependency graph was compiled with TypeScript strict settings including:

```text
strict
exactOptionalPropertyTypes
noUncheckedIndexedAccess
module=NodeNext
moduleResolution=NodeNext
```

Local Node 22 typings were used from an already-installed global toolchain. No source changes or compatibility shims were added to the release package for this validation.

## Real-media smoke validation

A deterministic fixture was generated with:

```text
video: 160×90 H.264 @ 24 fps
audio: AAC @ 44.1 kHz
duration: ~1.2 s
```

Observed results:

```text
diagnose(input)       → no error findings
normalize             → 320×180, CFR 30/1, no post-repair findings
repair timestamps     → video=1, audio=1, no post-repair findings
deep freeze scan      → completed; no freeze intervals in moving testsrc fixture
```

The normalized output was explicitly changed to emit CFR output timing (`-fps_mode cfr -r <fps>`) after a first smoke run showed an FFprobe average-rate artifact. The final output reports both `avg_frame_rate=30/1` and `r_frame_rate=30/1`.

## Repository verifiers

All dependency-free milestone verifiers passed through Milestone 8:

```text
Foundation      PASS
Runtime         PASS
Inspection      PASS
Video           PASS
Audio           PASS
Conversion      PASS
Composition     PASS
Diagnostics     PASS
```

## npm suite

`npm install` timed out because the assembly environment could not reach the npm registry. Therefore the release package includes the full Vitest/ESLint test sources, but `npm run validate` must be executed in a connected local environment before committing/releasing the milestone.

Recommended gate:

```bash
npm run check
npm run lint
npm test
npm run build
npm run validate
```
