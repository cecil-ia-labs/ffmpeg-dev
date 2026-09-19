# Installation

## npm / npx

Run directly:

```bash
npx @cecilialabs/ffmpeg doctor
```

Or install in a project:

```bash
npm install @cecilialabs/ffmpeg
npx cecilia-ffmpeg doctor
```

## Runtime requirements

- Node.js: `>=22.0.0`
- minimum supported FFmpeg: `6.1`
- FFprobe is required for media inspection and output validation

Binary resolution follows the configured environment unless overridden:

```bash
cecilia-ffmpeg doctor   --ffmpeg-path /opt/ffmpeg/bin/ffmpeg   --ffprobe-path /opt/ffmpeg/bin/ffprobe
```

## Verify the environment

```bash
cecilia-ffmpeg doctor
cecilia-ffmpeg environment capabilities --json
```

A successful `doctor` confirms binary resolution and inspects available capabilities. Hardware backends reported by FFmpeg indicate compile/runtime visibility, not that every encoder/device is usable.

## Plugin distribution

The npm package also contains the Agent Plugin manifest, Skills, assets, specs, and documentation. The plugin is self-contained and does not depend on the repository's legacy shell scripts.

## Platform notes

Linux is the primary validation platform before v1. Camera capture uses V4L2 on Linux, AVFoundation on macOS, and DirectShow on Windows when selected.

Platform-specific binary installation is intentionally outside the toolkit's runtime responsibility.
