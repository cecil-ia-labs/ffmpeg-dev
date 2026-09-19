# Milestone 12 — Test Suite & Media Fixtures

Milestone 12 turns the accumulated domain tests into an explicit regression system and adds a reproducible media-fixture matrix for `v0.9.5`.

## Test layers

```text
unit
integration
CLI
FFmpeg integration
fixture-based regression
```

The repository already contained unit, integration, CLI, and FFmpeg-backed tests from earlier milestones. Milestone 12 formalizes those layers, adds fixture-property regression, and adds one explicit integration regression case for every migrated Bash script.

## Reproducible fixtures

Binary media is generated locally rather than committed to Git.

```bash
npm run fixtures:generate
```

The generator materializes `test/fixtures/generated/` from deterministic FFmpeg recipes. The directory is Git-ignored.

The authoritative fixture contract is:

```text
test/fixtures/manifest.json
```

It specifies the expected codec, dimensions, pixel format, frame rate, timebase, sample rate, channel count, stream absence/presence, and special traits such as VFR.

## Fixture matrix

Coverage includes:

```text
MP4 H.264 + AAC
MP4 H.265/HEVC + AAC
WebM VP9 + Opus
GIF
animated WebP
PNG
JPEG
MP3
AAC
WAV PCM
G.711 μ-law
24 fps CFR
30 fps CFR
VFR
missing audio
missing video
1/1000 timebase
1/90000 timebase
160×90 resolution
320×180 resolution
yuv420p
yuv444p
speech-like audio with silence intervals
```

## FFprobe is the oracle

`npm run verify:fixtures` regenerates the fixture set with `--force`, probes every output with FFprobe, and compares actual stream properties with the manifest.

For VFR, verification additionally reads frame timestamps and requires at least two distinct positive timestamp deltas. Animated formats require multiple decoded video frames.

File existence alone is never considered a successful regression result.

## Legacy migration regression

`test/fixtures/legacy-migration-map.json` enumerates all 21 scripts under `legacy/bash/`.

`test/regression/legacy-migrations.integration.test.ts` contains an explicit equivalent integration test for every entry, covering video, audio, conversion, composition, diagnostics/repair, and streaming-plan behavior.

The structural verifier compares the map against the actual legacy directory, so adding/removing a Bash script without updating migration regression causes validation to fail.

## Commands

```bash
npm run fixtures:generate
npm run verify:fixtures
npm run verify:test-suite
npm test
npm run fixtures:clean
```

The full release gate remains:

```bash
npm run validate
```

`validate` verifies the test topology and fixture matrix before TypeScript/lint/Vitest/build/package verification.

## Environment note

The fixture matrix intentionally uses CPU/reference encoders that make codec expectations deterministic. Missing required encoders fail with a capability-specific message rather than silently changing the fixture codec.
