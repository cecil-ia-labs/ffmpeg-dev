# Media Processing Studio — static FFmpeg editing and command showroom

A standalone browser-based demonstration for `@cecilialabs/ffmpeg`. Unlike a passive diagram, the page imports actual local `File` objects, uses object URLs for playback, offers time-range editing, audio waveform visualization when feasible, and generates commands without server calls.

## Scope and safeguards

- **No uploads or backend.** Sources stay local in the browser and are not transmitted. URLs are revoked when sources are removed or the project is cleared.
- **Preview is source-only.** The monitor plays the selected source; it does not render a precise multi-clip output, transitions, scale filters, audio mixing, or effects. Rendering requires a real local FFmpeg process.
- **Eight video clips** maximum, arranged sequentially, and one independent soundtrack. Set each clip's in/out seconds in the inspector.
- **Audio:** a supplied external soundtrack replaces source audio; volume and offset are supported. Native multivideo export without external soundtrack intentionally has no audio. Single-video export without a separate soundtrack preserves any existing source audio.
- **Waveform:** Web Audio API decoding is attempted only for audio files up to 24 MiB; other audio remains usable without a waveform.
- **Script output:** the browser cannot know the absolute source paths. Put files in a single working directory, review the shell script, and execute it from there. Paths are quoted for Bash and output names are validated; do not treat arbitrary downloaded scripts as trustworthy without review.
- **Toolkit YAML:** generated only for one video with no separate soundtrack, using actual Pipeline v1 steps. The multitrack composition mode requires a native FFmpeg command because the schema does not represent a multitrack timeline.
- **FFmpeg support:** a browser's ability to play a file does not prove a local FFmpeg build supports a given codec; run `ffmpeg -version` and `cecilia-ffmpeg doctor`.

## Local preview and verification

From the repository root:

```bash
python3 -m http.server --directory showcase 8000
```

Open `http://localhost:8000` and add local media. For static and generator regression tests:

```bash
node --test showcase/tests/*.test.mjs
```

No npm install or media processing is required for the showroom tests. The existing library and Skills remain in `src/`, `skills/` and `specs/`.

## Deployment and provenance

`.github/workflows/publish-showcase.yml` publishes the `showcase/` directory by **manual dispatch only**. No build artifacts or npm releases are created by the site workflow. The repository's existing v2 release validation matrix runs on pull requests and master pushes, so opening a PR may incur additional CI work.

Site URL: `https://cecil-ia-labs.github.io/ffmpeg-dev/`. Source: `https://github.com/cecil-ia-labs/ffmpeg-dev`. npm: `https://www.npmjs.com/package/@cecilialabs/ffmpeg`.
