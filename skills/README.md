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

The onboarding Skill ships executable JSON-in/JSON-out scripts for the
Milestone 20 environment flow:

```text
skills/ffmpeg-onboarding/scripts/check.mjs
skills/ffmpeg-onboarding/scripts/install.mjs
```

Both use the shared runner contract. `check.mjs` is read-only; `install.mjs`
requires explicit authorization before it runs npm and always reports the
post-install readiness check when an installation completes.

## Milestone 22 associated scripts

The behavioral Skills route user intent to the smallest operational Skill. The
environment and domain Skills expose one typed JSON-in/JSON-out entry point;
the scripts call the existing TypeScript domain functions directly and never
construct a shell command from user input.

| Skill | Script | Input action |
|---|---|---|
| `ffmpeg-environment` | `scripts/inspect.mjs` | `doctor`, `capabilities`, `version`, `probe` |
| `ffmpeg-video-editing` | `scripts/run.mjs` | `trim-start`, `trim-end`, `trim`, `speed`, `from-image`, `restore`, `upscale` |
| `ffmpeg-audio` | `scripts/run.mjs` | `attach`, `silence`, `add-silence`, `detect-silence`, `remove-silence`, `telephony` |
| `ffmpeg-conversion` | `scripts/run.mjs` | `file`, `batch` |
| `ffmpeg-composition` | `scripts/run.mjs` | `concat`, `transition`, `slideshow` |
| `ffmpeg-streaming` | `scripts/run.mjs` | `file`, `camera` |
| `ffmpeg-diagnostics` | `scripts/run.mjs` | `diagnose`, `repair-timestamps`, `repair-normalize` |
| `ffmpeg-pipelines` | `scripts/run.mjs` | `validate`, `print`, `run` |

The complete intent-to-Skill map and copy/paste request set lives in
[`docs/skill-request-examples.md`](../docs/skill-request-examples.md). Each script accepts one JSON
object on stdin and emits one result envelope. `chatgpt-regular` requests are
returned as plans; Codex, Work, and terminal execution remain subject to the
active host and explicit installation/write policy.

## Architecture transition

The v1.3 implementation still contains the local stdio MCP adapter documented
below. The next roadmap line moves agent-facing execution to portable
Skill-associated scripts over the typed CLI/domain runtime. That migration is
not part of this milestone, so current MCP documentation remains a
historical/current-baseline reference until the removal milestone lands.

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
