# Getting Started

**Cecil-IA Labs · FFmpeg Media Toolkit**

FFmpeg Media Toolkit exposes deterministic FFmpeg/FFprobe workflows through a typed TypeScript package, the `cecilia-ffmpeg` CLI, and a local stdio MCP server.

## Requirements

- Node.js 22+
- FFmpeg 6.1+
- FFprobe available alongside FFmpeg

Recommended runtime:

- Node.js 24 LTS
- a recent FFmpeg build with the encoders/filters required by your workflow

## Choose how to run the CLI

Recommended global installation:

```bash
npm install -g @cecilialabs/ffmpeg
cecilia-ffmpeg doctor
```

Run without installing globally by naming the CLI binary explicitly:

```bash
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg doctor
```

The package has two executables since v1.1, so the shorthand the package-only `npx` shorthand is intentionally not used. All examples below assume the recommended global installation.

Development checkout:

```bash
npm install
npm run setup:cli
cecilia-ffmpeg doctor
```

`setup:cli` builds and links the local checkout. It only offers to update `~/.bashrc` when the npm global bin directory is not already in `PATH`, and it always asks before changing the shell configuration.

## First checks

```bash
cecilia-ffmpeg doctor
cecilia-ffmpeg environment version --json
cecilia-ffmpeg probe ./media/input.mp4 --json
```

## Agent access through MCP

A global installation also exposes `cecilia-ffmpeg-mcp`. Configure it as a stdio MCP server in a compatible host:

```json
{
  "mcpServers": {
    "cecilia-ffmpeg": {
      "command": "cecilia-ffmpeg-mcp"
    }
  }
}
```

The MCP tools are adapters over the same typed media functions used by the CLI; they do not shell out to the CLI.

Use `doctor` before codec/filter-sensitive work. Use `probe` before transforms where stream presence, duration, dimensions, FPS, or timestamps matter.

## First pipeline

Create `pipeline.yaml`:

```yaml
input: ./media/input.mp4
steps:
  - trim:
      start: 2
  - resize:
      width: 1280
      height: 720
output:
  path: ./media/output.mp4
  codec: h264
```

Plan it:

```bash
cecilia-ffmpeg run pipeline.yaml --dry-run
```

Execute it:

```bash
cecilia-ffmpeg run pipeline.yaml
```

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
- [MCP Server](mcp.md)
- [Declarative Pipelines & Presets](pipelines.md)
- [Video](video.md)
- [Image](image.md)
- [Audio](audio.md)
- [Conversion](conversion.md)
- [Composition](composition.md)
- [Streaming](streaming.md)
- [Diagnostics](diagnostics.md)
- [Batch Processing](batch-processing.md)
- [Migration from Bash](migration-from-bash.md)
