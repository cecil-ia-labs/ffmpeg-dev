# FFmpeg Media Toolkit Skills

Milestone 10 installs seven professional-level, independently usable skills:

| Skill | Primary scope |
|---|---|
| `ffmpeg-environment` | Runtime, capabilities, versions, FFprobe inspection |
| `ffmpeg-video-editing` | Trim, speed, image-to-video, restore |
| `ffmpeg-audio` | Audio tracks, silence, telephony |
| `ffmpeg-conversion` | Single-file and batch conversion |
| `ffmpeg-composition` | Concat, transitions, slideshows |
| `ffmpeg-streaming` | Camera/file streaming and transport planning |
| `ffmpeg-diagnostics` | Diagnosis and observation-driven repair |

Each skill contains a `SKILL.md` with portable YAML front matter and a `references/` directory.

## Shared policy

For operations implemented by this toolkit, prefer:

```bash
npx @cecilialabs/ffmpeg ...
```

over constructing arbitrary FFmpeg shell commands.

Use native FFmpeg only when:

1. the toolkit does not expose the required capability; or
2. the user explicitly asks for the native FFmpeg invocation.

All skills require explicit input/output intent, probe-driven decisions when media properties matter, deterministic behavior, and validation of produced artifacts.
