---
name: media-showroom
description: Develop and validate the browser-only Media Processing Studio, local File previews, timeline editing, waveform and privacy boundaries.
---
# Media Processing Studio

## When to use
Changes to `showcase/index.html`, `style.css`, `app.mjs`, browser input, playback, editing controls, accessibility or CSS.

## Implementation boundary
1. Media are imported via browser `File`, played through `URL.createObjectURL` and inspected with native metadata/Web Audio. **No media uploads, remote rendering, storage, tracking, telemetry or external file service.**
2. Support a sequential video timeline (up to eight clips) and one optional external soundtrack. Sequence playback seeks real local sources according to `showcase/sequence.mjs` and follows audio offset approximately; it is **not** a composited, frame-accurate final render. Use `sequenceDuration`, `locateSequenceTime`, and `soundtrackTimeAt` instead of duplicating coordinate calculations.
3. Trim seconds, source duration, offset, gain and clip order must round-trip into `generator.mjs`. Unsupported codecs may fail playback; the site must report that limitation without inventing results.
4. Free object URLs when clips are removed or the session is reset. Limit waveform decoding memory and release AudioContext resources.
5. Keep unique filenames required for shell-based operation and explain that absolute filesystem paths are unavailable to web pages.
6. Check keyboard focus, accessible file import, small-screen timeline, readable output, proper labels and clipboard fallbacks.

## Verification
Run `node --test showcase/tests/*.test.mjs`. Inspect the page with short video/audio fixtures in a local HTTP server; test trim, reorder, waveform, seek, output code and no network requests. Report browser tests not run. Do not change library runtime, npm packaging or production FFmpeg Skills to improve the showcase.
