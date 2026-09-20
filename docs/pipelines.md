# Declarative Pipelines & Presets

Milestone 18 adds a declarative YAML job format that composes existing typed media operations without introducing a second FFmpeg execution engine.

## Run a pipeline

```bash
cecilia-ffmpeg run pipeline.yaml
```

The document is validated before execution. Relative `input`, `output.path`, and preset references are resolved from the pipeline file directory.

## Pipeline v1

```yaml
version: 1

input: source.mp4

steps:
  - trim:
      start: 4

  - speed:
      factor: 1.25
      audio: sync

  - resize:
      width: 1920
      height: 1080
      fit: contain
      hardware: auto

  - audio:
      normalize: true
      sampleRate: 48000
      channels: 2

output:
  path: final.mp4
  codec: h264
```

Supported executable steps:

| Step | Domain reused | Purpose |
| --- | --- | --- |
| `trim` | video trim | remove a prefix or extract a range |
| `speed` | video speed | change playback speed and optionally sync audio |
| `resize` | video upscale | resize/fit with profile and hardware options |
| `normalize` | repair normalize | normalize video/audio properties |
| `audio.normalize` | repair normalize | roadmap-compatible audio normalization form |
| `convert` | conversion | change output media format/container |

Every operation delegates to the existing typed domain function and therefore keeps the same FFprobe preflight, output transaction, structured errors, hardware policy, and output validation behavior.

## Trim semantics

Remove the first four seconds:

```yaml
- trim:
    start: 4
```

Extract an explicit range:

```yaml
- trim:
    start: 4
    end: 12
```

or:

```yaml
- trim:
    start: 4
    duration: 8
```

Optional mode:

```yaml
mode: auto # auto | copy | accurate
```

## Named presets

Presets are local reusable step groups:

```yaml
input: source.mp4

presets:
  social-1080:
    - resize:
        width: 1920
        height: 1080
        fit: contain
        hardware: auto

steps:
  - trim:
      start: 2

  - preset: social-1080

output:
  path: social.mp4
  codec: h264
```

Presets may reference other presets. Unknown references and recursive cycles are rejected before execution.

## Conversion step

```yaml
- convert:
    to: webm
    width: 1280
    height: 720
    audioBitrate: 128k
    hardware: auto
```

The same conversion formats exposed by `convert file` are accepted.

## Hardware-aware resize

```yaml
- resize:
    width: 1920
    height: 1080
    profile: balanced
    hardware: auto
    hardwareStrict: false
```

Hardware selection reuses the v1.2 runtime-probed selector.

## Output contract

```yaml
output:
  path: final.mp4
  codec: h264
```

`codec` is optional, but when provided it is a validation assertion:

- `h264` requires an H.264-compatible output extension;
- `vp9` requires WebM;
- the final `convert.to` or `resize.to` must agree with the output extension.

Contradictory declarations fail before the first media mutation. After execution, a declared `output.codec` is also checked against the codec reported by FFprobe for the actual final artifact; this protects codec assertions even when a step uses stream-copy semantics.

## Pipeline safety limits

To keep agent-generated jobs deterministic and bounded:

- preset nesting is limited to 32 levels;
- expanded executable pipelines are limited to 256 concrete steps;
- the final output path may not equal the original pipeline input path, even when overwrite is enabled;
- preset cycles and unknown references are rejected before execution.

These limits apply after named-preset expansion and are enforced by the typed pipeline engine.

## Intermediate artifacts

Actual multi-step runs use an isolated temporary workspace:

```text
input
  -> step-001-...
  -> step-002-...
  -> ...
  -> final output
```

Intermediate files are removed automatically after success or failure.

Use:

```bash
cecilia-ffmpeg run pipeline.yaml --keep-temp
```

to preserve the workspace for debugging. The structured report includes the workspace path when it is preserved.

## Dry-run

```bash
cecilia-ffmpeg run pipeline.yaml --dry-run
```

Pipeline dry-run validates:

- YAML syntax;
- schema;
- input readability;
- preset expansion;
- output/codec consistency;
- executable step order.

It does not execute FFmpeg and therefore does not require fictitious intermediate files to exist.

## Output override

The document output can be overridden from the CLI:

```bash
cecilia-ffmpeg run pipeline.yaml --output ./alternate.mp4
```

The override is still checked against the declared output codec/final target.

## JSON output

```bash
cecilia-ffmpeg run pipeline.yaml --json
```

The pipeline report includes:

- pipeline file;
- resolved source/final output;
- planned/executed state;
- expanded step count;
- per-step kind/input/output;
- per-step invocation and duration when executed;
- aggregated warnings;
- final FFprobe media information.

## MCP

MCP-enabled hosts can execute the same file with `media_run_pipeline`:

```json
{
  "pipeline": "/workspace/pipeline.yaml",
  "dry_run": false,
  "overwrite": false
}
```

The MCP adapter calls `loadPipelineFile()` and `executePipeline()` directly; it does not invoke the CLI.


## Machine-readable schema

The npm package includes the JSON Schema representation of pipeline v1:

```text
specs/pipeline.schema.json
```

Editors, agents, and external validators may use this schema for static authoring assistance. Runtime execution still validates the parsed YAML with the canonical Zod schema before expanding presets or touching media.
