# CLI Reference

## Global options

```text
--output <path>       explicit destination for single-file commands
--overwrite           allow replacing an existing destination
--dry-run             validate/render the intended invocation without executing FFmpeg
--json                emit the stable JSON result envelope on stdout
--quiet               suppress non-error human output
--verbose             emit diagnostic details to stderr
--no-progress         suppress live human progress
--no-color            disable ANSI color and friendly semantic decoration
--ffmpeg-path <path>  override FFmpeg binary resolution
--ffprobe-path <path> override FFprobe binary resolution
--keep-temp           preserve temporary/intermediate artifacts
```

## Inspection

### `doctor`

Inspect FFmpeg/FFprobe paths, versions, codecs, encoders, decoders, filters, protocols, and hardware-related capabilities.

### `probe <input>`

Normalize FFprobe metadata into typed media information.

### `environment capabilities`

Machine-readable environment capability inspection.

### `environment version`

Normalized FFmpeg/FFprobe version information.

`environment install` is reserved and not a package-management command.

## Video

```text
video trim-start <input> --seconds <n> [--mode auto|copy|accurate]
video trim-end <input> --seconds <n> [--mode auto|copy|accurate]
video trim <input> [--start <n>] [--end <n>|--duration <n>] [--mode ...]
video speed <input> --factor <n> [--audio sync|drop]
video from-image <input> [--duration 5] [--resolution WxH] [--fps 30]
video upscale <input> --resolution WxH [--profile balanced|aggressive]
video attach-audio <video> <audio> [--mode replace|append]
video add-silence <video> [--replace-existing]
```

`video restore` is retained as a compatibility alias for `video upscale`.

Visual geometry options where exposed:

```text
--fit contain|cover|stretch
--background <color>
--to mp4|webm
```

## Image

```text
image convert <input> --to png|jpeg|jpg|webp|gif
image extract <input> [--at <seconds>] [--to png|jpeg|jpg|webp]
```

Image commands support optional width/height, fit/background, and quality controls.

## Audio

```text
audio silence
audio detect-silence <input>
audio remove-silence <input>
audio telephony <input> --codec mulaw|alaw|gsm|pcm
```

Compatibility aliases remain:

```text
audio attach <video> <audio>
audio add-silence <video>
```

The canonical video-domain forms are `video attach-audio` and `video add-silence`.

## Conversion

```text
convert file <input> --to <format>
convert batch <directory> --from <format> --to <format>
```

Formats:

```text
video: mp4, webm
image: gif, webp, png, jpeg/jpg
audio: wav, mp3, aac, m4a, flac, opus, ogg
```

Tuning options include FPS, dimensions, fit/background, WebP quality, GIF palette/loop, audio bitrate, sample rate, and channels.

## Composition

```text
compose concat <inputs...>
compose transition <left> <right>
compose slideshow <directory>
```

Transitions:

```text
fade fadeblack fadewhite wipeleft wiperight slideup slidedown
circleopen circleclose dissolve pixelize distance zoomin zoomout
```

Concat/transition support normalization, fit/background, audio policy, and MP4/WebM output.

Slideshow supports `vertical-stack` and `sequence` styles; sequence mode can use transitions. Include/exclude patterns are repeatable. Outputs: MP4, WebM, GIF, WebP.

## Diagnostics & repair

```text
diagnose <input> [--deep] [--log <path>]
repair timestamps <input> [--mode remux|reencode] [--fps <fps>]
repair normalize <input> [--width ...] [--height ...] [--fps ...]
```

## Streaming

```text
stream camera --device <device> --url <url>
stream file <input> --url <url>
```

Direct transports: HTTP(S), RTMP(S), RTSP, SRT, UDP, TCP.

Direct WebSocket output is intentionally unsupported. Use an explicit relay when a browser/WebSocket consumer is required.

## Exit/output model

Human final results use stdout; progress/warnings/errors use stderr.

Agent mode:

```bash
cecilia-ffmpeg ... --json
```

emits one stable JSON result envelope on stdout.
