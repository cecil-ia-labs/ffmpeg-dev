# MCP Server — Completion Checklist

**Target:** `v1.1.0`  
**Status:** ✅ Released to npm as v1.1.0 on 2026-09-20

## Architecture

- [x] Create MCP as a sibling adapter to the CLI.
- [x] Keep all FFmpeg/FFprobe execution in the existing core runtime.
- [x] Prevent MCP modules from importing CLI action adapters.
- [x] Propagate MCP cancellation through `AbortSignal`.
- [x] Use the official stable MCP TypeScript server SDK v2.
- [x] Use protocol-aware `serveStdio()`.

## Distribution

- [x] Add `cecilia-ffmpeg-mcp` npm binary.
- [x] Add `@cecilialabs/ffmpeg/mcp` package export.
- [x] Add MCP metadata to the plugin extension.
- [x] Advance package/plugin/source release line to `1.1.0`.
- [x] Regenerate `package-lock.json` with the MCP SDK dependency.
- [x] Confirm packed npm artifact contains MCP executable and declarations.

## Tools

- [x] `media_probe`
- [x] `media_trim`
- [x] `media_convert`
- [x] `media_concat`
- [x] `media_attach_audio`
- [x] `media_remove_silence`
- [x] `media_generate_silence`
- [x] `media_restore`
- [x] `media_diagnose`

## Agent behavior

- [x] Advertise Zod-derived MCP input schemas.
- [x] Return JSON text content plus structured content.
- [x] Preserve toolkit error codes/categories in tool errors.
- [x] Keep overwrite opt-in.
- [x] Preserve dry-run semantics.
- [x] Reserve stdout exclusively for MCP protocol traffic.

## Tests and verification

- [x] Add MCP schema/catalog unit tests.
- [x] Add FFmpeg-backed MCP adapter integration coverage.
- [x] Add `verify:mcp`.
- [x] Add MCP tests to test-suite structure verification.
- [x] Run `npm install` to update dependency lock.
- [x] Run `npm run validate`.
- [x] Run `npm run verify:mcp`.
- [x] Run MCP server through an MCP host/Inspector smoke test.

## Documentation

- [x] Public MCP installation/configuration guide.
- [x] MCP architecture document.
- [x] MCP tool catalog and safety semantics.
- [x] Document stdio-only v1.1 transport scope.


## Validation evidence

- `npm run validate:release` passed after the MCP TypeScript fixes.
- VS Code started the stdio server and reported `Discovered 9 tools`.
- A real `media_probe` call inspected a WebM/VP9 file successfully.
- A real `media_convert` call produced MP4 and was followed by MCP `media_probe` validation.
- `@cecilialabs/ffmpeg@1.1.0` was published successfully with both `cecilia-ffmpeg` and `cecilia-ffmpeg-mcp` binaries.
