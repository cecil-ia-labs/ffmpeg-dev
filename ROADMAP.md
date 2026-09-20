# FFmpeg Media Toolkit — Development Roadmap

> **Project:** `ffmpeg-media-toolkit`  
> **CLI package:** `@cecilialabs/ffmpeg`  
> **Primary language:** TypeScript  
> **Execution:** `npx @cecilialabs/ffmpeg ...`  
> **Runtime:** Node.js  
> **Media engine:** FFmpeg / FFprobe  
> **Distribution:** ChatGPT Plugin + Codex Skills + npm CLI  
> **Initial scope:** migration and professionalization of the existing FFmpeg Bash utilities.

---

## Project Goals

The project will provide a reusable, deterministic, agent-friendly FFmpeg toolkit with:

- a single TypeScript codebase;
- a unified hierarchical CLI;
- direct FFmpeg and FFprobe execution without shell interpolation;
- professional-level ChatGPT/Codex Skills;
- batch processing;
- structured JSON output;
- `--dry-run` support;
- media inspection before complex transformations;
- normalized error handling;
- automated tests;
- optional future MCP integration;
- migration of existing Bash scripts into typed reusable operations.

---

# Milestone 0 — Architecture & Specification

**Target:** `v0.0.x`

### Objectives

Define the architecture before migrating individual scripts.

### Deliverables

- [ ] Define package naming and plugin identity.
- [ ] Establish repository structure.
- [ ] Define supported Node.js version.
- [ ] Define minimum supported FFmpeg version.
- [ ] Define CLI command hierarchy.
- [ ] Define TypeScript public interfaces.
- [ ] Define error taxonomy.
- [ ] Define JSON output contract.
- [ ] Define logging conventions.
- [ ] Define command exit codes.
- [ ] Define overwrite behavior.
- [ ] Define temporary-file lifecycle.
- [ ] Define batch execution semantics.
- [ ] Define supported operating systems.
- [ ] Catalog all existing Bash scripts.
- [ ] Map each Bash script to its future semantic command.
- [ ] Identify incorrect or misleading legacy script names.
- [ ] Identify legacy commands that should not be reproduced literally.

### Initial command taxonomy

```text
cecilia-ffmpeg
├── doctor
├── probe
│
├── video
│   ├── trim-start
│   ├── trim-end
│   ├── trim
│   ├── speed
│   ├── from-image
│   └── restore
│
├── audio
│   ├── attach
│   ├── silence
│   ├── add-silence
│   ├── detect-silence
│   ├── remove-silence
│   └── telephony
│
├── convert
│   ├── file
│   └── batch
│
├── compose
│   ├── concat
│   ├── transition
│   └── slideshow
│
├── repair
│   ├── timestamps
│   └── normalize
│
└── stream
    ├── camera
    └── file
```

### Acceptance Criteria

The architecture must support adding a new FFmpeg operation without requiring changes to the CLI infrastructure or execution layer.

---

# Milestone 1 — Repository & TypeScript Foundation

**Target:** `v0.1.0-alpha.1`

### Objectives

Create the executable TypeScript foundation.

### Deliverables

```text
ffmpeg-media-toolkit/
├── plugin.json
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── src/
├── skills/
├── assets/
└── test/
```

- [x] Configure TypeScript strict mode.
- [x] Configure ESM.
- [x] Configure `tsx` for development.
- [x] Configure production build.
- [x] Configure npm `bin`.
- [x] Add Commander CLI.
- [x] Add `execa` or equivalent process runner.
- [x] Add Zod validation.
- [x] Add Vitest.
- [x] Add formatting/linting.
- [x] Implement global CLI flags.

### Global CLI flags

```text
--output
--overwrite
--dry-run
--json
--quiet
--verbose
--ffmpeg-path
--ffprobe-path
```

### Target UX

Development:

```bash
npx tsx src/cli.ts doctor
```

Published:

```bash
npx @cecilialabs/ffmpeg doctor
```

### Acceptance Criteria

```bash
npx tsx src/cli.ts --help
```

