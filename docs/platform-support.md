# Platform Support & Release Validation

Milestone 15 introduces explicit platform evidence for the stable v1 CLI.

## Support matrix

| Platform | Runtime | FFmpeg integration | Release gate |
|---|---|---|---|
| Linux | Node.js >=22 | FFmpeg/FFprobe >=6.1 | full `validate:release` |
| macOS | Node.js >=22 | FFmpeg/FFprobe >=6.1, AVFoundation capture | build + release contract + clean install + CLI/doctor smoke |
| Windows | Node.js >=22 | FFmpeg/FFprobe >=6.1, DirectShow capture | build + release contract + clean install + CLI/doctor smoke |

## Linux

Linux remains the primary full-validation platform. The release workflow runs the complete test, fixture, packaging, release-contract, and clean-install gates.

## macOS

The macOS release smoke validates:

- dependency installation;
- TypeScript build;
- stable release contract;
- clean npm tarball installation;
- package import;
- direct `cecilia-ffmpeg` executable;
- CLI help/version;
- `doctor --json` with FFmpeg and FFprobe installed.

Camera hardware is not available on hosted CI, so AVFoundation device capture is not exercised there.

## Windows

The Windows strategy uses native Node/npm behavior and the npm-generated `.cmd` executable shim. The smoke validates:

- dependency installation;
- TypeScript build;
- stable release contract;
- clean npm tarball installation;
- package import;
- `cecilia-ffmpeg.cmd` invocation;
- CLI help/version;
- `doctor --json` with FFmpeg and FFprobe installed.

DirectShow camera hardware is not available on hosted CI. Live device capture and external streaming receivers therefore remain environment-specific integration concerns rather than release-smoke requirements.

## GitHub Actions

`.github/workflows/v1-release-validation.yml` provides:

1. a full Linux release-validation job;
2. macOS and Windows smoke jobs;
3. manual `workflow_dispatch` support for release rehearsals.

A workflow definition is not itself validation evidence. Milestone 15 checkboxes should be marked complete only after successful runs are recorded.
