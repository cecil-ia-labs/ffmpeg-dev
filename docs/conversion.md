# Conversion

The generic conversion engine handles single files and directory batches across video, image, and audio formats.

## Supported format vocabulary

```text
video: mp4, webm
image: gif, webp, png, jpeg/jpg
audio: wav, mp3, aac, m4a, flac, opus, ogg
```

## Single file

```bash
cecilia-ffmpeg convert file input.webm --to mp4
cecilia-ffmpeg convert file photo.png --to jpeg
cecilia-ffmpeg convert file call.wav --to flac
```

Use `--from` only when explicit source-format selection is useful. The toolkit still probes media streams before encoding decisions.

## Visual tuning

```text
--fps
--width
--height
--fit contain|cover|stretch
--background
--quality
--max-colors
--loop
```

## Audio tuning

```text
--audio-bitrate
--sample-rate
--channels
```

Audio-only targets drop video with a structured warning rather than silently pretending video was preserved.

## Examples

WebM to MP4:

```bash
cecilia-ffmpeg convert file source.webm --to mp4
```

Video to animated WebP:

```bash
cecilia-ffmpeg convert file source.mp4   --to webp   --fps 12   --width 720   --quality 82
```

Call audio to MP3:

```bash
cecilia-ffmpeg convert file call.wav   --to mp3   --audio-bitrate 128k
```

## Output safety

Existing destinations are not overwritten unless the selected command/output policy explicitly allows it. File output is finalized transactionally and validated with FFprobe when applicable.
