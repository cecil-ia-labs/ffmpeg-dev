# MCP Server

FFmpeg Media Toolkit v1.2.0 exposes its typed media operations as Model Context Protocol tools through a dedicated stdio server.

## Install

Global installation:

```bash
npm install -g @cecilialabs/ffmpeg
```

The package exposes two binaries:

```text
cecilia-ffmpeg       # human/automation CLI
cecilia-ffmpeg-mcp   # MCP stdio server
```

For repository development:

```bash
npm install
npm run build
npm run mcp
```

## MCP host configuration

When the package is installed globally:

```json
{
  "mcpServers": {
    "cecilia-ffmpeg": {
      "command": "cecilia-ffmpeg-mcp"
    }
  }
}
```

Without a global install, invoke the intended package binary explicitly:

```json
{
  "mcpServers": {
    "cecilia-ffmpeg": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--package=@cecilialabs/ffmpeg",
        "--",
        "cecilia-ffmpeg-mcp"
      ]
    }
  }
}
```

Do not use the package-only `npx` shorthand as a shorthand: the package intentionally exposes both the CLI and MCP binaries.

The server uses stdio. Standard output is reserved for MCP protocol traffic; diagnostics from the server process go to standard error.

## Tool catalog

| MCP tool                 | Domain implementation | Purpose                                    |
| ------------------------ | --------------------- | ------------------------------------------ |
| `media_probe`            | `probeMedia()`        | FFprobe-backed normalized media inspection |
| `media_trim`             | `trimVideoRange()`    | deterministic video range trimming         |
| `media_convert`          | `convertFile()`       | single-file media conversion               |
| `media_concat`           | `concatMedia()`       | normalized multi-video concatenation       |
| `media_attach_audio`     | `attachAudio()`       | attach or replace a video's audio          |
| `media_remove_silence`   | `removeSilence()`     | silence removal for audio-only media       |
| `media_generate_silence` | `generateSilence()`   | silent audio generation                    |
| `media_restore`          | `upscaleVideo()`      | canonical restoration/upscale pipeline     |
| `media_run_pipeline`     | `executePipeline()`    | declarative YAML pipeline/preset execution  |
| `media_diagnose`         | `diagnoseMedia()`     | structural/decode/freeze diagnostics       |

The MCP layer does **not** invoke the CLI. It calls the same typed domain functions that the CLI adapters use.

## Shared transformation options

Transform tools use JSON-native snake-case options such as:

```json
{
  "output": "/absolute/path/output.mp4",
  "overwrite": false,
  "dry_run": false,
  "verbose": false,
  "ffmpeg_path": "/usr/bin/ffmpeg",
  "ffprobe_path": "/usr/bin/ffprobe",
  "cwd": "/workspace",
  "keep_temp": false
}
```

Not every tool uses every option. Input schemas advertised by MCP are the authoritative contract for each tool.

In v1.2, `media_convert` and `media_restore` also expose the hardware policy:

```json
{
  "hardware": "auto",
  "hardware_device": "/dev/dri/renderD128",
  "hardware_strict": false
}
```

Supported policy values are `software`, `auto`, `nvenc`, `qsv`, `vaapi`, and `videotoolbox`; actual codec/backend compatibility is validated by the toolkit.

## Declarative pipeline tool

`media_run_pipeline` executes the same v1 YAML document as:

```bash
cecilia-ffmpeg run pipeline.yaml
```

Example:

```json
{
  "pipeline": "/workspace/pipeline.yaml",
  "dry_run": true,
  "overwrite": false
}
```

The pipeline path may be relative to `cwd`. Relative media paths inside the document resolve from the pipeline file directory.

## Safety behavior

- Existing outputs are not overwritten unless `overwrite=true` is explicit.
- `dry_run=true` validates/plans supported transforms without executing the mutating FFmpeg operation.
- File paths refer to the filesystem visible to the MCP server process.
- Complex operations continue to use FFprobe preflight and transactional output handling.
- MCP cancellation propagates into the existing domain/runtime `AbortSignal`.
- No MCP module creates a second `child_process` execution boundary.

## Results

Successful tools return both:

- MCP text content containing JSON for broad client compatibility;
- `structuredContent` containing the same machine-readable report.

Domain errors are returned as tool errors with the toolkit's existing error code/category/retryability model.

## Transport scope

v1.2.0 continues to ship the local stdio MCP server introduced in v1.1. A hosted Streamable HTTP deployment is intentionally outside this milestone because it requires explicit hosting, origin/host validation, authentication, and deployment policy rather than merely another media adapter.

## Included MCP Configuration
The repository ships a VS Code workspace MCP configuration for local development:

```
.vscode/mcp.json
```
