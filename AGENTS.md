# Project instructions

## Scope

These instructions apply to the FFmpeg Media Toolkit repository:
@cecilialabs/ffmpeg, the cecilia-ffmpeg CLI, the plugin manifest, bundled
Skills, documentation, tests, and release tooling.

The repository root is the source of truth for project-specific conventions.
Keep changes narrow, preserve unrelated user work, and inspect the current
checkout before editing.

## Current architecture and migration boundary

- master is the canonical release branch for the current v1.3.0 baseline.
- The current implementation is script/Skills-first: execution context and
  environment checks, behavioral Skills, domain Skills, and Skill-associated
  scripts use the typed CLI/domain runtime.
- Milestone 23 removed the legacy alternate agent adapter and its package,
  plugin, documentation, and validation surfaces.
- The roadmap is not an authorization to implement migration work. Implement
  only the milestone requested by the user.

## Git and task workflow

Before changing files, inspect:

    git status --short --branch
    git branch -a -vv
    git remote -v

Preserve local changes and persistent identities. Never use reset --hard,
checkout to discard work, force-push, or delete branches without explicit
authorization and a verified target.

This setup task is explicitly authorized to commit and push its preparation
changes to master. After this task, every new implementation task must:

1. start from an up-to-date master;
2. create a new branch, using codex/<short-topic> by default;
3. make and validate the scoped change on that branch; and
4. open or update a pull request instead of pushing task work directly to
   master.

If the application shows origin/main, verify the repository with git fetch
--prune origin and git ls-remote --heads origin before taking any action. The
canonical remote branch is master unless the user explicitly changes it.

## Skills

Read the applicable SKILL.md before using a project Skill. The domain Skills
cover environment, video, audio, conversion, composition, streaming,
diagnostics, and pipelines. The behavioral Skills ffmpeg-onboarding and
ffmpeg-workflow route context detection and natural-language requests.

Project Skills live under skills/. New or substantially changed Skills must
follow the skill-creator instructions, keep their scope narrow, include
references only when needed, and pass the local Skill validator. Do not add
alternate agent-protocol dependencies to a Skill merely to make it discoverable.

## Validation

Use the narrowest meaningful checks for the change:

- documentation and Markdown: git diff --check;
- Skill structure: the skill-creator quick validator;
- Skill catalog and contract: npm run verify:skills;
- manifest: npm run verify:plugin;
- runtime or public behavior: the closest affected tests, typecheck, build,
  and release checks as risk requires.

Do not claim media execution, artifact creation, or runtime capability from a
documentation-only or planning-only check.

## Documentation and release notes

Update README.md when public setup, architecture, command selection, or Skill
discovery changes. Add a truthful entry to CHANGELOG.md for user-visible
preparation or release-facing changes. Keep historical release notes intact;
do not rewrite them to claim that future roadmap milestones are complete.

Commits should state the coherent scope of the change. Push only when the user
has explicitly authorized it, and report the exact branch, commit, and checks
afterward.


## Media Processing Studio — standalone browser showroom (2026-11)

The static SPA resides in `showcase/`. It is strictly a browser-based **local File preview and command authoring** experience, not the FFmpeg engine or a media-processing backend. Do not upload user media, add server storage or telemetry, or pretend source preview is the final composition. Generated FFmpeg commands/scripts and Toolkit Pipeline v1 YAML are plans to execute on the user's host and must be grounded in `docs/cli-reference.md` and `specs/pipeline.schema.json`.

Project-specific maintenance skills are in `.agents/skills/`:
- `media-showroom` for local file loading, accessibility, waveform, timeline, browser privacy and feedback.
- `command-export` for validated FFmpeg/Bash and toolkit YAML command generation.
- `toolkit-maintenance` for respecting the package/CLI/operational Skills boundaries.

The packaged operational agent Skills remain under `skills/` and must not be conflated with `.agents/skills/`. Run `node --test showcase/tests/*.test.mjs` for static SPA changes. Test with representative local audio/video fixtures before claiming runtime playback, codec support or rendered artifacts.

The new `.github/workflows/publish-showcase.yml` dispatches manually only. Never add a push-based Pages trigger, change the npm publication path, or merge/show PR automatically. This repository's existing v2 release workflow runs an extensive cross-platform validation matrix on pull requests and master pushes, so **request explicit maintainer authorization before starting a PR or merge** to control CI costs.
