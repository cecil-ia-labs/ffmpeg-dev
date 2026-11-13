---
name: toolkit-maintenance
description: Preserve the FFmpeg Media Toolkit typed runtime, CLI, plugin distribution and established operational Skills while maintaining its public showcase.
---
# Toolkit integrity

Use when touching package source, plugin metadata, docs, release gates, `specs/` or packaged `skills/`.

- Start with `AGENTS.md`, `README.md`, `docs/agent-workflows.md`, `specs/command-tree.json` and `specs/pipeline.schema.json`.
- The package ships agent-execution Skills under `skills/`; the project-maintenance skills under `.agents/skills/` are distinct and should not be added to the npm package list.
- Preserve preflight checks, transactional file output, FFprobe result verification, FFmpeg capability gates, structured errors and `--dry-run` meaning.
- Preserve the v2 source/release boundary. A version declared in the repository must not be represented as available from npm until the registry proves it.
- Follow `codex/*` task branches, review via PR and existing validation conventions; do not release/npm publish automatically.
- Be aware that the existing v2 release workflow triggers a substantial Linux/macOS/Windows matrix on PRs/master pushes. Do not open PRs or merge as a side-effect of a showroom task without user authorization.
- Verify only relevant gates and report exactly what was run versus what remains untested.