must expose a functioning CLI without invoking FFmpeg.

---

# Milestone 2 — FFmpeg Core Runtime

**Target:** `v0.1.0-alpha.2`  
**Status:** ✅ Implemented

### Objectives

Implement the shared execution layer used by every future command.

### Core modules

```text
src/core/
├── ffmpeg-runner.ts
├── ffprobe-runner.ts
├── binary-resolver.ts
├── capabilities.ts
├── cancellation.ts
├── command-result.ts
├── progress.ts
├── result-envelope.ts
├── temp-files.ts
└── errors.ts
```

### Deliverables

- [x] Binary discovery.
- [x] Explicit binary override.
- [x] FFmpeg execution.
- [x] FFprobe execution.
- [x] Safe argument-array execution.
- [x] No `eval`.
- [x] No shell interpolation.
- [x] Exit-code handling.
- [x] Signal handling.
- [x] stdout/stderr capture.
- [x] Structured execution result.
- [x] Temporary-file management.
- [x] `--dry-run`.
- [x] `--json`.
- [x] Cancellation support.
- [x] Execution timing.
- [x] Verbose command rendering.

### Core contract

```ts
interface FFmpegInvocation {
  binary: string;
  args: string[];
  cwd?: string;
}

interface CommandExecution {
  binary: string;
  args: string[];
  cwd?: string;
  exitCode: number | null;
  signal?: NodeJS.Signals;
  durationMs: number;
  stdout?: string;
  stderr?: string;
  executed: boolean;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
}
```

### Acceptance Criteria

No domain command may invoke `child_process`, `execa`, `ffmpeg`, or `ffprobe` directly. All execution must pass through the core runtime.

---

# Milestone 3 — Doctor, Capabilities & Media Probe

**Target:** `v0.1.0-alpha.3`  
**Status:** ✅ Complete

### Objectives

Give humans and agents reliable environmental and media information before transformations.

### Commands

```bash
npx @cecilialabs/ffmpeg doctor
npx @cecilialabs/ffmpeg probe input.mp4
npx @cecilialabs/ffmpeg probe input.mp4 --json
```

### `doctor`

Detect:

- FFmpeg path;
- FFmpeg version;
- FFprobe path;
- available codecs;
- available encoders;
- available decoders;
- available filters;
- hardware acceleration;
- NVENC;
- VAAPI;
- QSV;
- VideoToolbox;
- platform and architecture.

### `probe`

Normalize FFprobe output into typed structures:

```ts
interface MediaInfo {
  format: MediaFormat;
  duration?: number;
  bitrate?: number;
  streams: MediaStream[];
  video?: VideoStream[];
  audio?: AudioStream[];
}
```

### Acceptance Criteria

An agent should be able to inspect a media file without parsing arbitrary FFprobe console text.

---

# Milestone 4 — Video Editing Operations

**Target:** `v0.2.0`  
**Status:** ✅ Complete

### Legacy scripts covered

```text
crop-x-seconds-from-start.sh
increase-video-speed.sh
create-clip-from-image.sh
upscale-video-to-hd.sh
upscale-video-to-fhd.sh
```

### Commands

```text
cecilia-ffmpeg video trim-start
cecilia-ffmpeg video trim
cecilia-ffmpeg video speed
cecilia-ffmpeg video from-image
cecilia-ffmpeg video restore
```

### Trim modes

```text
copy
accurate
auto
```

Example:

```bash
npx @cecilialabs/ffmpeg video trim-start \
  input.mp4 \
  --seconds 40 \
  --mode auto \
  --output output.mp4
```

### Restore/upscale

Replace misleading legacy concepts such as:

```text
FHD → 1280×720
HD  → 720×404
```

with explicit resolution semantics:

```bash
npx @cecilialabs/ffmpeg video restore \
  input.mp4 \
  --resolution 1920x1080 \
  --output restored.mp4
```

### Acceptance Criteria

Every operation must support paths containing spaces and must not depend on Bash syntax.

---

# Milestone 5 — Audio Processing

