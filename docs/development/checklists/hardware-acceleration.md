# Advanced Hardware Acceleration — Completion Checklist

**Target:** `v1.2.0`  
**Status:** 🚧 Implementation complete; local validation pending

## Core policy

- [x] Preserve software encoding as the default.
- [x] Add `software|auto|nvenc|qsv|vaapi|videotoolbox` policy.
- [x] Add backend/codec compatibility mapping.
- [x] Add platform-aware automatic preference order.
- [x] Add actual FFmpeg runtime usability probe.
- [x] Cache successful/failed runtime probes per process.
- [x] Add deterministic software fallback warning.
- [x] Add strict hardware-required mode.
- [x] Keep all FFmpeg execution behind the existing core runtime.

## Backends

- [x] H.264 NVENC.
- [x] H.264 Quick Sync.
- [x] H.264 VAAPI.
- [x] H.264 VideoToolbox.
- [x] VP9 Quick Sync.
- [x] VP9 VAAPI.
- [x] NVDEC/CUVID capability discovery.
- [x] Encoder and decoder lists in environment hardware metadata.
- [x] Document that automatic decoder insertion is not enabled in v1.2.

## Surfaces

- [x] TypeScript hardware API.
- [x] `convert file`.
- [x] `convert batch`.
- [x] `video from-image`.
- [x] `video upscale` / `video restore`.
- [x] MCP `media_convert`.
- [x] MCP `media_restore`.
- [x] Human reports expose requested/resolved encoder and fallback state.
- [x] Structured reports include hardware selection details.

## Documentation & Skills

- [x] Replace ambiguous public `npx @cecilialabs/ffmpeg` examples.
- [x] Make global `cecilia-ffmpeg` the canonical public example.
- [x] Document explicit `npm exec --package ... -- cecilia-ffmpeg` fallback.
- [x] Make all seven Skills MCP-aware.
- [x] Prefer matching MCP tool before CLI when connected.
- [x] Preserve global CLI and npm-exec fallbacks.
- [x] Do not invent MCP capabilities that are not exposed.
- [x] Document hardware policy in public CLI/MCP/video/conversion docs.

## Tests and release gates

- [x] Hardware selector unit tests.
- [x] FFmpeg-backed hardware planning integration tests.
- [x] Add `verify:hardware`.
- [x] Add hardware layers to test-suite verification.
- [x] Extend plugin metadata/schema.
- [x] Advance package/plugin/runtime/contract to `1.2.0`.
- [ ] Run `npm run check`.
- [ ] Run `npm run test`.
- [ ] Run `npm run validate`.
- [ ] Run `npm run validate:release`.
- [ ] Exercise `--hardware auto` on available local hardware.
