# FFmpeg Media Toolkit — Agent-First Scripts & Skills Roadmap

> **Project:** ffmpeg-media-toolkit
> **Package:** @cecilialabs/ffmpeg
> **Current baseline:** v1.3.0 on master
> **Next release line:** v2.0.0
> **Status:** Milestone 25 implemented on `codex/milestone-25-release-validation`; merge and publication remain pending

This roadmap replaces the previous MCP-centered evolution plan. It records the
post-v1.3 architectural decision and defines the work required to make the
toolkit agent-first through portable scripts, Skills, and the existing typed
CLI/domain runtime.

## 1. Architectural decision

The project will not pursue a local MCP server exposed through a public
HTTPS/mTLS reverse proxy.

The following are explicitly out of scope:

- opening a public domain or dynamic proxy for local media operations;
- managing a public network surface for every user;
- running an MCP gateway in Nginx/Caddy containers across NAT;
- maintaining MCP certificates, public endpoint routing, or MCP-specific
  network authorization;
- preserving MCP as a parallel execution surface merely for compatibility.

The target architecture is:

~~~
user request
    ↓
execution-context and environment check
    ↓
behavioral Skill
    ↓
domain Skill
    ↓
Skill-associated script
    ↓
cecilia-ffmpeg CLI / typed media domain
    ↓
preflight → execution → output verification → structured result
~~~

The typed media domains, FFmpeg/FFprobe runtime, CLI, package API, fixtures,
and deterministic output contracts remain the implementation foundation.
MCP is removed as an execution and documentation surface.

## 2. Baseline and migration boundary

The merged v1.3.0 baseline already contains:

- typed video, audio, conversion, composition, diagnostics, streaming,
  hardware, and pipeline domains;
- the cecilia-ffmpeg hierarchical CLI;
- output preflight and structured JSON envelopes;
- declarative YAML pipelines and reusable presets;
- eight professional Skills;
- package/plugin distribution and release verification;
- the historical Bash migration map and fixture-backed regression coverage.

The migration must retire these public surfaces:

~~~
cecilia-ffmpeg-mcp
@cecilialabs/ffmpeg/mcp
src/mcp.ts
src/mcp/**
media_* MCP tools
verify:mcp
MCP-specific tests, schemas, adapters, and documentation
top-level cecilia-ffmpeg run <pipeline>
~~~

The top-level run command is removed directly. It is not deprecated and will
not remain as an alias. Pipeline execution moves under the pipeline namespace.

## 3. Target execution contexts

Every Skill must distinguish the execution channel before promising work.

| Context | Can inspect files | Can execute scripts | Can install dependencies | Expected behavior |
| --- | ---: | ---: | ---: | --- |
| ChatGPT regular | No | No | No | Explain the limitation and provide a copy/paste guided flow |
| ChatGPT Work | Depends on attached environment | Yes when available | Only through explicit workflow | Inspect, execute, poll, and report real results |
| Codex | Yes | Yes | Yes within the authorized workspace | Execute the associated script and validate artifacts |
| IDE/terminal agent | Depends on host | Yes when available | Only with explicit authorization | Use the same scripts and contracts |
| Unknown/unsupported | Unknown | Unknown | No assumption | Ask for environment information before claiming execution |

The assistant must never say that media was processed when it only generated
commands or instructions.

## 4. Script architecture

Scripts become the agent-facing operational boundary that MCP previously
occupied.

### 4.1 Script locations

Portable scripts shipped with a Skill live beside that Skill:

~~~
skills/
├── ffmpeg-onboarding/
│   └── scripts/
├── ffmpeg-workflow/
│   └── scripts/
├── ffmpeg-environment/
│   └── scripts/
├── ffmpeg-pipelines/
│   └── scripts/
└── <domain-skill>/
    └── scripts/
~~~

Repository-only validation and packaging helpers remain under scripts/. They
are not runtime Skill actions and are not included in user instructions.

### 4.2 Script classes

Operational scripts perform deterministic work:

- inspect the environment and media;
- validate a request or pipeline;
- construct a typed CLI invocation;
- execute a supported media operation;
- monitor a long-running operation;
- verify the produced artifact;
- return a stable JSON result or structured error.

Behavioral scripts support agent routing and onboarding:

- identify the execution context;
- choose the correct Skill and domain action;
- decide whether the toolkit, installation flow, or native fallback applies;
- produce platform-specific installation instructions;
- turn a natural-language request into a validated pipeline;
- explain required input, output, overwrite, and recovery decisions.

Scripts must not:

- interpolate untrusted input into shell commands;
- silently modify shell startup files;
- claim success from process launch alone;
- bypass output preflight;
- invent unsupported FFmpeg capabilities;
- require an MCP server or public network endpoint.

### 4.3 Common script contract

All agent-facing scripts converge on one machine-readable contract:

~~~json
{
  "ok": true,
  "operation": "video.trim",
  "status": "completed",
  "context": "codex",
  "input": {},
  "output": {},
  "artifacts": [],
  "warnings": [],
  "next": []
}
~~~

Failures use the existing toolkit error taxonomy and include:

- stable error code;
- human-readable message;
- retryability;
- failed phase;
- safe recovery or next action;
- relevant paths without leaking credentials.

Long operations must have a resumable execution policy. Where the host
supports background processes, the script may return a job handle and provide
status/result polling. Where it does not, it must return a clear limitation
and a local command the user can run.

## 5. Environment, checking, and installation flow

### Phase A — Inspect

The environment flow must identify, without changing state:

- operating system and architecture;
- Node.js and npm versions;
- FFmpeg and FFprobe availability and versions;
- relevant codecs, encoders, decoders, filters, and hardware backends;
- whether cecilia-ffmpeg is available globally, locally, or through npm exec;
- whether the current host can execute scripts;
- whether the requested output path is writable.

### Phase B — Explain

The assistant presents the shortest valid route:

- execute directly when the current environment is ready;
- install the package when the environment can install;
- provide a guided local setup when the current Chat cannot execute;
- use native FFmpeg only for unsupported capabilities or an explicit request.

### Phase C — Install

The installation flow must support:

~~~
global npm installation
local project installation
npm exec without global installation
Codex/Work contributor setup
~~~

Installation is explicit, reversible, and observable. It must not silently
edit shell startup files, install system packages, or overwrite user files.

### Phase D — Verify

After installation, the same flow runs the environment check again and
reports what is actually ready. “Installed” is not equivalent to
“runtime-capable”; FFmpeg capability and a real probe remain authoritative.

## 6. Pipeline architecture and CLI grammar

The current top-level command:

~~~
cecilia-ffmpeg run pipeline.yaml
~~~

is removed.

The namespaced grammar becomes:

~~~
cecilia-ffmpeg pipeline pipeline.yaml run
~~~

The final action token is the pipeline stop sequence. The first supported
actions are:

~~~
cecilia-ffmpeg pipeline <file> validate
cecilia-ffmpeg pipeline <file> print
cecilia-ffmpeg pipeline <file> run
~~~

Inline pipelines converge on the same typed PipelineDefinition without
generating a temporary YAML file as an unnecessary intermediate:

~~~
cecilia-ffmpeg pipeline
  --step trim
    --input example.mp4
    --trim-start 2
    --output example.trim.mp4
  --step convert
    --input example.trim.mp4
    --to webm
    --output example.webm
  run
~~~

Pipeline work must preserve these invariants:

- validate the complete pipeline before starting a worker;
- preflight every planned output before the first media operation;
- protect the final commit with a second race-resistant preflight;
- resolve relative paths from the pipeline definition;
- prevent a pipeline from overwriting its own input;
- support dry-run, overwrite policy, temporary-workspace retention, and
  structured progress;
- verify final artifact properties with FFprobe;
- report per-step state and safe recovery.

## 7. Skill catalog transition

### 7.1 Existing domain Skills

The existing domain Skills remain, but their routing policy changes from
“prefer MCP” to “prefer the associated script or canonical CLI”:

~~~
ffmpeg-environment
ffmpeg-video-editing
ffmpeg-audio
ffmpeg-conversion
ffmpeg-composition
ffmpeg-streaming
ffmpeg-diagnostics
ffmpeg-pipelines
~~~

### 7.2 New behavioral Skills

Create the following behavioral Skills:

~~~
ffmpeg-onboarding
ffmpeg-workflow
~~~

ffmpeg-onboarding handles execution-context detection, dependency checks,
installation guidance, platform differences, and post-install verification.

ffmpeg-workflow handles natural-language request classification, domain Skill
selection, input/output questions, preflight ordering, execution mode,
long-run handling, artifact verification, and error recovery.

### 7.3 Reference-document contract

Every Skill reference must explain:

- what the action does;
- when to use it;
- when not to use it;
- examples of real user requests;
- required information and safe assumptions;
- canonical script/CLI grammar;
- dry-run and output-preflight behavior;
- expected result and artifact shape;
- validation and recovery;
- unsupported-capability handling.

Examples must be drawn from the existing README, roadmap, domain guides,
pipeline documentation, migration material, and validated specs. The goal is
to teach both the user and the assistant how to choose an action, not merely
to list implementation details.

## 8. Documentation and repository cleanup

### User-facing documentation

Consolidate the public flow around:

~~~
docs/getting-started.md
docs/installation.md
docs/cli-reference.md
docs/agent-workflows.md
docs/pipelines.md
docs/migration-from-bash.md
~~~

The README should provide orientation and link to these authoritative guides
instead of duplicating every domain detail.

### Agent-facing documentation

Skill references become the authoritative action-selection corpus. They may
link to deeper public docs, but must contain enough examples and routing rules
to operate without a prior conversation.

### Development records

Extract durable public behavior from development checklists and validation
transcripts, then archive or remove records that are only implementation
history and do not help a user or an agent. Do not leave duplicate,
contradictory MCP instructions in development documentation.

## 9. MCP removal workstream

This workstream starts only after the script contracts and replacement Skill
flows exist.

Remove or rewrite:

- MCP source, entrypoint, adapters, schemas, runtime, and package export;
- MCP npm binary, dependency, keyword, and package allowlist entries;
- plugin manifest and plugin schema MCP extensions;
- stable-release and command-surface MCP contracts;
- MCP verifiers, tests, fixtures, and validation wiring;
- MCP documentation, examples, Skills routing, and setup instructions;
- generated/build checks that expect dist/mcp*;
- public references to media_* tools.

Historical release notes are reviewed so they do not continue to describe MCP
as a supported current execution path.

## 10. Validation strategy

Replace MCP-specific gates with gates for the new architecture:

~~~
verify:foundation
verify:cli-surface
verify:skill-scripts
verify:agent-workflows
verify:environment-flow
verify:pipeline
verify:docs
verify:skills
verify:package
~~~

Required coverage:

- no top-level run command remains;
- pipeline <definition> <action> is registered and documented;
- file and inline pipeline parsing converge on the same type;
- every Skill has its declared scripts and references;
- every reference contains user-request examples;
- Chat/Work/Codex/IDE routing is deterministic;
- installation does not mutate shell state silently;
- scripts return the common result/error envelope;
- long-run status and recovery are explicit;
- package contents contain Skills, scripts, docs, and CLI runtime;
- package contents contain no MCP runtime or MCP-only metadata;
- no current documentation or test instructs an agent to call MCP.

Final validation, after implementation, will be proportional to the release
risk:

~~~
npm run verify:foundation
npm run check
npm run lint
npm run test
npm run verify:cli-surface
npm run verify:skill-scripts
npm run verify:agent-workflows
npm run verify:environment-flow
npm run verify:pipeline
npm run verify:docs
npm run verify:skills
npm run build
npm run verify:package
npm run validate:release
~~~

## 11. Milestones

### Milestone 19 — Agent-first architecture contract

**Status:** roadmap created; implementation not started

- freeze the MCP removal decision;
- define execution-context, script-request, result, and error contracts;
- define operational versus behavioral Skill boundaries;
- inventory current MCP and top-level run references;
- define background/resumable behavior for long operations;
- document security boundaries and explicit installation consent.

### Milestone 20 — Script runtime and environment flows

**Status:** implemented on `codex/milestone-20-script-runtime`

- create the shared Skill-script runner;
- implement environment detection and capability reporting;
- implement onboarding/install/check workflows;
- support regular Chat instructions and executable Work/Codex/IDE paths;
- test script invocation, cancellation, output envelopes, and safe paths.

### Milestone 21 — Namespaced pipeline CLI

**Status:** implemented on `codex/milestone-21-namespaced-pipeline-cli`

- move pipeline execution under pipeline;
- add file validate, print, and run actions;
- add inline pipeline parsing;
- remove top-level run;
- preserve preflight, dry-run, progress, and FFprobe verification;
- update pipeline Skill and examples.

### Milestone 22 — Behavioral and operational Skills

**Status:** implemented on `codex/milestone-22-behavioral-skills`

- add ffmpeg-onboarding;
- add ffmpeg-workflow;
- attach scripts to the environment, pipeline, and domain Skills;
- rewrite Skill routing and references around user requests;
- consolidate examples from current documentation and specs.

### Milestone 23 — MCP removal

**Status:** implemented on merged `master` from `codex/milestone-23-mcp-removal`

- remove MCP runtime and package surfaces;
- remove MCP tests, schemas, verifiers, docs, metadata, and validation gates;
- update package/plugin contracts and distribution checks;
- prove the CLI and scripts are the only supported agent execution path.

### Milestone 24 — Documentation and development-record cleanup

**Status:** implemented on `codex/milestone-24-documentation`

- publish the new onboarding and workflow guides;
- align README, CLI reference, pipeline guide, and migration guide;
- consolidate Skill references;
- archive/remove obsolete development records;
- verify there are no contradictory execution instructions.

### Milestone 25 — v2.0 release validation

**Status:** implemented on `codex/milestone-25-release-validation`; merge and
publication remain pending.

- run the full validation matrix;
- test clean install and package contents;
- run real environment and media smoke tests;
- verify the new CLI grammar and script flows;
- update release metadata and changelog;
- publish only after the migration and removal gates pass.

The release gate is `npm run validate:release`. It includes the repository
validation matrix, v2.0.0 identity checks, package inspection, clean tarball
installation, and `npm run smoke:release`. The smoke exercises a real FFmpeg /
FFprobe environment, a file-producing CLI operation, the namespaced pipeline
grammar, and the associated environment/video Skill scripts. Publication is
intentionally outside this implementation PR.

## 12. Definition of done

The architectural migration is complete when:

~~~
typed media domain
        ↓
canonical CLI
        ↓
Skill-associated operational script
        ↓
behavioral Skill routing
        ↓
context-aware execution or guided fallback
        ↓
preflight
        ↓
execution / background status
        ↓
artifact verification
        ↓
structured result and recovery
~~~

and all of the following are true:

- MCP is absent from the supported runtime, package, plugin, Skill, and test
  surfaces;
- the public top-level run command is absent;
- pipeline <definition> <action> is the documented pipeline grammar;
- regular Chat never claims execution it cannot perform;
- Work, Codex, and IDE flows use the same scripts and result contracts;
- installation and environment checks are explicit and repeatable;
- every supported user workflow has a Skill with concrete request examples;
- long operations have a clear completion, failure, and recovery path;
- output preflight and FFprobe verification remain mandatory;
- clean installation, package inspection, typecheck, lint, tests, build, and
  release gates pass.

Milestones 20 through 25 are implemented on their respective branches or
merged bases. The v2.0.0 npm publication and annotated tag remain pending the
milestone 25 merge and final registry verification.
