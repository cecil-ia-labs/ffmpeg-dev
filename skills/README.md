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

For the current domain operations implemented by this toolkit, use this order:

```text
Skill-associated script
        ↓ unavailable or unsupported action
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
```

Use the explicit `npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg ...` form when the global CLI is unavailable.

Use native FFmpeg only when:

1. the toolkit does not expose the required capability; or
2. the user explicitly asks for the native FFmpeg invocation.

All skills require explicit input/output intent, probe-driven decisions when media properties matter, deterministic behavior, and validation of produced artifacts.

The two behavioral Skills are script/CLI-first: they establish the execution
context, select a domain Skill, and require verified results. They do not
require a network service or an alternate agent protocol.

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

## Agent execution boundary

Every Skill routes executable work through its associated JSON-in/JSON-out
script when available, then the canonical CLI or explicit npm-exec fallback.
Regular Chat receives a reproducible plan; Work, Codex, and terminal agents
execute only when the active host and write/install policy allow it.
