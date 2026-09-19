# Changelog

## 0.9.7 — Milestone 13 — UX, Progress & Agent-Friendly Output

### Added

- Async-scoped FFmpeg progress observer used by CLI actions.
- Automatic `-progress pipe:1 -nostats` instrumentation for observable FFmpeg operations.
- Structured progress fields for frame count, processing FPS, speed multiplier, processed time, percentage, ETA, and completion state.
- Duration estimation from explicit output ranges, FFprobe preflight metadata, trim offsets, speed factors, and multi-input composition timelines.
- TTY single-line progress rendering and coarse non-TTY progress checkpoints.
- `--no-progress` global CLI option.
- Structured progress summaries in the JSON result envelope.
- Human errors now include stable toolkit error codes.
- Restrained TTY color for human stdout, warnings, and errors with `--no-color`, `NO_COLOR`, and `FORCE_COLOR` support.
- Milestone 13 unit/integration tests, `verify:ux`, documentation, and checklist.

### Changed

- Package/plugin version advanced to `0.9.7`.
- `npm run validate` now includes `verify:ux`.
- Output-envelope JSON Schema and public contracts now include optional progress summaries.
- Batch conversion progress respects the global `--no-progress` setting.

### Agent contract

- `--json` keeps human progress off stdout and emits one result envelope.
- Machine consumers can read typed progress fields instead of scraping FFmpeg terminal statistics.
- Unbounded live streams omit percentage/ETA rather than fabricating a duration.
- GitHub Actions remain deferred until alpha completion.

### Validation

Run locally before merge:

```bash
npm run validate
```


## 0.9.5 — Milestone 12 — Test Suite & Media Fixtures

### Added

- Reproducible FFmpeg fixture generator and Git-ignored generated fixture directory.
- Checked-in fixture manifest describing expected codecs, streams, dimensions, frame rates, timebases, pixel formats, sample rates, and channels.
- Fixture coverage for H.264, HEVC, VP9, GIF, static WebP, animated WebP, PNG, JPEG, MP3, AAC, PCM WAV, G.711 μ-law, CFR/VFR, missing streams, multiple timebases, resolutions, and pixel formats.
- FFprobe-backed fixture verification including VFR timestamp-delta checks.
- Explicit legacy migration map for all 21 Bash scripts.
- One equivalent integration regression case for every migrated Bash script.
- `verify:test-suite`, `verify:fixtures`, `fixtures:generate`, and `fixtures:clean` scripts.
- Milestone 12 test/fixture documentation and checklist.

### Changed

- Package/plugin version advanced to `0.9.5`.
- `npm run validate` now verifies test topology and the complete media fixture matrix before TypeScript/lint/Vitest/build/package gates.
- Project identity version advanced to `0.9.5`; test-only fixture contracts remain outside the distribution package.

### Regression guarantees

- Media tests verify FFprobe properties rather than treating output existence as success.
- Legacy GIF→WebM is asserted as real VP9 WebM.
- Legacy `gsm-ulaw` naming is guarded by an explicit G.711 μ-law versus GSM assertion.
- WebP→PNG regression uses a static WebP decode fixture; animated WebP remains separately guarded through RIFF animation chunks because FFmpeg 7.1.x has incomplete animated-WebP decode support.
- Legacy “WebSocket” capture is guarded as an HTTP MPEG-TS relay plan.
- GitHub Actions remain deferred until alpha completion.

### Validation

Run locally before merge:

```bash
npm run validate
```


## 0.9.0 — Milestone 11 — Plugin Packaging & Assets

### Added

- Final portable `plugin.json` metadata for Agent Plugins 1.0.0.
- Cecil-IA Labs extension namespace for branding, documentation, skill catalog, and npm identity metadata.
- Original self-contained light/dark plugin icons, horizontal logo, and two SVG documentation-preview assets.
- `specs/plugin-extension.schema.json` documenting the Cecil-IA Labs extension payload.
- `scripts/verify-plugin.mjs` for manifest, containment, skill catalog, and asset validation.
- `scripts/verify-package.mjs` for `npm pack --dry-run --json --ignore-scripts` tarball inspection.
- `test/plugin/plugin-package.test.ts` and Milestone 11 packaging documentation/checklist.

### Changed

