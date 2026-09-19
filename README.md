# FFmpeg Media Toolkit

**Current milestone:** 14 — Documentation & Migration Guide  
**Version:** `0.9.9`

FFmpeg Media Toolkit is a professional, agent-friendly TypeScript CLI and plugin foundation for deterministic FFmpeg/FFprobe media workflows.

## Identity

- **Plugin:** `ffmpeg-media-toolkit`
- **npm package:** `@cecilialabs/ffmpeg`
- **CLI binary:** `cecilia-ffmpeg`
- **Language:** TypeScript
- **Runtime:** Node.js `>=22`
- **Media engine:** FFmpeg + FFprobe
- **Minimum supported FFmpeg:** `6.1`

## Milestone 14 status

Milestone 14 completes the public documentation layer for the pre-v1 CLI, adds a full 21-script Bash migration guide, synchronizes Skills with the canonical command taxonomy, and adds semantic emoji/icon UX for interactive human terminals while preserving clean JSON and non-TTY output.

Implemented now:

- `doctor`;
- `environment version`;
- `environment capabilities`;
- `probe <input>`;
- `video trim-start <input>`;
- `video trim-end <input>`;
- `video trim <input>`;
- `video speed <input>`;
- `video from-image <input>`;
- `video upscale <input>`;
- `video restore <input>` (compatibility alias);
- `video attach-audio <video> <audio>`;
- `video add-silence <video>`;
- `image convert <input>`;
- `image extract <input>`;
- `audio attach <video> <audio>` (compatibility alias);
- `audio silence`;
- `audio add-silence <video>` (compatibility alias);
- `audio detect-silence <input>`;
- `audio remove-silence <input>`;
- `audio telephony <input>`;
- `convert file <input>`;
- `convert batch <directory>`;
- `compose concat <inputs...>`;
- `compose transition <left> <right>`;
- `compose slideshow <directory>`;
- `diagnose <input>`;
- `repair timestamps <input>`;
- `repair normalize <input>`;
- `stream camera`;
- `stream file <input>`.

Video, audio, conversion, and composition operations now include:

- FFprobe preflight inspection;
- deterministic argument-array FFmpeg execution with `shell: false`;
- safe sibling temporary output;
- overwrite protection;
- final output FFprobe validation;
- stable human and JSON reports;
- paths containing spaces;
- MP4/MOV/MKV H.264 + AAC output profiles;
- WebM VP9 + Opus output profiles.

Streaming commands are implemented in Milestone 9 for HTTP, RTMP, RTSP, SRT, UDP, and TCP destinations. Direct WebSocket output remains an explicit relay concern rather than a mislabeled HTTP stream.


## Documentation

The public CLI is now documented without requiring source inspection:

- [Getting started](docs/getting-started.md)
- [Installation](docs/installation.md)
- [CLI reference](docs/cli-reference.md)
- [Video](docs/video.md)
- [Image](docs/image.md)
- [Audio](docs/audio.md)
- [Conversion](docs/conversion.md)
- [Composition](docs/composition.md)
- [Streaming](docs/streaming.md)
- [Diagnostics & repair](docs/diagnostics.md)
- [Batch processing](docs/batch-processing.md)
- [Hardware acceleration status](docs/hardware-acceleration.md)
- [Migration from Bash](docs/migration-from-bash.md)

Interactive human output now uses semantic icons in addition to the stronger color palette:

```text
🎬 clip.mp4 | ▶️ 67% | 🎞️ 2411 frames | ⚡ 100.0 fps | 🚀 3.70x | ⌛ ETA 00:00:12
```

`--no-color` disables ANSI color and friendly semantic icons. `--json` remains machine-only and non-TTY progress remains plain.

## Media capability expansion

The pre-v1 CLI now uses a shared visual-fit vocabulary:

```text
--fit contain   preserve the full source and pad
--fit cover     fill the frame and crop overflow
--fit stretch   force exact dimensions
```

`--background` controls padding for `contain`.

Expanded conversion formats:

```text
video: mp4, webm
image: gif, webp, png, jpeg/jpg
audio: wav, mp3, aac, m4a, flac, opus, ogg
```

Examples:

