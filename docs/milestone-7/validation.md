# Milestone 7 validation

## Static validation

- `src/composition/*.ts` compiled under strict TypeScript with `exactOptionalPropertyTypes` enabled.
- The Milestone 6 `TuningInput` boundary was corrected to accept parser properties that may explicitly be `undefined` and to emit only defined `ConversionTuningOptions` properties.
- Lint defects reported after Milestone 6 were corrected or addressed through Node-specific ESLint globals for verifier scripts.

## Real FFmpeg smoke validation

Validated locally against FFmpeg 7.1.5 / FFprobe 7.1.5 with deliberately mismatched inputs:

- input A: 160×90 @ 24 fps + AAC;
- input B: 320×180 @ 30 fps + AAC.

Observed successful outputs:

```text
transition   duration≈2.779s  160×90  audio=1
concat fade  duration≈2.779s  160×90  audio=1
concat none  duration≈3.029s  160×90  audio=1
slideshow    duration=1.000s  320×180 audio=0
```

During validation, FFmpeg 7.1.5 exposed an ordering constraint: placing `setpts=PTS-STARTPTS` after `fps` caused `xfade` to report `current rate of 1/0 is invalid`. Moving `setpts` before `fps` preserved CFR metadata while retaining normalized timestamps.

## npm-dependent validation

The sandbox could not reach the npm registry, so the full project `npm run lint`, `npm test`, and package build were not executed with downloaded project dependencies here. The package includes the tests and verification script for execution in the development environment.