- Package/plugin version advanced to `0.9.0`.
- npm package `files` allowlist now explicitly includes `docs/` and `CHANGELOG.md`.
- `npm run validate` now runs static plugin verification before compile/test gates and tarball verification after build.
- README, roadmap, project identity, and asset documentation updated for distributable plugin packaging.

### Standards

- The closed Agent Plugins 1.0.0 manifest schema is respected; skills remain in the standard fixed `skills/` discovery directory.
- Branding/documentation metadata is placed under `extensions.com.cecilialabs.ffmpeg` instead of non-standard top-level fields.
- GitHub Actions remain deferred until alpha completion.

### Validation

Run locally before merge:

```bash
npm run validate
```


## 0.8.0 — Milestone 10 — Professional-Level Skills

### Added

- Seven professional agent skills: environment, video editing, audio, conversion, composition, streaming, and diagnostics.
- Portable YAML front matter with precise activation descriptions for every skill.
- Explicit “do not use” boundaries to reduce cross-domain activation ambiguity.
- Required-input, preflight, toolkit-command, validation, recovery, safety, and deterministic-behavior sections in every skill.
- One substantive domain reference document under each skill's `references/` directory.
- `scripts/verify-skills.mjs` and `test/skills/skills.test.ts`.
- Milestone 10 architecture documentation and completion checklist.

### Changed

- Package/plugin version advanced to `0.8.0`.
- `npm run validate` now includes `verify:skills`.
- `skills/README.md` now documents the installed professional skill set.

### Policy

- Implemented operations prefer `@cecilialabs/ffmpeg` over arbitrary FFmpeg shell construction.
- Native FFmpeg is a fallback for unsupported capabilities or explicit native-command requests.
- GitHub Actions remain deferred until the alpha version is complete.

### Validation

Run locally before merge:

```bash
npm run check
npm run lint
npm test
npm run build
npm run validate
```


## 0.7.0 — Milestone 9 — Streaming & Capture

### Added

- Real `stream camera` and `stream file <input>` commands.
- Typed streaming domain separating source/capture, encoding, container, transport, and destination.
- Direct HTTP/HTTPS, RTMP/RTMPS, RTSP, SRT, UDP, and TCP planning.
- URL-scheme/transport compatibility validation and protocol-specific muxer defaults.
- V4L2, AVFoundation, and DirectShow camera input formats.
- Low-latency H.264 default plus MPEG-1 video support for legacy JSMpeg-style receivers.
- AAC, stream-copy, and audio-drop policies.
- FFprobe preflight for file sources and `-re` real-time pacing by default.
- Dry-run planning that does not open camera devices or network destinations.
- Milestone 9 unit, CLI, and dry-run integration tests.
- `verify:streaming` and streaming report JSON Schema.
- Milestone 9 architecture and legacy migration documentation.

### Changed

- Package/plugin version advanced to `0.7.0`.
- Streaming commands are no longer placeholders.
- `npm run validate` now includes the Milestone 9 streaming verifier.
- The legacy `stream-to-websocket.sh` behavior is represented accurately as HTTP MPEG-TS output.

### Policy

- Direct WebSocket output is intentionally rejected. WebSocket/browser delivery must use an explicit relay rather than treating HTTP as WebSocket.
- GitHub Actions remain deferred until the alpha version is complete.

### Validation

- Unit and integration test sources are included.
- Dry-run integration tests are designed to require FFmpeg/FFprobe but no live network receiver or camera.
- Final `npm run validate` is delegated to the configured local Codex Environment before merge.


## 0.6.0 — Milestone 8 — Diagnostics & Repair

### Added

- Real `diagnose`, `repair timestamps`, and `repair normalize` commands.
- Typed diagnostic issue/severity model and structured diagnostic report schema.
- FFprobe structural checks for streams, frame rates, time bases, SAR, pixel format, and WebM codec compatibility.
- Read-only FFmpeg decode scan with parsing for decode errors, corrupt packets, non-monotonic DTS, PTS/DTS failures, timestamp discontinuities, stream-mapping errors, and filter-graph errors.
- Optional `--log` analysis for pre-existing FFmpeg stderr logs.
- Optional deep `freezedetect` analysis.
- Timestamp repair `remux` and `reencode` modes.
- Full video/audio normalization with aspect-preserving scale/pad, square-pixel SAR, CFR, pixel format, AVTB/PTS reset, async audio resampling, and channel-layout normalization.
- Post-repair FFprobe and diagnostic validation.
- Milestone 8 unit/integration/CLI test sources and `verify:diagnostics`.
- ChatGPT Desktop / Codex Local Environment setup documentation plus `codex:setup` and `codex:cleanup` scripts.