```bash
npx tsx src/cli.ts image convert ./photo.jpg --to webp --quality 85
npx tsx src/cli.ts image extract ./clip.mp4 --at 12.5 --to jpeg
npx tsx src/cli.ts convert file ./call.wav --to mp3 --audio-bitrate 128k
npx tsx src/cli.ts video upscale ./source.mp4 --resolution 1920x1080 --fit cover --to mp4
npx tsx src/cli.ts compose slideshow ./images --style sequence --transition zoomin --to webm
```

Composition now includes `zoomin` and an explicit custom `zoomout` transition. Slideshow supports vertical-stack and sequence styles, repeatable include/exclude patterns, transitions in sequence mode, and MP4/WebM/GIF/WebP outputs.

Human TTY output uses a brighter restrained palette while `--no-color`, `NO_COLOR`, `FORCE_COLOR`, JSON, and non-TTY safety remain intact.

See [Milestone 13.5 media capability expansion](docs/milestone-13-5/media-capability-expansion.md).

## UX, progress & agent output

Long-running CLI operations now use FFmpeg's machine-readable progress protocol:

```text
-progress pipe:1
-nostats
```

Human mode renders progress on stderr while keeping the final command result on stdout:

```text
🎬 clip.mp4 | ▶️ 67% | 🎞️ 2411 frames | ⚡ 100.0 fps | 🚀 3.70x | ⌛ ETA 00:00:12
```

Agent mode remains one JSON envelope on stdout:

```bash
npx @cecilialabs/ffmpeg video speed input.mp4 --factor 2 --json
```

The envelope can include structured per-run progress fields such as `percentage`, `frame`, `fps`, `speedMultiplier`, `etaSeconds`, and whether the total duration was estimated.

Use `--no-progress` to suppress live human progress without disabling structured collection. Human TTY output uses restrained colors; `--no-color` or `NO_COLOR` disables them, and JSON output is always ANSI-free.

See [Milestone 13 UX/progress architecture](docs/milestone-13/ux-progress-agent-output.md).

## Test suite & media fixtures

The regression system now has explicit coverage for:

```text
unit
integration
CLI
FFmpeg integration
fixture-based regression
```

Binary fixtures are generated locally from deterministic FFmpeg recipes:

```bash
npm run fixtures:generate
npm run verify:fixtures
npm run verify:test-suite
```

The generated directory `test/fixtures/generated/` is Git-ignored. `test/fixtures/manifest.json` is the source of truth for codec, stream, resolution, frame-rate, timebase, pixel-format, and audio expectations.

The fixture matrix covers H.264, H.265/HEVC, VP9, GIF, animated WebP, PNG, JPEG, MP3, AAC, PCM WAV, G.711 μ-law, CFR/VFR timing, missing streams, multiple timebases, resolutions, and pixel formats.

All 21 scripts under `legacy/bash/` are mapped to explicit cases in `test/regression/legacy-migrations.integration.test.ts`.

See [Milestone 12 test architecture](docs/milestone-12/test-suite-and-fixtures.md).

## Plugin package

`plugin.json` remains conformant with the closed Agent Plugins 1.0.0 manifest schema. Portable metadata uses the standard fields, while product-specific branding/documentation metadata lives under:

```text
extensions.com.cecilialabs.ffmpeg
```

Skills remain portable components discovered from the standard fixed `skills/` directory rather than a non-standard manifest field.

Branding assets:

```text
assets/
├── icon.svg
├── icon-dark.svg
├── logo.svg
└── screenshots/
    ├── cli-overview.svg
    └── skills-overview.svg
```

Packaging verification:

```bash
npm run verify:plugin
npm run build
npm run verify:package
```

`verify:package` executes `npm pack --dry-run --json --ignore-scripts` and confirms that runtime, skills, plugin metadata, docs, and assets are present while repository-only test/legacy/script paths are excluded.

See [Milestone 11 packaging architecture](docs/milestone-11/plugin-packaging.md).

## Professional skills

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

Each skill contains a portable `SKILL.md` plus a `references/` directory. The core execution policy is:

```text
supported operation → prefer @cecilialabs/ffmpeg
unsupported operation or explicit request → native FFmpeg fallback
```

Run the skill contract verifier with:

```bash
npm run verify:skills
```

See [Milestone 10 skill architecture](docs/milestone-10/professional-skills.md).

## Diagnostics & repair

