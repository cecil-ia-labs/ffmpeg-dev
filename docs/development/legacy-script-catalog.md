# Legacy Bash Script Catalog

This catalog records the 21 supplied scripts as migration inputs. The `.sh` files are preserved under `legacy/bash/` and are **not** the intended production implementation.

| # | Legacy script | Observed behavior | Target semantic command | Migration notes |
|---:|---|---|---|---|
| 1 | `add-audio-2-clip.sh` | Pads an audio input and muxes it with a video until the shortest stream ends | `audio attach <video> <audio>` | Make mapping explicit; expose pad/shortest policy |
| 2 | `add-silence-2-clip.sh` | Creates stereo 44.1 kHz silence and adds it to a video | `audio add-silence <video>` | Make layout/rate configurable; explicit mapping |
| 3 | `concat-all-mp4-in-folder-with-fade.sh` | Sorts MP4 files, probes durations, normalizes size/FPS/timebase/PTS, chains `xfade=fade` | `compose concat <inputs...> --transition fade` | Preserve normalization logic as typed reusable pipeline |
| 4 | `concat-clips.sh` | Applies `gltransition` between two WebM files | `compose transition <left> <right> --type gltransition` | `gltransition` may require non-standard FFmpeg capability |
| 5 | `convert-all-gif-in-folder-to-webm.sh` | Despite filename, regenerates optimized GIF via palettegen/paletteuse | `convert batch <dir> --from gif --to gif --profile optimized` | **Misnamed legacy script**; do not claim WebM output |
| 6 | `convert-all-mp4-in-folder-to-animated-webp.sh` | Converts MP4 frames to WebP, then combines via `webpmux` | `convert batch <dir> --from mp4 --to webp --animated` | Avoid shared wildcards; prefer native FFmpeg if robust; `webpmux` optional only |
| 7 | `convert-all-mp4-in-folder-to-gif.sh` | MP4 → GIF using generated palette at 10 fps | `convert batch <dir> --from mp4 --to gif` | Encapsulate palette workflow/profile |
| 8 | `convert-all-mp4-in-folder-to-webm.sh` | Basic MP4 → WebM conversion | `convert batch <dir> --from mp4 --to webm` | Choose documented codec/profile defaults rather than FFmpeg implicit defaults |
| 9 | `convert-all-webm-in-folder-to-gif.sh` | WebM → GIF using generated palette at 10 fps | `convert batch <dir> --from webm --to gif` | Reuse the same GIF conversion operation |
| 10 | `convert-all-webp-in-folder-to-png.sh` | Converts all WebP files in a hard-coded directory to PNG | `convert batch <dir> --from webp --to png` | Remove hard-coded path |
| 11 | `convert-audio-to-gsm-ulaw.sh` | Encodes `pcm_mulaw` at 8 kHz but writes `.gsm` | `audio telephony <input>` | **Semantic mismatch:** G.711 μ-law and GSM are distinct concepts |
| 12 | `create-clip-from-image.sh` | Loops SVG for 5 s, scales to 1920×1080, H.264/yuv420p | `video from-image <image>` | Duration/resolution/codec become options |
| 13 | `create-silence-audio.sh` | Generates 1 s `anullsrc`, 5.1 at 48 kHz, to MP3 | `audio silence` | Multichannel/container compatibility must be validated; defaults should be deliberate |
| 14 | `crop-x-seconds-from-start.sh` | Fast seek at 40 s with stream copy | `video trim-start <input>` | **Misnamed:** trim, not crop; expose `copy|accurate|auto` mode |
| 15 | `fix-freezes-and-blocks.sh` | Regenerates timestamps, forces CFR 30, async audio resampling, H.264/AAC | `repair timestamps <input>` / `repair normalize <input>` | Preserve as diagnosis-driven repair profile, not universal fix |
| 16 | `increase-video-speed.sh` | Batch video speed 2.5× by PTS change; drops audio | `video speed <input>` | Audio policy must be explicit (`drop|tempo|keep` where valid) |
| 17 | `remove-silence-noises.sh` | Detects silence, parses stderr with awk, creates segments, concatenates | `audio detect-silence` + `audio remove-silence` | Redesign around typed intervals; legacy container/copy chain is unsafe |
| 18 | `stack_vertical.sh` | Third-party slideshow with vertical stacked-image movement | `compose slideshow <dir> --transition vertical-stack` | Preserve MIT attribution; modernize deprecated/version-sensitive flags |
| 19 | `stream-to-websocket.sh` | V4L2 camera → MPEG-1 video in MPEG-TS sent to HTTP URL | `stream camera --container mpegts --transport http` | **Misnamed:** not direct WebSocket transport |
| 20 | `upscale-video-to-fhd.sh` | Heavy restoration chain targeting 1280×720 | `video restore <input> --resolution 1280x720 --profile aggressive` | **Misnamed:** 1280×720 is HD, not Full HD |
| 21 | `upscale-video-to-hd.sh` | Heavy restoration chain targeting 720×404 | `video restore <input> --resolution 720x404 --profile aggressive` | **Misnamed:** 720×404 is not canonical HD |

## Domain count

| Domain | Scripts |
|---|---:|
| Video editing/restoration | 5 |
| Audio/telephony | 5 |
| Conversion/batch | 6 |
| Composition | 3 |
| Diagnostics/repair | 1 |
| Streaming/capture | 1 |
| **Total** | **21** |

## High-value logic worth preserving

The strongest reusable logic in the corpus is the pre-normalization before `xfade` in `concat-all-mp4-in-folder-with-fade.sh`:

```text
scale → pad → fps → pixel format → settb → reset PTS → xfade
```

That logic should become a typed composition normalization profile rather than remain embedded in one command string.

## Licensing note

`stack_vertical.sh` carries a Taner Sener copyright notice and MIT license statement. If implementation code is ported rather than independently reimplemented from behavior, preserve the required MIT copyright/license notice.
