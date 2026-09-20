# Hardware Acceleration

Hardware acceleration is **not yet an automatic encoding policy in v0.9.9**. Milestone 17 is reserved for typed NVENC/NVDEC, QSV, VAAPI, and VideoToolbox selection.

## What is available now

Environment inspection can report FFmpeg build capabilities:

```bash
cecilia-ffmpeg doctor
cecilia-ffmpeg environment capabilities --json
```

These results can show whether a backend/encoder/filter is visible to FFmpeg.

## Important distinction

A listed capability does not prove the hardware path is usable. Successful hardware processing may additionally depend on:

- installed drivers;
- device nodes and permissions;
- operating-system APIs;
- compatible input/output formats;
- codec/profile limits;
- container constraints.

## Current toolkit behavior

Current editing/conversion/composition profiles use deterministic software/reference encoders unless a command explicitly documents otherwise.

The toolkit does not silently switch to NVENC, VAAPI, QSV, or VideoToolbox.

## Future design

Milestone 17 is planned to select a hardware path only after capability checks:

```text
requested codec
  ↓
hardware backend available?
  ↓
compatible encoder?
  ↓
hardware encode
  ↓ fallback
software encode
```

Until then, use native FFmpeg explicitly for unsupported hardware-specific workflows and verify the resulting media with FFprobe.
