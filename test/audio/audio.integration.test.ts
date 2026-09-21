import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  addSilenceToVideo,
  attachAudio,
  detectSilence,
  generateSilence,
  removeSilence,
  transcodeTelephony,
} from "../../src/audio/index.js";
import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";

async function hasFFmpeg(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    await resolveBinary({ kind: "ffprobe" });
    return true;
  } catch {
    return false;
  }
}

async function createVideoFixture(directory: string): Promise<string> {
  const fixture = path.join(directory, "video source.mp4");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc=size=160x90:rate=20",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
    "-t", "1.4", "-c:v", "mpeg4", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-y", fixture,
  ]);
  return fixture;
}


async function createVideoOnlyFixture(directory: string): Promise<string> {
  const fixture = path.join(directory, "video only.mp4");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc=size=160x90:rate=20",
    "-t", "1.4", "-c:v", "mpeg4", "-pix_fmt", "yuv420p", "-an", "-y", fixture,
  ]);
  return fixture;
}

async function createReplacementAudio(directory: string): Promise<string> {
  const fixture = path.join(directory, "replacement audio.wav");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.45",
    "-c:a", "pcm_s16le", "-y", fixture,
  ]);
  return fixture;
}

async function createSpeechLikeFixture(directory: string): Promise<string> {
  const fixture = path.join(directory, "speech with silence.wav");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.30",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.60",
    "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=0.30",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.60",
    "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.30",
    "-filter_complex", "[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1[outa]",
    "-map", "[outa]", "-c:a", "pcm_s16le", "-y", fixture,
  ]);
  return fixture;
}

function outputDuration(report: { outputMedia?: { format: { durationSeconds?: number } } }): number {
  const value = report.outputMedia?.format.durationSeconds;
  if (value === undefined) throw new Error("Expected output duration");
  return value;
}

describe("Audio processing integration", () => {
  it("generates silence, replaces video audio, and adds a silence track", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m5-"));
    try {
      const silence = await generateSilence({
        duration: 0.4,
        sampleRate: 48000,
        channels: 2,
        output: path.join(directory, "generated silence.wav"),
      });
      expect(silence.outputMedia?.audio[0]).toMatchObject({ sampleRate: 48000, channels: 2 });
      expect(outputDuration(silence)).toBeGreaterThan(0.35);

      const video = await createVideoFixture(directory);
      const replacement = await createReplacementAudio(directory);
      const attached = await attachAudio(video, replacement, {
        output: path.join(directory, "audio replaced.mp4"),
        mode: "replace",
      });
      expect(attached.outputMedia?.video).toHaveLength(1);
      expect(attached.outputMedia?.audio).toHaveLength(1);
      expect(outputDuration(attached)).toBeGreaterThan(1.2);

      await expect(addSilenceToVideo(video, {
        output: path.join(directory, "must not replace existing audio.mp4"),
      })).rejects.toMatchObject({ code: "E_CONFIG_CONFLICT" });

      const videoOnly = await createVideoOnlyFixture(directory);
      const silentVideo = await addSilenceToVideo(videoOnly, {
        output: path.join(directory, "silent video.mp4"),
      });
      expect(silentVideo.outputMedia?.video).toHaveLength(1);
      expect(silentVideo.outputMedia?.audio).toHaveLength(1);
      expect(silentVideo.outputMedia?.audio[0]?.sampleRate).toBe(48000);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("detects and removes silence using structured intervals", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m5-"));
    try {
      const source = await createSpeechLikeFixture(directory);
      const detection = await detectSilence(source, { noiseDb: -30, minDuration: 0.5 });
      expect(detection.silences.length).toBeGreaterThanOrEqual(2);
      expect(detection.totalSilenceDuration).toBeGreaterThan(1.0);

      const cleaned = await removeSilence(source, {
        noiseDb: -30,
        minDuration: 0.5,
        keepSilence: 0.03,
        output: path.join(directory, "cleaned.wav"),
      });
      expect(outputDuration(cleaned)).toBeLessThan(1.4);
      expect(cleaned.outputMedia?.audio).toHaveLength(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("transcodes G.711 mu-law with explicit telephony semantics", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m5-"));
    try {
      const source = await createReplacementAudio(directory);
      const report = await transcodeTelephony(source, {
        codec: "mulaw",
        container: "wav",
        sampleRate: 8000,
        channels: 1,
        output: path.join(directory, "pcmu.wav"),
      });
      expect(report.outputMedia?.audio[0]).toMatchObject({
        codecName: "pcm_mulaw",
        sampleRate: 8000,
        channels: 1,
      });
      expect(report.details).toMatchObject({ codec: "mulaw", ffmpegCodec: "pcm_mulaw", container: "wav" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);
});
