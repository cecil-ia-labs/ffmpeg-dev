---
name: ffmpeg-audio
description: Attach, generate, detect, remove, and transcode audio with FFmpeg, including silence workflows and telephony formats such as G.711 μ-law, G.711 A-law, GSM, and PCM. Use when audio is the primary media concern.
---

# FFmpeg Audio

Use this skill for audio-first workflows, including audio tracks on video.

## Activation scope

Use for:

- attaching or replacing audio on video;
- generating silence;
- adding a silence track;
- detecting silence intervals;
- removing silence from audio-only media;
- telephony transcoding and codec/container clarification.

## Do not use

Do not use for video timing edits unless audio handling is secondary to the video operation. Do not use `remove-silence` on video when doing so would create A/V desynchronization; the toolkit intentionally restricts unsafe cases.

## Required inputs

Identify:

- input media;
- whether an existing audio track may be replaced;
- silence thresholds/durations when relevant;
- telephony codec, sample rate, channels, and container requirements.

## Preflight

Probe media when stream presence matters. Never assume a video lacks audio. For telephony, distinguish codec from container before building the command.

## Preferred toolkit commands

```bash
cecilia-ffmpeg audio attach <video> <audio>
cecilia-ffmpeg audio silence
cecilia-ffmpeg audio add-silence <video>
cecilia-ffmpeg audio detect-silence <input> --json
cecilia-ffmpeg audio remove-silence <input>
cecilia-ffmpeg audio telephony <input>
```

## Native FFmpeg fallback

Use native FFmpeg only when the toolkit lacks the required audio transform or the user explicitly asks for it. Keep channel layout, sample rate, sample format, codec, and container explicit.

## Output expectations

Silence detection should return typed intervals. File-producing operations should preserve non-audio streams according to the command contract and validate the result with FFprobe.

## Validation

Verify:

- audio codec;
- sample rate;
- channel count/layout;
- expected stream count;
- duration changes for silence removal;
- intended preservation/replacement behavior.

## Error recovery

- If existing audio would be destroyed, require explicit replacement intent.
- If a codec/container pairing is invalid, correct the container or codec rather than changing labels.
- If silence removal on video would desynchronize A/V, do not proceed with the audio-only workflow.
- If the user says “GSM μ-law”, clarify that GSM and G.711 μ-law are distinct codecs.

## Safety and determinism

Do not silently replace audio tracks. Do not conflate G.711 μ-law/PCMU, G.711 A-law/PCMA, GSM, and PCM.

## References

Read `references/audio-reference.md` for silence and telephony details.