**Target:** `v0.3.0`  
**Status:** ✅ Complete

### Legacy scripts covered

```text
add-audio-2-clip.sh
add-silence-2-clip.sh
create-silence-audio.sh
remove-silence-noises.sh
convert-audio-to-gsm-ulaw.sh
```

### Commands

```text
audio attach
audio silence
audio add-silence
audio detect-silence
audio remove-silence
audio telephony
```

### Silence API

```ts
interface SilenceInterval {
  start: number;
  end: number;
  duration: number;
}
```

Example:

```bash
npx @cecilialabs/ffmpeg audio detect-silence \
  speech.mp3 \
  --json
```

```json
{
  "silences": [
    {
      "start": 3.42,
      "end": 5.81,
      "duration": 2.39
    }
  ]
}
```

### Telephony profiles

Explicitly distinguish:

```text
G.711 μ-law / PCMU
G.711 A-law / PCMA
GSM
PCM
```

and properties:

```text
sample rate
channel count
codec
container
sample format
```

Example:

```bash
npx @cecilialabs/ffmpeg audio telephony \
  input.wav \
  --codec mulaw \
  --sample-rate 8000 \
  --channels 1 \
  --output output.wav
```

### Acceptance Criteria

The implementation must not conflate GSM containers/codecs with G.711 μ-law.

---

# Milestone 6 — Media Conversion & Batch Engine

**Target:** `v0.4.0`  
**Status:** ✅ Complete

### Legacy scripts covered

```text
convert-all-gif-in-folder-to-webm.sh
convert-all-mp4-in-folder-to-animated-webp.sh
convert-all-mp4-in-folder-to-gif.sh
convert-all-mp4-in-folder-to-webm.sh
convert-all-webm-in-folder-to-gif.sh
convert-all-webp-in-folder-to-png.sh
```

### Commands

Single file:

```bash
npx @cecilialabs/ffmpeg convert file ./file.mp4 --to webm
```

Batch:

```bash
npx @cecilialabs/ffmpeg convert batch ./clips \
  --from mp4 \
  --to webm
```

### Batch engine

Support:

```text
[x] recursive traversal
[x] extension filtering
[x] include patterns
[x] exclude patterns
[x] parallelism
[x] fail-fast
[x] continue-on-error
[x] output directory
[x] preserve hierarchy
[x] overwrite strategy
[x] progress
[x] summary
[x] JSON report
```

### Conversion profiles

Initial targets:

```text
MP4 → WebM
MP4 → GIF
MP4 → animated WebP
WebM → GIF
WebP → PNG
GIF → WebM
```

### Acceptance Criteria

✅ Batch processing logic is generic. All selected items delegate to the same `convertFile()` implementation; no per-format batch loops exist.

---

# Milestone 7 — Composition & Filter Graph Engine

**Status:** ✅ completed

**Target:** `v0.5.0`

### Legacy scripts covered

```text
concat-all-mp4-in-folder-with-fade.sh
concat-clips.sh
stack_vertical.sh
```

### Objectives

Move complex FFmpeg filter graph knowledge into reusable TypeScript abstractions.

### Core additions

```text
src/composition/
├── filter-graph.ts
├── normalization.ts
├── concat.ts
├── transition.ts
└── slideshow.ts
```

### Commands

```text
compose concat
compose transition
compose slideshow
```

Example:

```bash
npx @cecilialabs/ffmpeg compose concat ./clips \
  --transition fade \
  --duration 1 \
  --output final.mp4
```

### Automatic normalization

Before `xfade`:

```text
scale
→ pad
→ reset PTS
→ fps
→ pixel format
→ timebase
→ transition
```

### Typed normalization configuration

```ts
interface NormalizeVideoOptions {
  width?: number;
  height?: number;
  fps?: number;
  pixelFormat?: string;
  normalizeTimebase?: boolean;
  resetTimestamps?: boolean;
}
```

### Acceptance Criteria

The toolkit must correctly compose videos whose source FPS/timebases differ.

This milestone directly addresses common FFmpeg failures such as:

```text
First input link main timebase does not match second input link
```

---

# Milestone 8 — Diagnostics & Repair

**Target:** `v0.6.0`  
**Status:** ✅ Complete

### Legacy scripts covered

```text
fix-freezes-and-blocks.sh
```

### Commands

```text
repair timestamps
repair normalize
diagnose
```

### Diagnostic domains

- PTS/DTS;
- timebase;
- CFR/VFR;
- FPS mismatch;
- SAR/DAR;
- pixel format;
- codec/container compatibility;
- missing streams;
- malformed timestamps;
- broken stream mapping;
- filter graph failures;
- corrupt packets;
- frozen frames;
- unexpected audio absence.

### Example

```bash
npx @cecilialabs/ffmpeg diagnose broken.mp4
```

Possible structured result:

```json
{
  "issues": [
    {
      "code": "VARIABLE_FRAME_RATE",
      "severity": "warning"
    },
    {
      "code": "NON_MONOTONIC_TIMESTAMPS",
      "severity": "error"
    }
  ]
}
```

### Acceptance Criteria

Repairs should be chosen from observed media properties rather than applying arbitrary reencoding blindly.

---

# Milestone 9 — Streaming & Capture

**Target:** `v0.7.0`  
**Status:** ✅ Complete

### Legacy script covered

```text
stream-to-websocket.sh
```

### Correction

The legacy script was not a direct WebSocket stream: it captured V4L2 video, encoded MPEG-1 video, muxed MPEG-TS, and wrote to an HTTP URL. Milestone 9 models those concerns independently.

### Commands

```text
stream camera
stream file
```

Example:

```bash
npx @cecilialabs/ffmpeg stream camera \
  --device /dev/video0 \
  --input-format v4l2 \
  --framerate 15 \
  --video-size 320x240 \
  --container mpegts \
  --transport http \
  --url http://localhost:8083/stream
```

### Implemented direct transports

```text
HTTP / HTTPS
RTMP / RTMPS
RTSP
SRT
UDP
TCP
```

Direct WebSocket output is deliberately not claimed. Browser/WebSocket delivery requires an explicit relay service.

### Architecture

```text
source/capture
    ↓
encoding
    ↓
container/muxer
    ↓
transport + destination
```

Camera input formats include Linux V4L2, macOS AVFoundation, and Windows DirectShow. File streaming uses FFprobe preflight and real-time input pacing by default.

### Acceptance Criteria

✅ Streaming transport is independent from capture/encoding, and the legacy HTTP output is no longer mislabeled as WebSocket.

---

# Milestone 10 — Professional-Level Skills

**Target:** `v0.8.0`  
**Status:** ✅ Complete

### Skills

```text
skills/
├── ffmpeg-environment/
├── ffmpeg-video-editing/
├── ffmpeg-audio/
├── ffmpeg-conversion/
├── ffmpeg-composition/
├── ffmpeg-streaming/
└── ffmpeg-diagnostics/
```

Every skill contains a portable `SKILL.md` and substantive `references/` material.

### Implemented workflow contract

Each Skill defines:

- precise activation scope;
- when **not** to use it;
- required inputs;
- inspection/preflight rules;
- preferred toolkit commands;
- native FFmpeg fallback rules;
- output expectations;
- validation steps;
- error recovery;
- safety rules;
- deterministic behavior requirements.

### Core Skill policy

For supported operations:

```text
Prefer @cecilialabs/ffmpeg over constructing arbitrary
FFmpeg shell commands.
```

For unsupported operations:

```text
Use native FFmpeg only when the toolkit does not expose
the required capability or the user explicitly asks for
the native FFmpeg invocation.
```

### Quality

- `scripts/verify-skills.mjs` validates skill structure and required workflow sections.
- `test/skills/skills.test.ts` enforces the repository-level skill contract.
- `npm run validate` includes `verify:skills`.

### Acceptance Criteria

✅ Every Skill is independently useful without prior conversation context and routes supported work through the toolkit-first policy.

---

# Milestone 11 — Plugin Packaging & Assets