```bash
npx tsx src/cli.ts diagnose ./broken.mp4
npx tsx src/cli.ts diagnose ./broken.mp4 --deep --json
npx tsx src/cli.ts repair timestamps ./broken.mp4 --mode reencode --fps 30 --output ./fixed.mp4
npx tsx src/cli.ts repair normalize ./source.mp4 --width 1920 --height 1080 --fps 30 --output ./normalized.mp4
```

Diagnostics combine FFprobe structure, a read-only FFmpeg decode scan, optional supplied stderr logs, and optional `freezedetect`. Repair outputs are staged transactionally, reprobed, and re-diagnosed.

## Streaming & capture

Camera to HTTP MPEG-TS:

```bash
npx tsx src/cli.ts stream camera \
  --device /dev/video0 \
  --input-format v4l2 \
  --framerate 15 \
  --video-size 320x240 \
  --transport http \
  --container mpegts \
  --video-codec mpeg1video \
  --video-bitrate 500k \
  --audio-codec none \
  --url http://localhost:8083/live
```

File to SRT:

```bash
npx tsx src/cli.ts stream file ./clip.mp4 \
  --transport srt \
  --url 'srt://receiver.example:9000?mode=caller'
```

The toolkit separates capture source, encoding, muxer/container, network transport, and destination. Supported direct transports are HTTP(S), RTMP(S), RTSP, SRT, UDP, and TCP. A `ws://`/`wss://` URL is rejected with guidance to use an explicit relay.

See [Milestone 9 streaming architecture](docs/milestone-9/streaming-and-capture.md).

## Codex local environment

For ChatGPT Desktop / Codex environment setup, worktrees, and recommended Actions, see [`docs/environment/chatgpt-local-environment.md`](docs/environment/chatgpt-local-environment.md). The package includes:

```bash
npm run codex:setup
npm run codex:cleanup
```

## Architecture

```text
User / Agent
    ↓
CLI action / package API
    ↓
video/*, audio/*, conversion/*, composition/*, or diagnostics/* domain service
    ↓
FFprobe preflight
    ↓
FFmpeg typed argument construction
    ↓
runFFmpeg() / runFFprobe()
    ↓
runCommand()
    ↓
node:child_process.spawn (shell: false)
    ↓
ffmpeg / ffprobe
```

Only `src/core/command-result.ts` may execute child processes.

## Install dependencies

```bash
npm install
```

## Development

```bash
npx tsx src/cli.ts --help
```

or:

```bash
npm run dev -- --help
```

## Environment inspection

```bash
npx tsx src/cli.ts doctor
npx tsx src/cli.ts environment version
npx tsx src/cli.ts environment capabilities
npx tsx src/cli.ts probe ./video.mp4
```

Add `--json` to receive the stable result envelope.

## Video editing

### Trim from the start

Accurate/deterministic default:

```bash
npx tsx src/cli.ts video trim-start ./clip.mp4 \
  --seconds 40 \
  --mode auto \
  --output ./clip.trimmed.mp4
```

Fast stream-copy mode:

```bash
npx tsx src/cli.ts video trim-start ./clip.mp4 \
  --seconds 40 \
  --mode copy
```

`copy` can be keyframe-dependent and emits a warning. `auto` resolves to `accurate` in v0.2.0.

### Remove time from the end

```bash
npx tsx src/cli.ts video trim-end ./clip.mp4 \
  --seconds 3.5 \
  --output ./clip.short.mp4
```

### Extract a range

```bash
npx tsx src/cli.ts video trim ./clip.mp4 \
  --start 12.5 \
  --end 30 \
  --output ./segment.mp4
```

or:

```bash
npx tsx src/cli.ts video trim ./clip.mp4 \
  --start 12.5 \
  --duration 17.5
```

### Change playback speed

Keep audio synchronized:

```bash
npx tsx src/cli.ts video speed ./clip.mp4 \
  --factor 2.5 \
  --audio sync
```

Drop audio intentionally:

```bash
npx tsx src/cli.ts video speed ./clip.mp4 \
  --factor 2.5 \
  --audio drop
```

Audio synchronization uses chained `atempo` filters when necessary.

### Create video from a still image

```bash
npx tsx src/cli.ts video from-image ./poster.png \
  --duration 5 \
  --resolution 1920x1080 \
  --fps 30 \
  --output ./poster.mp4
```

The input aspect ratio is preserved using scale + pad.

### Upscale / normalize / resize

Balanced profile:

```bash
npx tsx src/cli.ts video upscale ./source.mp4 \
  --resolution 1920x1080 \
  --profile balanced \
  --output ./restored.mp4
```

Aggressive profile:

```bash
npx tsx src/cli.ts video upscale ./source.mp4 \
  --resolution 1920x1080 \
  --profile aggressive \
  --crf 14 \
  --preset slow
```

The toolkit never treats `1280x720` as FHD or `720x404` as HD. Resolution semantics are explicit. `video restore` remains a compatibility alias for the canonical `video upscale` command.


## Audio processing

### Attach or replace audio on video

```bash
npx tsx src/cli.ts video attach-audio ./video.mp4 ./voice.wav \
  --mode replace \
  --output ./video.with-audio.mp4
```

The replacement audio is padded by default so a shorter track does not truncate the video. Use `--no-pad` to disable that behavior. `--mode append` keeps existing audio streams and adds the new track as an additional stream.

Video handling is explicit with `--video-mode auto|copy|encode`. `auto` stream-copies compatible video codecs and re-encodes only when the output container requires it.

### Generate silence

```bash
npx tsx src/cli.ts audio silence \
  --duration 1 \
  --sample-rate 48000 \
  --channels 2 \
  --output ./silence.wav
```

If no output is supplied, the default is `./silence.wav`. Common layouts are inferred for mono, stereo, 5.1, and 7.1; other channel counts require `--channel-layout`.

### Add a silent track to video

```bash
npx tsx src/cli.ts video add-silence ./video-without-audio.mp4 \
  --output ./video-with-silent-audio.mp4
```

The command refuses to destroy existing audio implicitly. Use `--replace-existing` only when replacing existing audio with silence is intentional.

### Detect silence

```bash
npx tsx src/cli.ts audio detect-silence ./speech.wav \
  --noise-db -30 \
  --min-duration 0.5 \
  --json
```

The package parses FFmpeg `silencedetect` diagnostics into typed intervals containing `start`, `end`, and `duration`.

### Remove silence

```bash
npx tsx src/cli.ts audio remove-silence ./speech.wav \
  --noise-db -30 \
  --min-duration 0.5 \
  --keep-silence 0.05 \
  --output ./speech.cleaned.wav
```

Milestone 5 deliberately limits this command to audio-only inputs. Removing elapsed time from audiovisual media requires synchronized timeline editing and is reserved for a future composition/timeline workflow.

### Telephony transcoding

G.711 μ-law, G.711 A-law, GSM, and PCM are represented as distinct profiles rather than conflated by filename.

```bash
npx tsx src/cli.ts audio telephony ./input.wav \
  --codec mulaw \
  --container wav \
  --sample-rate 8000 \
  --channels 1 \
  --output ./pcmu.wav
```

GSM is a separate codec/container path:

```bash
npx tsx src/cli.ts audio telephony ./input.wav \
  --codec gsm \
  --container gsm \
  --output ./voice.gsm
```

## Media conversion and batch processing

### Convert one file

```bash
npx tsx src/cli.ts convert file ./clip.mp4 --to webm
```

GIF conversion uses an inline FFmpeg palette pipeline:

```bash
npx tsx src/cli.ts convert file ./clip.mp4 \
  --to gif \
  --fps 12 \
  --width 720 \
  --max-colors 192
```

Animated WebP is generated directly by FFmpeg and does not require `webpmux`:

```bash
npx tsx src/cli.ts convert file ./clip.mp4 \
  --to webp \
  --fps 10 \
  --quality 82 \
  --loop 0
```

Supported conversion format vocabulary:

```text
video: mp4, webm
image: gif, webp, png, jpeg/jpg
audio: wav, mp3, aac, m4a, flac, opus, ogg
```

### Convert a folder

```bash
npx tsx src/cli.ts convert batch ./clips \
  --from mp4 \
  --to webm
```

Recursive filtered batch:

```bash
npx tsx src/cli.ts convert batch ./clips \
  --from mp4 \
  --to gif \
  --recursive \
  --include '**/episode-*.mp4' \
  --exclude '**/draft-*' \
  --parallelism 4 \
  --output-dir ./converted
```

The batch engine supports `error`, `skip`, and `replace` existing-output strategies, hierarchy preservation, flattened output with collision protection, fail-fast or continue-on-error scheduling, progress, summaries, and structured JSON reports.

