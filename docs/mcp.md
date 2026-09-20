# MCP Server

FFmpeg Media Toolkit v1.1.0 exposes its typed media operations as Model Context Protocol tools through a dedicated stdio server.

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

Without a global install:

```json
{
  "mcpServers": {
    "cecilia-ffmpeg": {
      "command": "npx",
      "args": [
        "-y",
        "--package=@cecilialabs/ffmpeg",
        "cecilia-ffmpeg-mcp"
      ]
    }
  }
}
```

The server uses stdio. Standard output is reserved for MCP protocol traffic; diagnostics from the server process go to standard error.

## Initial tool catalog

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

v1.1.0 ships a local stdio MCP server. A hosted Streamable HTTP deployment is intentionally outside this milestone because it requires explicit hosting, origin/host validation, authentication, and deployment policy rather than merely another media adapter.

## Included MCP Configuration
v1.1.0 ships a mcp.json config file.

```
.vscode/mcp.json
```