### Changed

- Package/plugin version advanced to `0.6.0`.
- Diagnostics and repair commands are no longer placeholders.
- `npm run validate` now includes the Milestone 8 diagnostics verifier.

### Validated

- Strict TypeScript compilation of the diagnostics dependency graph with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- Real FFmpeg/FFprobe diagnose, normalization, timestamp-repair, reprobe, and deep-freeze smoke runs.
- Normalized CFR output reports `avg_frame_rate=30/1` and `r_frame_rate=30/1` in the validation fixture.
- Full npm-based validation remains delegated to a connected local environment because registry access timed out in the assembly sandbox.

## 0.5.0 — Milestone 7 — Composition & Filter Graph Engine

### Added

- Real `compose concat`, `compose transition`, and `compose slideshow` commands.
- Reusable `FilterGraphBuilder` and composition normalization layer.
- N-input normalized concat with optional FFmpeg `xfade` transitions and cumulative offsets.
- Audio `concat` and `acrossfade` handling with `auto`, `preserve`, and `drop` policies.
- Portable built-in xfade transition catalog replacing the legacy hard dependency on `gltransition`.
- Vertical-stack slideshow migration with deterministic image discovery and no shell `eval`.
- Composition report schema, CLI/unit/integration test sources, `verify:composition`, and Milestone 7 documentation.

### Fixed

- Milestone 6 CLI tuning boundary for `exactOptionalPropertyTypes: true` using a dedicated `TuningInput` and conditional property emission.
- Node globals for verifier scripts in ESLint configuration.
- Unused imports in `audio/attach.ts`, `video/trim.ts`, and `verify-foundation.mjs`.
- Unnecessary quote escapes in `verify-conversion.mjs`.
- ANSI escape stripping implementation so `no-control-regex` can remain enabled.
- FFmpeg 7.x xfade compatibility by applying `setpts=PTS-STARTPTS` before `fps`; applying it after `fps` can clear CFR metadata and produce `current rate of 1/0 is invalid`.

### Validated

- Strict TypeScript compilation of the composition domain.
- Real FFmpeg 7.1.5 transition, fade concat, plain concat, and vertical-stack slideshow smoke tests using mismatched input resolution/FPS.
- Outputs were reprobed with FFprobe and retained expected video/audio streams.

## 0.4.0 — Milestone 6 — Media Conversion & Batch Engine

### Added

- Real `convert file <input>` and `convert batch <directory>` commands.
- Typed `src/conversion/` domain with format inference, profile construction, file conversion, glob matching, and generic batch scheduling.
- Initial conversion matrix: MP4→WebM, MP4→GIF, MP4→animated WebP, WebM→GIF, WebP→PNG, and GIF→WebM.
- Generic batch traversal with optional recursion, include/exclude globs, deterministic ordering, configurable parallelism, fail-fast/continue-on-error modes, output directories, hierarchy preservation, existing-output strategies, progress events, summaries, and JSON reports.
- Preflight output-collision detection for flattened or otherwise colliding batch destinations.
- Inline GIF palette generation and paletteuse pipeline.
- Animated WebP generation through FFmpeg directly, removing the legacy `webpmux` dependency.
- Batch and single-conversion JSON schemas.
- Milestone 6 unit, CLI, discovery, and real-media integration-test sources.
- Dependency-free `verify:conversion` verifier and Milestone 6 architecture/migration/validation documentation.

### Changed

- Package/plugin version advanced to `0.4.0`.
- Conversion commands are no longer placeholders.
- The legacy `convert-all-gif-in-folder-to-webm.sh` intent is corrected: the toolkit now performs real GIF→WebM conversion instead of producing another GIF.
- MP4→WebM uses VP9 and preserves audio as Opus when present.
- GIF and animated-WebP conversion drop audio explicitly and emit structured warnings.
- WebP→PNG explicitly exports the first frame.
- Dry-run conversion performs read-only FFprobe inspection so stream-dependent plans remain accurate while FFmpeg transformation is not executed.

### Validated

- All six conversion routes completed successfully with real FFmpeg/FFprobe in the assembly environment.
- A recursive two-file batch completed with `parallelism=2`, hierarchy preservation, and zero failures.
- A second run with `existing=skip` skipped both pre-existing outputs without invoking conversion.
- Production and test TypeScript trees passed strict compilation using temporary interface-only dependency shims because npm registry access timed out in the assembly environment.

