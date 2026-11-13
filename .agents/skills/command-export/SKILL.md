---
name: command-export
description: Validate FFmpeg shell command generation and Cecil-IA Labs pipeline YAML against documented CLI and schema contracts.
---
# Generated commands and pipelines

## When to use
Changes to `showcase/generator.mjs`, presets, output format, quoting, clip calculations or exported shell/YAML.

## Sources of truth
Consult `docs/cli-reference.md`, `docs/pipelines.md`, `docs/video.md`, `docs/composition.md`, `specs/pipeline.schema.json` and actual toolkit source before expanding supported capabilities.

## Invariants
1. Only generate **supported** native FFmpeg operations or Pipeline v1 YAML; the v1 schema has ordered steps, not multitrack composition.
2. Multi-video native FFmpeg export normalizes frames and concatenates video; original audio is not implicitly preserved. Optional external soundtrack replaces audio. For single-source without external audio, map original audio when present.
3. Use shell escaping for Bash paths; refuse NUL/newline, path separators, duplicate input names and output collision. Do not interpolate untrusted raw values into filter strings.
4. Trim inputs must be finite and within known durations. Keep generated output a plan, not an executed artifact or codec-compatibility guarantee.
5. Avoid `--overwrite` or `-y` by default. FFmpeg execution on the user host must be explicit. Downloaded script should include a correct Bash shebang and safe working-directory instructions.
6. Tests cover ordinary names, spaces, apostrophes, invalid ranges, audio, multi-input concat, YAML compatibility and prevention of unsafe outputs.

## Checks
Run `node --test showcase/tests/*.test.mjs`. When changing YAML semantics, compare it to `specs/pipeline.schema.json` and validate with `cecilia-ffmpeg pipeline <file> validate` in a host with the built toolkit. Never report actual media rendering without an observed output.
