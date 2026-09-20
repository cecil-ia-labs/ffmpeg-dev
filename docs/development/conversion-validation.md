# Milestone 6 Validation

**Version:** `0.4.0`

## Validation performed in the assembly environment

- All Milestone 0–6 dependency-free verifier scripts passed.
- Production source passed strict TypeScript compilation with temporary interface-only shims for npm dependencies unavailable in the assembly environment.
- Test source passed the same strict TypeScript structural check.
- The temporary shims are not included in the distribution.
- Real FFmpeg/FFprobe smoke execution used FFmpeg `7.1.5`.

## Real conversion results

The actual Milestone 6 TypeScript implementation was compiled and exercised directly through its generated JavaScript domain modules.

Validated routes:

```text
MP4 -> WebM          video=vp9, audio=opus
MP4 -> GIF           video=gif
MP4 -> animated WebP video=webp
WebM -> GIF          video=gif
GIF  -> WebM         video=vp9
WebP -> PNG          video=png
```

A recursive batch with two MP4 inputs and `parallelism=2` completed with:

```text
discovered=2
attempted=2
succeeded=2
failed=0
skipped=0
```

A second run using `existing=skip` completed with:

```text
attempted=0
skipped=2
```

A `convertFile(..., { dryRun: true })` plan retained real FFprobe source metadata including the input audio stream while reporting `execution.executed=false`.

## npm limitation

`npm install` timed out because the assembly environment could not reach the npm registry. Therefore the real Vitest runtime was not executed here.

The project includes complete Vitest tests covering:

- conversion profile construction;
- glob semantics;
- batch discovery;
- CLI option exposure;
- all six real conversion routes;
- recursive hierarchy-preserving batch conversion;
- existing-output skip behavior.

In a normal development checkout, run:

```bash
npm install
npm run build
npm test
npm run validate
```
