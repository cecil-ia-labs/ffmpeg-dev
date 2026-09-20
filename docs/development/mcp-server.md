# MCP Server Architecture

Milestone 16 adds an MCP adapter beside the stable CLI. It does not fork media behavior.

## Architecture

```text
MCP client / agent
      |
      | stdio / MCP
      v
src/mcp/server.ts
      |
      v
src/mcp/adapters.ts
      |
      +-------------------------------+
      | existing typed domain APIs    |
      |                               |
      | probeMedia()                  |
      | trimVideoRange()              |
      | convertFile()                 |
      | concatMedia()                 |
      | attachAudio()                 |
      | removeSilence()               |
      | generateSilence()             |
      | upscaleVideo()                |
      | diagnoseMedia()               |
      +-------------------------------+
                      |
                      v
            runFFmpeg / runFFprobe
                      |
                      v
              runCommand/spawn
```

The invariant remains unchanged: production child-process execution is owned by the existing core runtime boundary. MCP code must never call FFmpeg, FFprobe, `spawn`, `exec`, or CLI action functions directly.

## SDK and protocol

The implementation uses the stable `@modelcontextprotocol/server` v2 package and `serveStdio()`. The release contract records protocol revision `2026-07-28`.

The stdio entrypoint is:

```text
src/mcp.ts -> dist/mcp.js -> cecilia-ffmpeg-mcp
```

The reusable programmatic entrypoint is:

```text
@cecilialabs/ffmpeg/mcp
```

## Layer responsibilities

### schemas.ts

Defines Zod v4 input contracts. MCP JSON uses snake-case names while adapters translate to the existing camel-case TypeScript domain requests.

### adapters.ts

Contains only argument translation and direct domain-function calls. It must not contain FFmpeg argument construction.

### runtime.ts

Maps the existing ToolkitRuntimeError model to MCP tool errors and emits JSON text plus structured content.

### server.ts

Creates `McpServer`, registers the nine initial tools, attaches annotations, and propagates `ctx.mcpReq.signal` to adapters.

### mcp.ts

Owns stdio serving only. It must never write logs to stdout.

## Tool scope

Milestone 16 intentionally exposes nine high-value operations from the roadmap. Batch conversion, live streaming, camera capture, image-specific operations, slideshow authoring, and repair mutations remain available through the TypeScript/CLI surfaces and can be added to MCP later without changing this architecture.

## Validation

```bash
npm run verify:mcp
npm test
npm run build
npm run validate
```

The verifier enforces the tool catalog, official SDK dependency, stdio transport, npm binary/export, plugin metadata, direct domain reuse, and absence of a new process-execution boundary.
