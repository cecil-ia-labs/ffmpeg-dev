# FFmpeg Media Toolkit Skills

The package installs ten Skills: two behavioral Skills for context and routing,
and eight domain Skills for concrete media operations. The public execution
flow is documented in [Agent workflows](../docs/agent-workflows.md); this page
is the catalog and the compact script map.

## Catalog

| Skill | Use it for | Associated entry point | Reference |
|---|---|---|---|
| [ffmpeg-onboarding](ffmpeg-onboarding/SKILL.md) | Context, readiness, and explicit installation | `scripts/check.mjs`, `scripts/install.mjs` | [execution contexts](ffmpeg-onboarding/references/execution-contexts.md) |
| [ffmpeg-workflow](ffmpeg-workflow/SKILL.md) | Natural-language routing and verified outcomes | routes to a domain script | [request routing](ffmpeg-workflow/references/request-routing.md) |
| [ffmpeg-environment](ffmpeg-environment/SKILL.md) | Versions, capabilities, and media inspection | `scripts/inspect.mjs` | [environment reference](ffmpeg-environment/references/environment-reference.md) |
| [ffmpeg-video-editing](ffmpeg-video-editing/SKILL.md) | Trim, speed, image-to-video, and resize | `scripts/run.mjs` | [video reference](ffmpeg-video-editing/references/video-editing-reference.md) |
| [ffmpeg-audio](ffmpeg-audio/SKILL.md) | Tracks, silence, and telephony | `scripts/run.mjs` | [audio reference](ffmpeg-audio/references/audio-reference.md) |
| [ffmpeg-conversion](ffmpeg-conversion/SKILL.md) | Single-file and batch conversion | `scripts/run.mjs` | [conversion reference](ffmpeg-conversion/references/conversion-reference.md) |
| [ffmpeg-composition](ffmpeg-composition/SKILL.md) | Concatenation, transitions, and slideshows | `scripts/run.mjs` | [composition reference](ffmpeg-composition/references/composition-reference.md) |
| [ffmpeg-streaming](ffmpeg-streaming/SKILL.md) | Camera capture and network delivery | `scripts/run.mjs` | [streaming reference](ffmpeg-streaming/references/streaming-reference.md) |
| [ffmpeg-diagnostics](ffmpeg-diagnostics/SKILL.md) | Diagnosis and observation-driven repair | `scripts/run.mjs` | [diagnostics reference](ffmpeg-diagnostics/references/diagnostics-reference.md) |
| [ffmpeg-pipelines](ffmpeg-pipelines/SKILL.md) | YAML pipelines and reusable presets | `scripts/run.mjs` | [pipeline schema](ffmpeg-pipelines/references/pipeline-schema.md) |

## Shared execution policy

For supported operations, use this order:

```text
Skill-associated script
        ↓ unavailable or unsupported action
global cecilia-ffmpeg binary
        ↓ unavailable
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg ...
        ↓ unsupported capability or explicit native request
native FFmpeg / FFprobe
```

All Skills require explicit input/output intent, probe-driven decisions when
media properties matter, deterministic behavior, and validation of produced
artifacts. A plan or dry-run must not be presented as a completed operation.

## Script contract

Operational scripts accept one JSON object on stdin and emit one result
envelope on stdout. The envelope carries `ok`, `status`, `warnings`, `error`,
`next`, and `artifacts` fields as applicable. `chatgpt-regular` requests return
plans because regular Chat has no assumed local filesystem or shell access.

From a built checkout:

```bash
npm run build
printf '%s\n' '{"context":"codex","input":{"action":"capabilities"}}' \
  | node skills/ffmpeg-environment/scripts/inspect.mjs
```

Domain action names and request examples are collected in
[Skill request examples](../docs/skill-request-examples.md). For pipeline
authoring and execution, use the namespaced CLI grammar:

```bash
cecilia-ffmpeg pipeline pipeline.yaml validate
cecilia-ffmpeg pipeline pipeline.yaml run --dry-run
```

The scripts call typed domain functions directly. They do not construct shell
commands from user input, and they return a planned result when the active
context cannot execute scripts.