## 0.3.0 — Milestone 5 — Audio Processing

### Added

- Real `audio attach`, `audio silence`, `audio add-silence`, `audio detect-silence`, `audio remove-silence`, and `audio telephony` commands.
- Dedicated `src/audio/` domain with typed operation reports and runtime options.
- Structured `SilenceInterval` parsing from FFmpeg `silencedetect` output.
- Configurable `silenceremove` pipeline with threshold, minimum-duration, and retained-silence controls.
- Safe silent-track generation with explicit channel-layout semantics.
- Audio attachment replace/append modes with default padding and container-aware AAC/Opus selection.
- Telephony profiles for G.711 μ-law, G.711 A-law, GSM, and PCM with explicit codec/container compatibility.
- Raw μ-law, A-law, GSM, and signed-16-bit PCM muxer support.
- Shared media I/O module for readable-file checks, output derivation, overwrite protection, and transactional staging across video and audio.
- Milestone 5 unit, CLI, and real-media integration-test sources.
- `verify:audio` smoke verifier and Milestone 5 architecture/migration/validation documentation.

### Changed

- Package/plugin version advanced to `0.3.0`.
- Audio commands are no longer placeholders.
- `audio add-silence` refuses to replace existing audio unless `--replace-existing` is explicit.
- `audio remove-silence` is deliberately audio-only in v0.3.0 to prevent implicit A/V desynchronization.
- The old `convert-audio-to-gsm-ulaw.sh` behavior is split into semantically correct G.711 μ-law and GSM profiles.
- Milestone 4 verifier now accepts later semantic versions instead of requiring exactly `0.2.0`.

### Validated

- Real silence generation, audio attachment, silent-track insertion, silence detection, silence removal, G.711 μ-law transcoding, and GSM transcoding completed successfully in the assembly environment.
- `silencedetect` identified two known silence intervals in a deterministic fixture.
- `silenceremove` reduced a 2.1-second fixture to approximately 0.989 seconds.
- G.711 μ-law probed as `pcm_mulaw` at 8000 Hz mono; GSM probed separately as codec `gsm`.
- Production source and test source passed strict TypeScript compilation using temporary dependency interface shims because npm registry access timed out in the assembly environment.

## 0.2.0 — Milestone 4 — Video Editing Operations

### Added

- Real `video trim-start`, `video trim-end`, and `video trim` commands.
- `auto`, `copy`, and `accurate` trim modes with keyframe warning for stream-copy cuts.
- Real `video speed` with synchronized audio tempo chaining and explicit audio-drop mode.
- Real `video from-image` with duration, resolution, FPS and pixel-format controls.
- Real `video restore` with explicit resolution plus balanced/aggressive restoration profiles.
- Container-aware H.264/AAC and VP9/Opus encoding profiles.
- Sibling temporary-output transaction with overwrite protection and final FFprobe validation.
- Milestone 4 CLI-local options and action registry entries.
- Unit, CLI and real-media integration tests for video operations.
- Milestone 4 architecture, validation and Bash migration documentation.

### Changed

- Package/plugin version advanced to `0.2.0`.
- Video commands are no longer placeholders.
- `auto` trim currently resolves to accurate re-encoding for deterministic cut semantics.
- Legacy `HD`/`FHD` naming is replaced by explicit `WIDTHxHEIGHT` resolution.
- Dry-run for video transforms may perform read-only FFprobe inspection but never executes the mutating FFmpeg transform.

### Validated

- Real trim-start, trim-end, trim-range, speed, still-image clip and restore transformations completed successfully in the assembly environment.
- Final outputs were normalized with FFprobe and validated for duration, streams and dimensions.
- Paths containing spaces were exercised by real transformations.
- Production source passed strict TypeScript compilation using dependency interface shims because npm registry access timed out in the assembly environment.

## 0.1.0-alpha.3 — Milestone 3 consolidated fixes

- Fixed `ffmpeg -filters` parsing for FFmpeg 8.x distributions whose filter capability column uses two characters (`TS`, `..`, `.S`, `T.`).
- Preserved compatibility with FFmpeg releases that expose the older three-character filter flags (`TSC`, `...`).
- Kept ANSI stripping and stdout/stderr capability-table collection from the first Milestone 3 hotfix.
- Fixed TypeScript/Node Buffer generic inference in `TailCapture` by explicitly typing the backing buffer as `Buffer` (`Buffer<ArrayBufferLike>` under current Node typings).
- Added a regression fixture based on Ubuntu FFmpeg 8.0.1 output.

