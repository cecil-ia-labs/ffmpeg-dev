# FFmpeg Media Toolkit Skills

The package installs ten Skills: eight domain Skills and two behavioral
orchestration Skills.

| Skill | Primary scope |
|---|---|
| ffmpeg-onboarding | Execution-context detection, readiness, and installation boundaries |
| ffmpeg-workflow | Natural-language request routing, preflight, and artifact validation |
| `ffmpeg-environment` | Runtime, capabilities, versions, FFprobe inspection |
| `ffmpeg-video-editing` | Trim, speed, image-to-video, restore |
| `ffmpeg-audio` | Audio tracks, silence, telephony |
| `ffmpeg-conversion` | Single-file and batch conversion |
| `ffmpeg-composition` | Concat, transitions, slideshows |
| `ffmpeg-streaming` | Camera/file streaming and transport planning |
| `ffmpeg-diagnostics` | Diagnosis and observation-driven repair |
| `ffmpeg-pipelines` | Declarative YAML pipelines, presets, and multi-step execution |

Each skill contains a `SKILL.md` with portable YAML front matter and a `references/` directory.

## Shared policy

For the current v1.3 domain operations implemented by this toolkit, use this
order:

```text
matching connected MCP tool
        ↓ unavailable / not exposed
global cecilia-ffmpeg binary
        ↓ unavailable
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg ...
        ↓ capability not implemented or explicit native request
native FFmpeg / FFprobe
```

The global installation is the recommended public setup:

```bash
npm install -g @cecilialabs/ffmpeg
```

After installation, examples should use the canonical binaries directly:

```bash
cecilia-ffmpeg ...
cecilia-ffmpeg-mcp
```

Do not use the ambiguous package-only `npx` shorthand: since v1.1 the npm package exposes both the CLI and MCP binaries, so a package runner must name the intended executable explicitly.

Use native FFmpeg only when:

1. the toolkit does not expose the required capability; or
2. the user explicitly asks for the native FFmpeg invocation.

All skills require explicit input/output intent, probe-driven decisions when media properties matter, deterministic behavior, and validation of produced artifacts.

The two behavioral Skills are script/CLI-first: they establish the execution
context, select a domain Skill, and require verified results. They do not
require a public MCP endpoint, dynamic proxy, containerized NAT, or a new
network MCP surface.

## Architecture transition

The v1.3 implementation still contains the local stdio MCP adapter documented
below. The next roadmap line moves agent-facing execution to portable
Skill-associated scripts over the typed CLI/domain runtime. That migration is
not part of this setup change, so current MCP documentation remains a
historical/current-baseline reference until the relevant milestone lands.

## MCP-enabled hosts

The MCP tools and CLI are sibling adapters over the same typed domain implementation. Skills should prefer a matching connected MCP tool when one exists, but must not invent MCP capabilities that are not in the current catalog.

Current MCP mappings relevant to the Skills include:

- environment/inspection: `media_probe`;
- video: `media_trim`, `media_restore`;
- audio: `media_attach_audio`, `media_generate_silence`, `media_remove_silence`;
- conversion: `media_convert`;
- composition: `media_concat`;
- diagnostics: `media_diagnose`, `media_probe`;
- streaming: no dedicated MCP streaming tool;
- pipelines: `media_run_pipeline`.

The current hardware policy, introduced in v1.2, is available through `media_convert`, `media_restore`, and the corresponding CLI operations where documented.