**Target:** `v0.9.0`  
**Status:** ✅ Complete

### Deliverables

```text
plugin.json
assets/
├── icon.svg
├── icon-dark.svg
├── logo.svg
└── screenshots/
    ├── cli-overview.svg
    └── skills-overview.svg
```

### Portable plugin metadata

The Agent Plugins 1.0.0 manifest remains schema-conformant with standard top-level metadata for name, version, description, author, homepage, repository, license, keywords, and extensions.

Skills are discovered from the fixed `skills/` directory. Branding, documentation, npm identity, and a descriptive skill catalog live under the Cecil-IA Labs extension namespace rather than non-standard top-level fields.

### Distribution validation

- `verify:plugin` validates manifest shape, local-path containment, skill catalog parity, and SVG self-containment.
- `verify:package` runs `npm pack --dry-run --json --ignore-scripts` after build and checks required tarball contents.
- npm `files` explicitly includes `dist/`, `assets/`, `skills/`, `specs/`, `docs/`, plugin metadata, README, changelog, and license.
- repository-only `legacy/`, `test/`, `scripts/`, and `node_modules/` are rejected if leaked into the package.

### Acceptance Criteria

✅ The plugin installs from a self-contained distribution package without relying on files outside that package.

---

# Milestone 12 — Test Suite & Media Fixtures

**Target:** `v0.9.5`  
**Status:** ✅ Complete

### Test layers

```text
unit
integration
CLI
FFmpeg integration
fixture-based regression
```

### Reproducible fixture matrix

Compact media is generated locally from deterministic FFmpeg recipes and validated with FFprobe. The matrix covers:

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
24 fps / 30 fps CFR
VFR
missing audio
missing video
1/1000 and 1/90000 timebases
160×90 and 320×180 resolutions
yuv420p and yuv444p
```

Generated binaries live in a Git-ignored directory; `test/fixtures/manifest.json` is the checked-in property contract.

### Regression behavior

- `verify:fixtures` regenerates the matrix and validates actual stream properties with FFprobe.
- VFR is checked from frame timestamp deltas.
- Animated fixtures require multiple video frames.
- `verify:test-suite` checks all five test layers and compares the legacy migration map against the actual `legacy/bash/` directory.
- Every one of the 21 migrated Bash scripts has an explicit equivalent integration-test case.

### Acceptance Criteria

✅ Every migrated Bash script has at least one equivalent integration test, and fixture tests assert media properties rather than merely output existence.

---

# Milestone 13 — UX, Progress & Agent-Friendly Output

**Target:** `v0.9.7`  
**Status:** ✅ Complete

### Features

- FFmpeg `-progress pipe:1` parsing;
- percentage complete;
- estimated remaining time;
- processed frames;
- processing FPS;
- speed multiplier;
- structured errors;
- human output;
- JSON output;
- TTY and non-TTY progress rendering;
- `--no-progress` live-display control;
- structured per-run progress summaries in the result envelope.

Example:

```text
clip.mp4 | 67% | frame 2411 | 100.0 fps | 3.70x | ETA 00:00:12
```

Agent mode:

```bash
npx @cecilialabs/ffmpeg video speed input.mp4 \
  --factor 2 \
  --json
