---
name: ffmpeg-conversion
description: Convert individual media files or directory batches using typed FFmpeg profiles, deterministic output planning, filtering, concurrency, and structured reports. Use when the primary goal is format/container/image-animation conversion.
---

# FFmpeg Conversion

Use this skill for supported single-file and batch format conversions.

## Activation scope

Use for:

- MP4 → WebM;
- MP4 → GIF;
- MP4 → animated WebP;
- WebM → GIF;
- WebP → PNG;
- GIF → WebM;
- directory batch conversions with selection and output policies.

## Do not use

Do not use conversion as a substitute for composition, repair, or editing when format change is incidental. Use the corresponding domain skill first.

## Required inputs

Identify:

- source file or directory;
- source format for batch selection;
- target format;
- output directory/path;
- recursion, include/exclude patterns, concurrency, and existing-output policy when batching.

## Preflight

Probe source media when encoding decisions depend on audio/video presence. In batches, discover the selection before conversion and surface empty selections or output collisions explicitly.

## Preferred toolkit commands

```bash
cecilia-ffmpeg convert file <input> --to <format>
cecilia-ffmpeg convert batch <directory> --from <format> --to <format>
```

Prefer toolkit profiles over ad-hoc per-file shell loops.

## Native FFmpeg fallback

Use native FFmpeg only for unsupported format pairs or explicitly requested native syntax. Do not duplicate batch traversal logic in shell; keep selection/output planning deterministic.

## Output expectations

Batch reports should distinguish discovered, attempted, succeeded, failed, and skipped items. File output should be probed after conversion.

## Validation

Verify target codec/container/image format, stream presence, dimensions/FPS where relevant, and all requested batch items.

## Error recovery

- On partial batch failure, preserve successful outputs and report failed items.
- Resolve output collisions before execution.
- Use `existing=skip|replace|error` intentionally.
- If a target encoder is missing, inspect environment capabilities rather than silently switching formats.

## Safety and determinism

No implicit overwrite. No shared temporary wildcard files. Preserve directory hierarchy unless flattening was explicitly requested.

## References

Read `references/conversion-reference.md` for supported profiles and batch planning.
