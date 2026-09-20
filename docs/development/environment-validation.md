# Milestone 3 Validation

**Version:** `0.1.0-alpha.3`  
**Date:** 2026-09-18

## Assembly environment

```text
Node.js   v22.16.0
FFmpeg    7.1.5-0+deb13u1
FFprobe   7.1.5-0+deb13u1
```

The installed FFmpeg satisfies the project minimum of `>= 6.1`.

## Dependency-free repository verifiers

The following passed:

```bash
node scripts/verify-foundation.mjs
node scripts/verify-runtime.mjs
node scripts/verify-inspection.mjs
```

Observed output:

```text
Foundation verification passed for @cecilialabs/ffmpeg@0.1.0-alpha.3
Runtime verification passed for @cecilialabs/ffmpeg@0.1.0-alpha.3
Milestone 3 environment verifier: PASS
fixture streams: 2
```

## Strict TypeScript checks

The Milestone 3 core/environment/media modules were compiled with strict options matching the project configuration, including:

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

A second strict check covered the complete `src/` and `test/` trees plus `vitest.config.ts` using temporary interface-only shims for `commander`, `zod`, and Vitest, because the assembly environment could not fetch npm dependencies. Both checks passed.

The shims were validation-only and are not included in the project.

## Real environment inspection

The actual Milestone 3 TypeScript environment modules were emitted to a temporary validation directory and executed against the installed FFmpeg/FFprobe binaries.

Results:

| Measurement | Result |
|---|---:|
| FFmpeg compatible with minimum | yes |
| Codecs parsed | 520 |
| Encoders parsed | 225 |
| Decoders parsed | 537 |
| Filters parsed | 555 |
| Doctor status | `ok` |

Reported hardware acceleration methods:

```text
vdpau
cuda
vaapi
qsv
drm
opencl
vulkan
```

Compiled/reported backend summaries included NVENC, VAAPI, QSV, CUDA, Vulkan and OpenCL. VideoToolbox was correctly not reported on this Linux assembly environment.

This is compile/report detection only; no claim is made that a physical accelerator can be initialized successfully.

## Real probe validation

A temporary audiovisual fixture was generated with FFmpeg:

- MPEG-4 Part 2 video;
- `96x64` resolution;
- `10 fps`;
- `yuv420p`;
- AAC audio;
- `48 kHz` mono;
- approximately `0.5 s` duration.

The current `probeMedia()` implementation successfully normalized the file to:

```text
format: mov,mp4,m4a,3gp,3g2,mj2
duration: 0.5 s
video codec: mpeg4
video resolution: 96x64
video pixel format: yuv420p
video average frame rate: 10/1
audio codec: aac
audio sample rate: 48000
audio channels: 1
audio layout: mono
audio sample format: fltp
```

The complete captured validation object is stored in:

```text
docs/development/environment-validation-output.txt
```

## Dry-run validation

`probeMedia(..., { dryRun: true })` was verified to:

- resolve FFprobe;
- validate the input file;
- produce the intended invocation;
- set `execution.executed` to `false`;
- avoid executing FFprobe.

Capability dry-run generated the five expected read-only FFmpeg invocations without spawning them.

## Error validation

Probing a missing file was verified to produce:

```text
E_INPUT_NOT_FOUND
```

rather than leaking a filesystem exception.

## npm dependency limitation

`npm install` was attempted in the assembly environment but package-registry access timed out. Therefore the dependency-backed commands below could not be executed here:

```bash
npm run lint
npm test
npm run build
npm run validate
```

Vitest test sources are included for parser, normalizer, environment, real-fixture and probe behavior. On a normal development machine with npm registry access, the final validation command is:

```bash
npm install
npm run validate
```


## Consolidated compatibility hotfix

The final Milestone 3 package includes two portability fixes discovered during validation on Ubuntu with FFmpeg `8.0.1-3ubuntu2+esm4` and current Node typings:

1. `ffmpeg -filters` in FFmpeg 8 uses two-character capability flags such as `TS`, `..`, `.S`, and `T.`. The parser now accepts both two- and three-character T/S/C flag layouts while continuing to reject legend rows.
2. `TailCapture.value` is explicitly typed as `Buffer`, whose current Node default backing-store generic is `ArrayBufferLike`. This prevents the TypeScript assignment error caused by `Buffer.alloc()` being inferred more narrowly than `Buffer.subarray()`.

The regression test fixture reproduces the exact FFmpeg 8 filter-table shape reported on Ubuntu.