```

### Output contract

- human final results remain on stdout;
- live progress/warnings/errors use stderr;
- JSON mode emits one machine-readable envelope on stdout;
- progress is structured into fields rather than terminal text;
- multiple FFmpeg subprocesses are represented independently.

### Acceptance Criteria

✅ Machine output does not require scraping decorated CLI text.

---

# Milestone 13.5 — Media Capability Expansion & CLI Polish

**Target:** `v0.9.8`  
**Status:** ✅ Complete

### Motivation

Hands-on CLI testing after Milestone 13 exposed capability and taxonomy gaps that should be resolved before the public documentation/API freeze.

### Added

- JPEG/JPG conversion source and target support;
- MP4 conversion target support;
- audio conversion through the generic file/batch engine;
- first-class `image convert` and `image extract`;
- canonical `video upscale` with `video restore` retained as a compatibility alias;
- canonical `video attach-audio` and `video add-silence` with legacy audio-domain aliases retained;
- shared `contain|cover|stretch` fit semantics and configurable background;
- MP4/WebM output selection for video/composition operations;
- `zoomin` and explicit custom `zoomout` transitions;
- slideshow `vertical-stack|sequence` styles;
- slideshow transitions, include/exclude patterns, and MP4/WebM/GIF/WebP outputs;
- more visible human TTY colors while keeping JSON/non-TTY ANSI-free.

### Conversion formats

```text
video: mp4, webm
image: gif, webp, png, jpeg/jpg
audio: wav, mp3, aac, m4a, flac, opus, ogg
```

### Acceptance Criteria

✅ The public command taxonomy and core format capabilities are stable enough for Milestone 14 to document without immediately redesigning the CLI.

---

# Milestone 14 — Documentation & Migration Guide

**Target:** `v0.9.9`  
**Status:** ✅ Complete

### Documentation

```text
docs/
├── getting-started.md
├── installation.md
├── cli-reference.md
├── video.md
├── image.md
├── audio.md
├── conversion.md
├── composition.md
├── streaming.md
├── diagnostics.md
├── batch-processing.md
├── hardware-acceleration.md
└── migration-from-bash.md
```

### Migration

- all 21 legacy Bash scripts documented;
- canonical v0.9.9 command shown for each migration;
- compatibility aliases called out explicitly;
- historical semantic corrections documented for μ-law/GSM, GIF→WebM, misleading WebSocket naming, and upscale naming.

### Human UX

Interactive TTY output adds semantic emoji/icon cues on top of the stronger color palette:

```text
🎬 video
🖼️ image
🎧 audio
🔄 convert
🧩 compose
📡 stream
🔎 diagnose
🛠️ repair
```

Progress example:

```text
🎬 clip.mp4 | ▶️ 67% | 🎞️ 2411 frames | ⚡ 100.0 fps | 🚀 3.70x | ⌛ ETA 00:00:12
```

Machine contracts remain unchanged: `--json` has no ANSI/emoji decoration; non-TTY progress stays plain; `--no-color` suppresses friendly decoration.

### Quality

- `verify:docs` checks all required guides;
- every public leaf command from `specs/command-tree.json` must appear in the CLI reference;
- all 21 legacy scripts from the migration map must appear in the migration guide;
- hardware acceleration docs are explicitly scoped as future behavior;
- semantic UX has dedicated tests.

### Acceptance Criteria

✅ Users can understand every public command and every legacy migration path without inspecting source code.

---

# Milestone 14.5 — CLI Installation & Release Workflow

**Target:** `v0.9.9` release hardening  
**Status:** Implementation complete; validation/merge pending

### Objectives

Complete the executable-installation and release path before the v1 stabilization milestone:

- standard global `cecilia-ffmpeg` installation through npm `bin`;
- explicit local contributor setup with build + `npm link`;
- opt-in Bash PATH repair only when required;
- no shell-mutating `postinstall`;
- `prepack` build guarantee;
- repository-only pack/publish workflow;
- clean-master and remote-parity release gates;
- publish exact inspected tarball;
- npm verification followed by optional Git tag;
- branded CLI help headline;
- structural distribution verifier.

### Stable installation model

```text
public user
  -> npm install -g @cecilialabs/ffmpeg
  -> npm creates executable link
  -> cecilia-ffmpeg

repository contributor
  -> npm run setup:cli
  -> consent
  -> build + npm link
  -> optional consented ~/.bashrc PATH repair
  -> cecilia-ffmpeg
