---
name: ffmpeg-composition
description: Compose multiple media inputs with concatenation, xfade transitions, audio crossfades, normalization, and image slideshows. Use when two or more visual sources must become one timeline.
---

# FFmpeg Composition

Use this skill for multi-source video/image timeline construction.

## Activation scope

Use for:

- concatenating multiple clips;
- adding transitions between clips;
- composing two clips with a specific transition;
- image slideshows;
- workflows requiring normalization before `xfade`.

## Do not use

Do not use for single-file edits or repair. Do not choose non-standard filters such as `gltransition` unless environment capabilities confirm them and the toolkit path is insufficient.

## Required inputs

Identify:

- ordered inputs;
- transition type and duration;
- target dimensions/FPS;
- audio policy;
- slideshow duration/direction where relevant.

## Preflight

Probe every media input. Before transitions, normalize properties that FFmpeg requires to agree: scale/pad geometry, PTS, FPS, pixel format, and time base.

## Preferred toolkit commands

```bash
cecilia-ffmpeg compose concat <inputs...>
cecilia-ffmpeg compose concat <inputs...> --transition fade
cecilia-ffmpeg compose transition <left> <right>
cecilia-ffmpeg compose slideshow <directory>
```

For supported operations, prefer `npx @cecilialabs/ffmpeg ...` over constructing arbitrary FFmpeg shell commands.

## Native FFmpeg fallback

Use native FFmpeg only for unsupported composition graphs or user-requested native syntax. Retain the same normalization discipline before `xfade`.

## Output expectations

Return a single deterministic output with explicit warnings when audio cannot be preserved automatically.

## Validation

Probe the final file and verify:

- expected total duration;
- target dimensions/FPS/pixel format;
- audio presence;
- transition completion without filter reinitialization/timebase errors.

## Error recovery

- For timebase/FPS mismatch, normalize before transition instead of retrying the same graph.
- For missing audio on one input, use an explicit audio policy rather than constructing an invalid `acrossfade`.
- For unsupported transition filters, select a native `xfade` transition or inspect capabilities.

## Safety and determinism

Preserve input order. Do not use `eval` or shell-expanded filter graphs. Keep normalization explicit and repeatable.

## References

Read `references/composition-reference.md` for normalization order and transition guidance.