All notable changes to FFmpeg Media Toolkit will be documented here.

## 0.1.0-alpha.3 — 2026-09-18

### Added

- Real `doctor` CLI command and environment health report.
- Real `environment version` and `environment capabilities` commands.
- Typed parsers for FFmpeg codecs, encoders, decoders, filters and hardware acceleration methods.
- Conservative hardware backend summaries for NVENC, VAAPI, QSV, VideoToolbox, CUDA, Vulkan and OpenCL.
- Minimum FFmpeg compatibility evaluation against the Milestone 0 `>= 6.1` policy.
- Canonical FFprobe JSON media inspection and normalization.
- Typed `MediaInfo`, video/audio/auxiliary stream normalization and tighter discriminated stream contracts.
- Input existence/readability checks for probe operations.
- `specs/media-info.schema.json`.
- Milestone-aware CLI action registry so implemented leaves coexist with future placeholders.
- Explicit string typing for result-envelope request IDs, allowing deterministic non-UUID IDs in tests and library callers.
- Dependency-free `verify:inspection` smoke verifier.
- ADR 0003 selecting FFprobe JSON as the canonical media inspection interface.
- Milestone 3 unit/integration test sources.

### Changed

- `doctor`, `probe`, `environment version`, and `environment capabilities` are no longer placeholders.
- Probe JSON capture is explicitly bounded at 16 MiB and truncation fails safely.
- Capability table capture is bounded at 8 MiB per FFmpeg process.
- `environment install` is now an explicit reserved-policy response rather than a misleading Milestone 3 placeholder.

### Validated

- FFmpeg `7.1.5-0+deb13u1` and FFprobe `7.1.5-0+deb13u1` were inspected successfully in the assembly environment.
- Capability parsing found 520 codecs, 225 encoders, 537 decoders and 555 filters in that environment.
- Hardware method enumeration reported `vdpau`, `cuda`, `vaapi`, `qsv`, `drm`, `opencl`, and `vulkan`.
- A generated MP4 fixture containing MPEG-4 video plus AAC audio was probed and normalized successfully.
- New production source passes strict TypeScript compilation in the assembly environment using dependency interface shims.

## 0.1.0-alpha.2 — 2026-09-18

### Added

- Shared FFmpeg/FFprobe process runtime.
- Deterministic binary resolution with explicit, environment, and PATH lookup.
- Native `spawn` execution boundary with `shell: false`.
- Bounded stdout/stderr capture with truncation metadata.
- Structured `CommandExecution` results.
- Typed runtime error definitions and exit-code mapping.
- AbortSignal cancellation and process-signal bridge.
- Temporary workspace manager with traversal protection.
- Incremental FFmpeg `-progress` parser.
- Result-envelope builders for stable JSON output.
- Binary version parsing foundation for Milestone 3.
- Milestone 2 unit/integration test sources and runtime verifier.
- ADR 0002 documenting the native process runtime boundary.

### Changed

- Removed the provisional `execa` runtime dependency in favor of native Node.js `spawn`.
- Extended the execution JSON schema with execution/truncation/signal metadata.
- Exported core runtime APIs from the package root.

### Validated

- Core runtime passes strict TypeScript compilation.
- Real `ffmpeg -version` and `ffprobe -version` execution passed in the assembly environment.
- Cancellation, dry-run, progress parsing, result envelopes, and temporary-workspace behavior passed smoke validation.

## 0.1.0-alpha.1 — 2026-09-18

### Added

- Portable `plugin.json` manifest.
- ESM TypeScript project foundation with strict compiler settings.
- Commander-based hierarchical CLI skeleton.
- Stable global flags from Milestone 0.
- Zod validation for global CLI options.
- Placeholder command registration for the full frozen command grammar.
- Vitest smoke/unit test foundation.
- ESLint flat configuration and Prettier formatting configuration.
- npm `bin` mapping for `cecilia-ffmpeg`.
- MIT license and ADR documenting the licensing decision.

### Preserved

- Milestone 0 architecture/specification artifacts.
- Legacy Bash migration corpus for later domain milestones.
