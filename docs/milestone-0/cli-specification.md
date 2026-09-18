# CLI Specification

## 1. Executable

```bash
cecilia-ffmpeg
```

Primary distribution UX:

```bash
npx @cecilialabs/ffmpeg <command> [...args]
```

## 2. Command grammar

```text
cecilia-ffmpeg
├── doctor
├── probe <input>
│
├── environment
│   ├── capabilities
│   ├── version
│   └── install                 [reserved]
│
├── video
│   ├── trim-start <input>
│   ├── trim-end <input>
│   ├── trim <input>
│   ├── speed <input>
│   ├── from-image <input>
│   └── restore <input>
│
├── audio
│   ├── attach <video> <audio>
│   ├── silence
│   ├── add-silence <video>
│   ├── detect-silence <input>
│   ├── remove-silence <input>
│   └── telephony <input>
│
├── convert
│   ├── file <input>
│   └── batch <directory>
│
├── compose
│   ├── concat <inputs...>
│   ├── transition <left> <right>
│   └── slideshow <directory>
│
├── diagnose <input>
│
├── repair
│   ├── timestamps <input>
│   └── normalize <input>
│
└── stream
    ├── camera
    └── file <input>
```

`environment install` is reserved in Milestone 0 because system package mutation requires platform-specific policy and explicit confirmation. The environment Skill may provide installation instructions before executable installation automation is implemented.

## 3. Global options

| Option | Meaning |
|---|---|
| `--output <path>` | Explicit output path when the command produces one file |
| `--overwrite` | Allow replacement of an existing destination |
| `--dry-run` | Validate and render intended invocation without running FFmpeg |
| `--json` | Emit the stable JSON result envelope on stdout |
| `--quiet` | Suppress non-error human output |
| `--verbose` | Emit diagnostics and rendered invocation to stderr |
| `--ffmpeg-path <path>` | Override FFmpeg binary resolution |
| `--ffprobe-path <path>` | Override FFprobe binary resolution |
| `--keep-temp` | Preserve temporary/intermediate artifacts for debugging |

## 4. CLI conventions

- Commands and options use kebab-case.
- Inputs are positional when there is exactly one obvious primary input.
- Semantic values use explicit flags (`--seconds`, `--factor`, `--codec`, etc.).
- Time values accept seconds as decimal numbers initially; human duration syntax may be added later without changing the internal seconds representation.
- Output is explicit or deterministically derived.
- No command changes current working directory internally as a behavior requirement.
- Relative paths are resolved from the caller's current working directory.
- `--json` guarantees one JSON document on stdout.
- Diagnostic/progress text goes to stderr.

## 5. Examples

```bash
npx @cecilialabs/ffmpeg doctor
npx @cecilialabs/ffmpeg probe clip.mp4 --json

npx @cecilialabs/ffmpeg video trim-start clip.mp4   --seconds 40   --mode auto   --output trimmed.mp4

npx @cecilialabs/ffmpeg audio telephony input.wav   --codec mulaw   --sample-rate 8000   --channels 1   --output output.wav

npx @cecilialabs/ffmpeg convert batch ./clips   --from mp4   --to webm   --output-dir ./converted

npx @cecilialabs/ffmpeg compose concat ./clips/*.mp4   --transition fade   --transition-duration 1   --output final.mp4
```

## 6. Reserved global behavior

Future commands may add local flags but must not redefine the meaning of global flags. Commands that do not produce a file ignore `--output` rather than inventing a different meaning for it.
