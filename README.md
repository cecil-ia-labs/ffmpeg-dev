# FFmpeg Media Toolkit

**Release status:** `1.3.0` — Released 2026-09-20 with declarative pipelines & presets

**Version:** `1.3.0`

**Cecil-IA Labs · FFmpeg Media Toolkit**

FFmpeg Media Toolkit is a professional, agent-friendly TypeScript CLI and plugin foundation for deterministic FFmpeg/FFprobe media workflows.

## Identity

- **Plugin:** `cecilialabs-ffmpeg`
- **npm package:** `@cecilialabs/ffmpeg`
- **CLI binary:** `cecilia-ffmpeg`
- **MCP binary:** `cecilia-ffmpeg-mcp`
- **Language:** TypeScript
- **Runtime:** Node.js `>=22`
- **Media engine:** FFmpeg + FFprobe
- **Minimum supported FFmpeg:** `6.1`

## Release status

v1.3.0 is published with declarative YAML pipelines, reusable presets, a public `run <pipeline>` CLI command, `media_run_pipeline` MCP execution, runtime-verified hardware acceleration, and a dedicated pipeline-authoring Skill.

Implemented now:

- `run <pipeline>`;
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

Streaming commands support HTTP, RTMP, RTSP, SRT, UDP, and TCP destinations. Direct WebSocket output remains an explicit relay concern rather than a mislabeled HTTP stream.


## Documentation

The public CLI is now documented without requiring source inspection:

- [Getting started](docs/getting-started.md)
- [Installation](docs/installation.md)
- [CLI reference](docs/cli-reference.md)
- [MCP server](docs/mcp.md)
- [Declarative pipelines & presets](docs/pipelines.md)
- [Video](docs/video.md)
- [Image](docs/image.md)
- [Audio](docs/audio.md)
- [Conversion](docs/conversion.md)
- [Composition](docs/composition.md)
- [Streaming](docs/streaming.md)
- [Diagnostics & repair](docs/diagnostics.md)
- [Batch processing](docs/batch-processing.md)
- [Hardware acceleration status](docs/hardware-acceleration.md)
- [Platform support & release validation](docs/platform-support.md)
- [Migration from Bash](docs/migration-from-bash.md)

Interactive human output now uses semantic icons in addition to the stronger color palette:

```text
🎬 clip.mp4 | ▶️ 67% | 🎞️ 2411 frames | ⚡ 100.0 fps | 🚀 3.70x | ⌛ ETA 00:00:12
```

`--no-color` disables ANSI color and friendly semantic icons. `--json` remains machine-only and non-TTY progress remains plain.

## MCP server

v1.1.0 adds a dedicated stdio MCP server without changing the stable CLI command grammar.

```bash
npm install -g @cecilialabs/ffmpeg
cecilia-ffmpeg-mcp
```

A host can launch it directly:

```json
{
  "mcpServers": {
    "cecilia-ffmpeg": {
      "command": "cecilia-ffmpeg-mcp"
    }
  }
}
```

The MCP tool catalog is:

```text
media_probe
media_trim
media_convert
media_concat
media_attach_audio
media_remove_silence
media_generate_silence
media_restore
media_run_pipeline
media_diagnose
```

The adapter path is deliberately:

```text
MCP tool -> src/mcp/adapters.ts -> existing typed domain function -> core FFmpeg/FFprobe runtime
```

It does not invoke CLI actions and does not create another child-process execution boundary. MCP cancellation is propagated into the same `AbortSignal` used by domain operations. Successful tool calls return both JSON text content and MCP structured content.

See [MCP server](docs/mcp.md) and [MCP architecture](docs/development/mcp-server.md).

## Declarative pipelines & presets

Milestone 18 introduces declarative YAML workflows that compose existing typed operations:

```bash
cecilia-ffmpeg run pipeline.yaml
```

A pipeline can chain trim, speed, resize, normalization, conversion, and reusable named presets. Multi-step execution uses isolated intermediate files, while `--dry-run` validates and expands the job without mutating media.

MCP-enabled agents can run the same document through `media_run_pipeline`.

See [Declarative pipelines & presets](docs/pipelines.md).

## Hardware acceleration

v1.2.0 adds a typed hardware encoder policy while preserving software encoding as the default:

```text
software | auto | nvenc | qsv | vaapi | videotoolbox
```

