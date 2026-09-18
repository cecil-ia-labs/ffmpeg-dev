# Milestone 5 Validation

**Version:** `0.3.0`

## Static / TypeScript validation

- Milestone 5 core source was compiled under the repository's strict TypeScript policy.
- Full production source also passed `tsc -p tsconfig.build.json --noEmit` using local interface shims for unavailable npm dependencies in the assembly environment.
- Test source passed `tsc -p tsconfig.json --noEmit` using the same temporary interface-only shims.
- The temporary shims are not part of the distribution archive.

The assembly environment could not complete `npm install` because access to the npm registry timed out, so the real Vitest runner was not available there. The test suite files are included for execution in a normal development checkout.

## Real FFmpeg / FFprobe validation

Runtime smoke tests were executed with the installed FFmpeg and FFprobe binaries.

Validated behavior:

- finite PCM silence generation at 48 kHz stereo;
- video + replacement audio attachment with source-video duration preservation;
- adding a silent AAC track to video without source audio;
- `silencedetect` parsing over two known 0.6 s silence intervals;
- `silenceremove` reducing a 2.1 s fixture to approximately 0.989 s;
- G.711 μ-law output probed as `pcm_mulaw`, 8000 Hz, mono;
- GSM output probed separately as codec `gsm`, 8000 Hz, mono.

## Safety validation

- All mutating audio commands use the shared output transaction.
- No Milestone 5 implementation imports `child_process` directly.
- No `eval`, `exec`, or shell interpolation is used.
- Existing audio in `audio add-silence` is protected unless replacement is explicit.
- `audio remove-silence` rejects video-containing inputs to prevent A/V desynchronization.
