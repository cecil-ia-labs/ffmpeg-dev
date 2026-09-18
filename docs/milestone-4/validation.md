# Milestone 4 Validation

Validation date: 2026-09-18

## Assembly environment

- Node.js: `v22.16.0`
- FFmpeg: `7.1.5-0+deb13u1`
- FFprobe: `7.1.5-0+deb13u1`
- Production source: strict TypeScript checked using the real Node typings plus temporary dependency interface shims because npm registry access timed out in the assembly environment. A second structural check covered all source and test TypeScript files.

## Real media validation

A temporary MP4 was generated with:

- 160×90 video;
- 20 fps;
- MPEG-4 source video;
- AAC audio at 48 kHz;
- ~1.6 second duration;
- a source filename containing a space.

All six Milestone 4 operations were executed through the new TypeScript domain API and their final artifacts were inspected again with the toolkit's normalized FFprobe API.

Observed results:

```json
[
  {"op":"trim-start","planned":false,"size":[160,90],"duration":1.222,"audio":1},
  {"op":"trim-end","planned":false,"size":[160,90],"duration":1.2,"audio":1},
  {"op":"trim","planned":false,"size":[160,90],"duration":0.722,"audio":1},
  {"op":"speed","planned":false,"size":[160,90],"duration":0.809,"audio":1},
  {"op":"from-image","planned":false,"size":[160,90],"duration":0.5,"audio":0},
  {"op":"restore","planned":false,"size":[320,180],"duration":1.6,"audio":1}
]
```

The still-image test used a generated PPM with a filename containing a space. Output paths in the integration validation also contained spaces.

A stream-copy dry-run also verified `W_TRIM_KEYFRAME_DEPENDENT` and confirmed that no output file was created.

## Scope of npm validation

`npm install` could not complete in the assembly environment because registry access timed out. The package intentionally does not include `node_modules`. On a normal development machine, the final acceptance sequence is:

```bash
npm install
npm run build
npm test
npm run validate
```

The included Vitest suite adds:

- argument/filter builder tests;
- CLI option registration tests;
- real FFmpeg integration tests for trim-start, trim-end, trim-range, speed, from-image and restore.