## Dry-run

```bash
npx tsx src/cli.ts video trim-start ./clip.mp4 \
  --seconds 40 \
  --dry-run
```

For mutating media transforms, dry-run may perform read-only FFprobe inspection to build and validate the plan, but it does not execute the mutating FFmpeg transformation and does not create output files/directories.

## Package API

```ts
import {
  changeVideoSpeed,
  createVideoFromImage,
  probeMedia,
  restoreVideo,
  trimVideoEnd,
  trimVideoRange,
  trimVideoStart,
  attachAudio,
  detectSilence,
  transcodeTelephony,
  convertFile,
  convertBatch,
} from "@cecilialabs/ffmpeg";

const media = await probeMedia("./video.mp4");
const result = await trimVideoStart("./video.mp4", {
  seconds: 4,
  mode: "accurate",
});

const silences = await detectSilence("./speech.wav", { noiseDb: -30, minDuration: 0.5 });

console.log(media.media?.format.durationSeconds);
console.log(result.outputMedia?.format.durationSeconds);
const webm = await convertFile("./video.mp4", { to: "webm" });
const batch = await convertBatch("./clips", { from: "mp4", to: "webm", recursive: true });

console.log(silences.silences);
console.log(webm.output);
console.log(batch.succeeded);
```

## Output safety

The default behavior is never to overwrite a final output silently.

A file-producing operation stages FFmpeg output as:

```text
.<name>.cecilia-ffmpeg.<uuid>.tmp.<extension>
```

and promotes it to the requested final path only after successful execution and non-empty-file validation. The final file is then re-probed.

Use `--overwrite` explicitly when replacement is intended.

## Milestone 7 composition examples

```bash
npx @cecilialabs/ffmpeg compose concat a.mp4 b.mp4 \
  --transition fade --transition-duration 1 --output final.mp4

npx @cecilialabs/ffmpeg compose transition left.mp4 right.mp4 \
  --transition dissolve --duration 0.75 --output transition.mp4

npx @cecilialabs/ffmpeg compose slideshow ./images \
  --direction up --duration 10 --output slideshow.mp4
```

Composition normalizes geometry, constant frame rate, pixel format, timebase, and timestamps before `xfade`. Audio can be selected with `--audio auto|preserve|drop`.

## Full CLI grammar

```text
cecilia-ffmpeg
├── doctor
├── probe <input>
├── environment
│   ├── capabilities
│   ├── version
│   └── install                         # reserved
├── video
│   ├── trim-start <input>
│   ├── trim-end <input>
│   ├── trim <input>
│   ├── speed <input>
│   ├── from-image <input>
│   ├── upscale <input>                 # canonical
│   ├── restore <input>                 # compatibility alias
│   ├── attach-audio <video> <audio>
│   └── add-silence <video>
├── image
│   ├── convert <input>
│   └── extract <input>
├── audio
│   ├── attach <video> <audio>          # compatibility alias
│   ├── silence
│   ├── add-silence <video>             # compatibility alias
│   ├── detect-silence <input>
│   ├── remove-silence <input>
│   └── telephony <input>
├── convert
│   ├── file <input>
│   └── batch <directory>
├── compose
│   ├── concat <inputs...>
│   ├── transition <left> <right>
│   └── slideshow <directory>
├── diagnose <input>
├── repair
│   ├── timestamps <input>
│   └── normalize <input>
└── stream
    ├── camera
    └── file <input>
```

## Global flags

```text
--output <path>
--overwrite
--dry-run
--json
--quiet
--verbose
--no-progress
--no-color
--ffmpeg-path <path>
--ffprobe-path <path>
--keep-temp
```

## Quality commands

```bash
npm run verify:foundation
npm run verify:runtime
npm run verify:inspection
npm run verify:video
npm run verify:audio
npm run verify:conversion
npm run verify:composition
npm run verify:ux
npm run verify:media-expansion
npm run verify:docs
npm run check
npm run lint
npm test
npm run build
npm run validate
```

## Legacy Bash corpus

Original Bash utilities remain under `legacy/bash/` for provenance and regression context. Runtime code does not execute them.

Milestone migration mappings are documented in:

```text
docs/milestone-4/legacy-migration.md
docs/milestone-5/legacy-migration.md
docs/milestone-6/legacy-migration.md
docs/milestone-7/legacy-migration.md
```

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).