Example:

```bash
cecilia-ffmpeg convert file ./input.webm \
  --to mp4 \
  --hardware auto
```

The selector first checks FFmpeg-reported encoder capabilities, then performs a small runtime usability probe before committing to a hardware backend. If no compatible candidate works, it falls back to the software encoder and emits a structured warning. Use `--hardware-strict` when fallback is not acceptable.

Supported hardware-aware operations currently include:

- `convert file`;
- `convert batch`;
- `video from-image`;
- `video upscale` / `video restore`;
- MCP `media_convert`;
- MCP `media_restore`.

NVDEC/CUVID is surfaced in capability inspection, while automatic decode-path insertion remains conservative in v1.2 because filtered workflows require explicit hardware-frame upload/download negotiation.

See [Hardware acceleration](docs/hardware-acceleration.md).

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
cecilia-ffmpeg image convert ./photo.jpg --to webp --quality 85
cecilia-ffmpeg image extract ./clip.mp4 --at 12.5 --to jpeg
cecilia-ffmpeg convert file ./call.wav --to mp3 --audio-bitrate 128k
cecilia-ffmpeg video upscale ./source.mp4 --resolution 1920x1080 --fit cover --to mp4
cecilia-ffmpeg compose slideshow ./images --style sequence --transition zoomin --to webm
```

Composition now includes `zoomin` and an explicit custom `zoomout` transition. Slideshow supports vertical-stack and sequence styles, repeatable include/exclude patterns, transitions in sequence mode, and MP4/WebM/GIF/WebP outputs.

Human TTY output uses a brighter restrained palette while `--no-color`, `NO_COLOR`, `FORCE_COLOR`, JSON, and non-TTY safety remain intact.

See [media capability expansion notes](docs/development/media-capability-expansion.md).

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
cecilia-ffmpeg video speed input.mp4 --factor 2 --json
```

The envelope can include structured per-run progress fields such as `percentage`, `frame`, `fps`, `speedMultiplier`, `etaSeconds`, and whether the total duration was estimated.

Use `--no-progress` to suppress live human progress without disabling structured collection. Human TTY output uses restrained colors; `--no-color` or `NO_COLOR` disables them, and JSON output is always ANSI-free.

See [UX/progress architecture](docs/development/ux-progress-agent-output.md).

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

All 21 historical Bash script identifiers in `test/fixtures/legacy-migration-map.json` are mapped to explicit cases in `test/regression/legacy-migrations.integration.test.ts`.

See [test-suite and fixture architecture](docs/development/test-suite-and-fixtures.md).

## Plugin package

`plugin.json` remains conformant with the closed Agent Plugins 1.0.0 manifest schema. Portable metadata uses the standard fields. Cecil-IA Labs runtime/documentation metadata remains under `extensions.com.cecilialabs.ffmpeg`, while OpenAI directory presentation metadata is defined under `extensions.com.openai.interface`.

Skills remain portable components discovered from the standard fixed `skills/` directory rather than a non-standard manifest field. The public OpenAI v1.3.0 submission is branded **Cecil-IA Labs FFmpeg** and is intentionally Skills-only because the bundled MCP server is a local stdio server rather than a public HTTPS MCP endpoint.

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

See [plugin packaging architecture](docs/development/plugin-packaging.md) and [OpenAI plugin submission](docs/openai-plugin-submission.md).

## Professional skills

```text
skills/
├── ffmpeg-environment/
├── ffmpeg-video-editing/
├── ffmpeg-audio/
├── ffmpeg-conversion/
├── ffmpeg-composition/
├── ffmpeg-streaming/
├── ffmpeg-diagnostics/
└── ffmpeg-pipelines/
```

Each skill contains a portable `SKILL.md` plus a `references/` directory. The core execution policy is:

```text
matching connected MCP tool
        ↓ unavailable / not exposed
cecilia-ffmpeg
        ↓ unavailable
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg ...
        ↓ unsupported / explicit native request
native FFmpeg
```

Skills never invent MCP tools that are not part of the current server catalog.

Run the skill contract verifier with:

```bash
npm run verify:skills
```

See [professional Skills architecture](docs/development/professional-skills.md).

## Diagnostics & repair