```

### Acceptance Criteria

The CLI is directly callable after standard global npm installation, local linking is explicit and reversible, publication uses the exact inspected tarball, and no installation lifecycle hook silently modifies user shell configuration.

---

# Milestone 15 — Stable CLI Release

**Target:** `v1.0.0`

### Release requirements

- [ ] CLI architecture stable.
- [ ] Core APIs stable.
- [ ] Original script set migrated.
- [ ] All Skills validated.
- [ ] Plugin installable.
- [ ] Linux fully tested.
- [ ] macOS smoke-tested.
- [ ] Windows strategy documented/tested.
- [ ] npm package ready.
- [ ] Clean installation tested.
- [ ] Full README completed.
- [ ] Changelog generated.
- [ ] Semantic versioning established.
- [ ] No dependency on `.sh` implementations.

### Stable user experience

```bash
npx @cecilialabs/ffmpeg doctor
```

```bash
npx @cecilialabs/ffmpeg probe video.mp4
```

```bash
npx @cecilialabs/ffmpeg video trim-start \
  video.mp4 \
  --seconds 40
```

```bash
npx @cecilialabs/ffmpeg compose concat ./clips \
  --transition fade
```

---

# Milestone 16 — MCP Server

**Target:** `v1.1.0`

### Objective

Expose the same core TypeScript functionality as agent tools without duplicating implementation.

Architecture:

```text
                    TypeScript Core
                          ▲
              ┌───────────┼───────────┐
              │           │           │
             CLI         MCP        Tests
              │           │
             npx      ChatGPT
                        Work
                        Codex
```

### Potential MCP tools

```text
media_probe
media_trim
media_convert
media_concat
media_attach_audio
media_remove_silence
media_generate_silence
media_restore
media_diagnose
```

### Rule

MCP implementations must call the same internal functions used by the CLI.

Never:

```text
CLI implementation A
MCP implementation B
```

Always:

```text
trimMedia()
   ├── CLI adapter
   └── MCP adapter
```

---

# Milestone 17 — Advanced Hardware Acceleration

**Target:** `v1.2.0`

### Targets

```text
NVIDIA NVENC/NVDEC
Intel Quick Sync
VAAPI
VideoToolbox
```

### Features

Automatic capability selection:

```text
requested codec
      ↓
hardware available?
      ↓
compatible encoder?
      ↓
hardware encode
      ↓ fallback
software encoder
```

Example:

```bash
npx @cecilialabs/ffmpeg convert input.mp4 \
  --to webm \
  --hardware auto
```

---

# Milestone 18 — Pipeline & Preset System

**Target:** `v1.3.0`

### Objective

Allow several transformations to run as one declarative job.

Example:

```yaml
input: source.mp4

steps:
  - trim:
      start: 4

  - speed:
      factor: 1.25

  - resize:
      width: 1920
      height: 1080

  - audio:
      normalize: true

output:
  path: final.mp4
  codec: h264
```

Execution:

```bash
npx @cecilialabs/ffmpeg run pipeline.yaml
```

This eventually enables deterministic agent-generated media workflows.

---

# Version Roadmap

| Version | Main capability |
|---|---|
| `0.1.x` | Core runtime, doctor and FFprobe |
| `0.2.0` | Video editing |
| `0.3.0` | Audio |
| `0.4.0` | Conversion and batch |
| `0.5.0` | Composition and transitions |
| `0.6.0` | Diagnostics and repair |
| `0.7.0` | Streaming |
| `0.8.0` | Professional Skills |
| `0.9.x` | Plugin, tests, UX and documentation |
| **`1.0.0`** | Stable CLI + Plugin |
| `1.1.0` | MCP |
| `1.2.0` | Hardware acceleration |
| `1.3.0` | Declarative pipelines |

---

# Definition of Done

A migrated operation is considered complete only when all of the following exist:

```text
typed domain function
        ↓
FFmpeg argument generation
        ↓
CLI adapter
        ↓
input validation
        ↓
structured errors
        ↓
--dry-run support
        ↓
--json support where applicable
        ↓
unit tests
        ↓
integration test
        ↓
FFprobe output validation
        ↓
Skill documentation/reference
        ↓
CLI documentation
```

This roadmap keeps **v1.0 focused on turning the existing FFmpeg knowledge into a robust reusable toolkit**, while MCP, hardware acceleration and declarative pipelines become additive layers rather than architectural rewrites.
