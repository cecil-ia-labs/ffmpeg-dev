# Getting Started

FFmpeg Media Toolkit is a typed TypeScript CLI around deterministic FFmpeg/FFprobe workflows.

## Requirements

- Node.js 22+
- FFmpeg 6.1+
- FFprobe available alongside FFmpeg

Recommended runtime:

- Node.js 24 LTS
- a recent FFmpeg build with the encoders/filters required by your workflow

## Run without installing globally

```bash
npx @cecilialabs/ffmpeg doctor
```

Development checkout:

```bash
npm install
npm run cli -- doctor
```

## First checks

```bash
cecilia-ffmpeg doctor
cecilia-ffmpeg environment version --json
cecilia-ffmpeg probe ./media/input.mp4 --json
```

Use `doctor` before codec/filter-sensitive work. Use `probe` before transforms where stream presence, duration, dimensions, FPS, or timestamps matter.

## Human vs agent output

Human TTY output uses semantic color and icons:

```text
🎬 video upscale
📥 Input: ./clip.mp4
📦 Output: ./clip.upscale-1920x1080.mp4
📐 Resolution: 1920x1080
✅ Result: h264, 1920x1080
```

Progress can look like:

```text
🎬 clip.mp4 | ▶️ 67% | 🎞️ 2411 frames | ⚡ 100.0 fps | 🚀 3.70x | ⌛ ETA 00:00:12
```

`--json` always emits a machine-readable result envelope without ANSI decoration or human progress text.

`--no-color`, `NO_COLOR`, and `FORCE_COLOR` control human color output. Non-TTY progress remains plain.

## Safe defaults

- no shell interpolation;
- no implicit overwrite;
- transactional file output;
- `--dry-run` for plan inspection;
- FFprobe validation after file-producing operations;
- structured error codes;
- typed progress summaries.

## Next

- [Installation](installation.md)
- [CLI Reference](cli-reference.md)
- [Video](video.md)
- [Image](image.md)
- [Audio](audio.md)
- [Conversion](conversion.md)
- [Composition](composition.md)
- [Streaming](streaming.md)
- [Diagnostics](diagnostics.md)
- [Batch Processing](batch-processing.md)
- [Migration from Bash](migration-from-bash.md)