```bash
cecilia-ffmpeg diagnose ./broken.mp4
cecilia-ffmpeg diagnose ./broken.mp4 --deep --json
cecilia-ffmpeg repair timestamps ./broken.mp4 --mode reencode --fps 30 --output ./fixed.mp4
cecilia-ffmpeg repair normalize ./source.mp4 --width 1920 --height 1080 --fps 30 --output ./normalized.mp4
```

Diagnostics combine FFprobe structure, a read-only FFmpeg decode scan, optional supplied stderr logs, and optional `freezedetect`. Repair outputs are staged transactionally, reprobed, and re-diagnosed.

## Streaming & capture

Camera to HTTP MPEG-TS:

```bash
cecilia-ffmpeg stream camera \
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
cecilia-ffmpeg stream file ./clip.mp4 \
  --transport srt \
  --url 'srt://receiver.example:9000?mode=caller'
```

The toolkit separates capture source, encoding, muxer/container, network transport, and destination. Supported direct transports are HTTP(S), RTMP(S), RTSP, SRT, UDP, and TCP. A `ws://`/`wss://` URL is rejected with guidance to use an explicit relay.

See [streaming architecture](docs/development/streaming-and-capture.md).

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
CLI / MCP / package API
    ↓
typed media-domain services
    ↓
optional hardware encoder policy
    ↓
FFprobe preflight + FFmpeg argument construction
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

## Install and run the CLI

Recommended public installation:

```bash
npm install -g @cecilialabs/ffmpeg
cecilia-ffmpeg --help
cecilia-ffmpeg doctor
```

The package also installs `cecilia-ffmpeg-mcp`. All public CLI examples below assume this global installation and use `cecilia-ffmpeg ...` directly.

Without a global install, name the intended executable explicitly:

```bash
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg doctor
```

No `postinstall` hook modifies the user's shell. npm exposes the commands through the package `bin` mapping.

For a development checkout:

```bash
npm install
npm run setup:cli
```

The setup asks permission before building/linking and only offers to modify `~/.bashrc` if the npm global bin directory is missing from `PATH`.

Manual equivalent:

```bash
npm run build
npm link
```

Remove the development link with:

```bash
npm run unlink:cli
```

Source-mode development remains available with:

```bash
npm run dev -- --help
```

See [Installation](docs/installation.md) for the complete global/local/release flow.

## Environment inspection

```bash
cecilia-ffmpeg doctor
cecilia-ffmpeg environment version
cecilia-ffmpeg environment capabilities
cecilia-ffmpeg probe ./video.mp4
```

Add `--json` to receive the stable result envelope.

## Video editing

### Trim from the start

Accurate/deterministic default:

```bash
cecilia-ffmpeg video trim-start ./clip.mp4 \
  --seconds 40 \
  --mode auto \
  --output ./clip.trimmed.mp4
```

Fast stream-copy mode:

```bash
cecilia-ffmpeg video trim-start ./clip.mp4 \
  --seconds 40 \
  --mode copy
```

`copy` can be keyframe-dependent and emits a warning. `auto` resolves to `accurate` in v0.2.0.

### Remove time from the end

```bash
cecilia-ffmpeg video trim-end ./clip.mp4 \
  --seconds 3.5 \
  --output ./clip.short.mp4
```

### Extract a range

```bash
cecilia-ffmpeg video trim ./clip.mp4 \
  --start 12.5 \
  --end 30 \
  --output ./segment.mp4
```

or:

```bash
cecilia-ffmpeg video trim ./clip.mp4 \
  --start 12.5 \
  --duration 17.5
```

### Change playback speed

Keep audio synchronized:

```bash
cecilia-ffmpeg video speed ./clip.mp4 \
  --factor 2.5 \
  --audio sync
```

Drop audio intentionally:

```bash
cecilia-ffmpeg video speed ./clip.mp4 \
  --factor 2.5 \
  --audio drop
```

Audio synchronization uses chained `atempo` filters when necessary.

### Create video from a still image

```bash
cecilia-ffmpeg video from-image ./poster.png \
  --duration 5 \
  --resolution 1920x1080 \
  --fps 30 \
  --output ./poster.mp4
```

The input aspect ratio is preserved using scale + pad.

### Upscale / normalize / resize

Balanced profile:

```bash
cecilia-ffmpeg video upscale ./source.mp4 \
  --resolution 1920x1080 \
  --profile balanced \
  --output ./restored.mp4
```

Aggressive profile:

```bash
cecilia-ffmpeg video upscale ./source.mp4 \
  --resolution 1920x1080 \
  --profile aggressive \
  --crf 14 \
  --preset slow
```

The toolkit never treats `1280x720` as FHD or `720x404` as HD. Resolution semantics are explicit. `video restore` remains a compatibility alias for the canonical `video upscale` command.


## Audio processing

### Attach or replace audio on video

```bash
cecilia-ffmpeg video attach-audio ./video.mp4 ./voice.wav \
  --mode replace \
  --output ./video.with-audio.mp4
```

The replacement audio is padded by default so a shorter track does not truncate the video. Use `--no-pad` to disable that behavior. `--mode append` keeps existing audio streams and adds the new track as an additional stream.

Video handling is explicit with `--video-mode auto|copy|encode`. `auto` stream-copies compatible video codecs and re-encodes only when the output container requires it.

### Generate silence

```bash
cecilia-ffmpeg audio silence \
  --duration 1 \
  --sample-rate 48000 \
  --channels 2 \
  --output ./silence.wav
```

If no output is supplied, the default is `./silence.wav`. Common layouts are inferred for mono, stereo, 5.1, and 7.1; other channel counts require `--channel-layout`.

### Add a silent track to video

```bash
cecilia-ffmpeg video add-silence ./video-without-audio.mp4 \
  --output ./video-with-silent-audio.mp4
```

The command refuses to destroy existing audio implicitly. Use `--replace-existing` only when replacing existing audio with silence is intentional.

### Detect silence

```bash
cecilia-ffmpeg audio detect-silence ./speech.wav \
  --noise-db -30 \
  --min-duration 0.5 \
  --json
```

The package parses FFmpeg `silencedetect` diagnostics into typed intervals containing `start`, `end`, and `duration`.

### Remove silence

```bash
cecilia-ffmpeg audio remove-silence ./speech.wav \
  --noise-db -30 \
  --min-duration 0.5 \
  --keep-silence 0.05 \
  --output ./speech.cleaned.wav
```

The current safety model deliberately limits this command to audio-only inputs. Removing elapsed time from audiovisual media requires synchronized timeline editing and is reserved for a future composition/timeline workflow.

### Telephony transcoding

G.711 μ-law, G.711 A-law, GSM, and PCM are represented as distinct profiles rather than conflated by filename.

```bash
cecilia-ffmpeg audio telephony ./input.wav \
  --codec mulaw \
  --container wav \
  --sample-rate 8000 \
  --channels 1 \
  --output ./pcmu.wav
```

GSM is a separate codec/container path:

```bash
cecilia-ffmpeg audio telephony ./input.wav \
  --codec gsm \
  --container gsm \
  --output ./voice.gsm
```

## Media conversion and batch processing

### Convert one file

```bash
cecilia-ffmpeg convert file ./clip.mp4 --to webm
```

GIF conversion uses an inline FFmpeg palette pipeline:

```bash
cecilia-ffmpeg convert file ./clip.mp4 \
  --to gif \
  --fps 12 \
  --width 720 \
  --max-colors 192
```

Animated WebP is generated directly by FFmpeg and does not require `webpmux`:

```bash
cecilia-ffmpeg convert file ./clip.mp4 \
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
cecilia-ffmpeg convert batch ./clips \
  --from mp4 \
  --to webm
```

Recursive filtered batch:

```bash
cecilia-ffmpeg convert batch ./clips \
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
cecilia-ffmpeg video trim-start ./clip.mp4 \
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

## Composition examples

```bash
cecilia-ffmpeg compose concat a.mp4 b.mp4 \
  --transition fade --transition-duration 1 --output final.mp4

cecilia-ffmpeg compose transition left.mp4 right.mp4 \
  --transition dissolve --duration 0.75 --output transition.mp4

cecilia-ffmpeg compose slideshow ./images \
  --direction up --duration 10 --output slideshow.mp4
```

Composition normalizes geometry, constant frame rate, pixel format, timebase, and timestamps before `xfade`. Audio can be selected with `--audio auto|preserve|drop`.

## Full CLI grammar

```text
cecilia-ffmpeg
├── run <pipeline>
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
docs/development/video-migration.md
docs/development/audio-migration.md
docs/development/conversion-migration.md
docs/development/composition-migration.md
```

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).
