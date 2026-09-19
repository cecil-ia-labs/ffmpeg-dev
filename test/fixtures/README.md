# Milestone 12 Media Fixtures

The binary fixture set is generated locally and intentionally not committed. This keeps the repository small while making every fixture reproducible from explicit FFmpeg recipes.

## Commands

```bash
npm run fixtures:generate
npm run verify:fixtures
npm run fixtures:clean
```

`verify:fixtures` regenerates the complete matrix and validates stream/media properties with FFprobe. It does not treat file existence as sufficient. Animated WebP additionally checks RIFF `ANIM`/`ANMF` chunks because FFprobe 7.1 can identify the codec while exposing incomplete animated-frame geometry.

Generated files live under:

```text
test/fixtures/generated/
```

and are ignored by Git.

## Matrix

The manifest at `test/fixtures/manifest.json` covers:

- MP4 H.264 + AAC;
- MP4 H.265/HEVC + AAC;
- WebM VP9 + Opus;
- GIF;
- animated WebP;
- PNG;
- JPEG;
- MP3;
- AAC;
- WAV PCM;
- G.711 μ-law;
- 24 fps and 30 fps CFR;
- VFR with non-uniform frame timestamps;
- video-only / missing audio;
- audio-only / missing video;
- 1/1000 and 1/90000 video timebases;
- 160×90 and 320×180 resolutions;
- yuv420p and yuv444p pixel formats;
- a speech-like audio fixture with silence intervals.

## Required encoders

The regression generator deliberately requires the CPU/reference encoders used by the matrix: `libx264`, `libx265`, `libvpx-vp9`, `libopus`, `libwebp`, `libmp3lame`, AAC, PCM, μ-law, GIF, PNG, and MJPEG.

If one is absent, fixture verification fails with the missing encoder name instead of silently substituting a different codec.
