# Milestone 14 — Documentation & Migration Guide — Checklist

**Target:** `v0.9.9`  
**Status:** Implemented; local validation required before merge

## Documentation

- [x] Getting started.
- [x] Installation.
- [x] Complete CLI reference.
- [x] Video guide.
- [x] Image guide.
- [x] Audio guide.
- [x] Conversion guide.
- [x] Composition guide.
- [x] Streaming guide.
- [x] Diagnostics/repair guide.
- [x] Batch processing guide.
- [x] Hardware acceleration status/roadmap boundary.
- [x] Documentation index.

## Migration

- [x] All 21 legacy Bash scripts listed.
- [x] Canonical toolkit command documented for each legacy script.
- [x] Compatibility aliases documented where relevant.
- [x] GSM vs G.711 μ-law correction documented.
- [x] GIF→WebM correction documented.
- [x] Historical “WebSocket” HTTP MPEG-TS correction documented.
- [x] Canonical `video upscale` naming documented.

## Human UX

- [x] Semantic icon catalog.
- [x] Video/image/audio/conversion/composition/streaming/diagnostics/repair command icons.
- [x] Input/output/result/resolution/duration semantic icons.
- [x] Warning/error icons.
- [x] Progress icons for percentage, frames, FPS, speed, and ETA.
- [x] Stronger semantic progress colors.
- [x] TTY help descriptions receive domain icons.
- [x] `--no-color` suppresses ANSI styling and friendly semantic decoration.
- [x] JSON remains decoration-free.
- [x] Non-TTY progress remains plain.

## Skills

- [x] Video skill updated to canonical upscale/video-audio taxonomy.
- [x] Audio skill updated to canonical video audio-track commands.
- [x] Conversion skill updated for video/image/audio format support.
- [x] Composition skill updated for slideshow sequence and zoom transitions.

## Quality

- [x] Added semantic UX tests.
- [x] Extended `verify:ux`.
- [x] Added `verify:docs`.
- [x] `verify:docs` validates every public leaf command against CLI documentation.
- [x] `verify:docs` validates all 21 legacy migration mappings.
- [x] `verify:docs` prevents future hardware acceleration from being documented as current behavior.
- [x] Added `verify:docs` to `npm run validate`.
- [x] Package/plugin/project version advanced to `0.9.9`.
- [x] README, roadmap, changelog, and Skills updated.
- [x] GitHub Actions remain deferred until alpha completion.
- [ ] Run `npm run validate` in the configured Local Environment before merge.

## Acceptance criterion

A user can understand every public CLI command and migrate every historical Bash script without reading TypeScript source code, while human terminals receive richer semantic feedback without changing machine output contracts.
