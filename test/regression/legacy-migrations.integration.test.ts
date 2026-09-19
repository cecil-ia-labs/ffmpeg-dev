import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  addSilenceToVideo,
  attachAudio,
  generateSilence,
  removeSilence,
  transcodeTelephony,
} from "../../src/audio/index.js";
import { concatMedia, createVerticalStackSlideshow, transitionMedia } from "../../src/composition/index.js";
import { convertBatch } from "../../src/conversion/index.js";
import { normalizeMedia } from "../../src/diagnostics/index.js";
import { streamCamera } from "../../src/streaming/index.js";
import {
  changeVideoSpeed,
  createVideoFromImage,
  restoreVideo,
  trimVideoStart,
} from "../../src/video/index.js";
import { ensureFixtureMatrix, fixturePath } from "../helpers/fixture-matrix.js";

let available = false;
let workspace = "";

beforeAll(async () => {
  available = await ensureFixtureMatrix();
}, 120_000);

beforeEach(async () => {
  if (!available) return;
  workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-m12-legacy-"));
});

afterEach(async () => {
  if (workspace) await rm(workspace, { recursive: true, force: true });
  workspace = "";
});

async function copyFixture(id: string, name: string): Promise<string> {
  const destination = path.join(workspace, name);
  await copyFile(await fixturePath(id), destination);
  return destination;
}

async function runBatch(id: string, filename: string, from: "mp4" | "webm" | "gif" | "webp", to: "webm" | "gif" | "webp" | "png") {
  const input = path.join(workspace, "batch-input");
  const output = path.join(workspace, "batch-output");
  await mkdir(input, { recursive: true });
  await copyFile(await fixturePath(id), path.join(input, filename));
  return await convertBatch(input, {
    from,
    to,
    outputDirectory: output,
    recursive: false,
    parallelism: 1,
  });
}

function firstOutputCodec(report: Awaited<ReturnType<typeof convertBatch>>): string | undefined {
  return report.items[0]?.data?.outputMedia?.video[0]?.codecName;
}

describe("Milestone 12 legacy Bash migration regression", () => {
  it("legacy/bash/add-audio-2-clip.sh → audio attach", async () => {
    if (!available) return;
    const video = await copyFixture("video-only", "video.mp4");
    const audio = await fixturePath("wav-pcm");
    const report = await attachAudio(video, audio, { output: path.join(workspace, "attached.mp4") });
    expect(report.outputMedia?.video).toHaveLength(1);
    expect(report.outputMedia?.audio).toHaveLength(1);
  }, 60_000);

  it("legacy/bash/add-silence-2-clip.sh → audio add-silence", async () => {
    if (!available) return;
    const video = await copyFixture("video-only", "video.mp4");
    const report = await addSilenceToVideo(video, { output: path.join(workspace, "silent.mp4") });
    expect(report.outputMedia?.audio[0]).toMatchObject({ sampleRate: 48000, channels: 2 });
  }, 60_000);

  it("legacy/bash/concat-all-mp4-in-folder-with-fade.sh → compose concat transition", async () => {
    if (!available) return;
    const left = await copyFixture("mp4-h264-aac", "left.mp4");
    const right = await copyFixture("mp4-h264-aac", "right.mp4");
    const report = await concatMedia([left, right], {
      output: path.join(workspace, "concat.mp4"),
      transition: "fade",
      transitionDuration: 0.1,
      fps: 24,
    });
    expect(report.outputMedia?.video[0]?.codecName).toBe("h264");
  }, 90_000);

  it("legacy/bash/concat-clips.sh → compose transition", async () => {
    if (!available) return;
    const left = await copyFixture("mp4-h264-aac", "left.mp4");
    const right = await copyFixture("mp4-h264-aac", "right.mp4");
    const report = await transitionMedia(left, right, {
      output: path.join(workspace, "transition.mp4"),
      transition: "dissolve",
      duration: 0.1,
      fps: 24,
    });
    expect(report.outputMedia?.video).toHaveLength(1);
  }, 90_000);

  it("legacy/bash/convert-all-gif-in-folder-to-webm.sh → real GIF to WebM batch", async () => {
    if (!available) return;
    const report = await runBatch("gif", "source.gif", "gif", "webm");
    expect(report).toMatchObject({ succeeded: 1, failed: 0 });
    expect(firstOutputCodec(report)).toBe("vp9");
  }, 60_000);

  it("legacy/bash/convert-all-mp4-in-folder-to-animated-webp.sh → MP4 to WebP batch", async () => {
    if (!available) return;
    const report = await runBatch("mp4-h264-aac", "source.mp4", "mp4", "webp");
    expect(report).toMatchObject({ succeeded: 1, failed: 0 });
    expect(firstOutputCodec(report)).toBe("webp");
  }, 60_000);

  it("legacy/bash/convert-all-mp4-in-folder-to-gif.sh → MP4 to GIF batch", async () => {
    if (!available) return;
    const report = await runBatch("mp4-h264-aac", "source.mp4", "mp4", "gif");
    expect(report).toMatchObject({ succeeded: 1, failed: 0 });
    expect(firstOutputCodec(report)).toBe("gif");
  }, 60_000);

  it("legacy/bash/convert-all-mp4-in-folder-to-webm.sh → MP4 to WebM batch", async () => {
    if (!available) return;
    const report = await runBatch("mp4-h264-aac", "source.mp4", "mp4", "webm");
    expect(report).toMatchObject({ succeeded: 1, failed: 0 });
    expect(firstOutputCodec(report)).toBe("vp9");
  }, 60_000);

  it("legacy/bash/convert-all-webm-in-folder-to-gif.sh → WebM to GIF batch", async () => {
    if (!available) return;
    const report = await runBatch("webm-vp9-opus", "source.webm", "webm", "gif");
    expect(report).toMatchObject({ succeeded: 1, failed: 0 });
    expect(firstOutputCodec(report)).toBe("gif");
  }, 60_000);

  it("legacy/bash/convert-all-webp-in-folder-to-png.sh → WebP to PNG batch", async () => {
    if (!available) return;
    const report = await runBatch("animated-webp", "source.webp", "webp", "png");
    expect(report).toMatchObject({ succeeded: 1, failed: 0 });
    expect(firstOutputCodec(report)).toBe("png");
  }, 60_000);

  it("legacy/bash/convert-audio-to-gsm-ulaw.sh → G.711 mu-law without GSM conflation", async () => {
    if (!available) return;
    const report = await transcodeTelephony(await fixturePath("wav-pcm"), {
      codec: "mulaw",
      container: "wav",
      sampleRate: 8000,
      channels: 1,
      output: path.join(workspace, "pcmu.wav"),
    });
    expect(report.outputMedia?.audio[0]?.codecName).toBe("pcm_mulaw");
    expect(report.outputMedia?.audio[0]?.codecName).not.toBe("gsm");
  }, 60_000);

  it("legacy/bash/create-clip-from-image.sh → video from-image", async () => {
    if (!available) return;
    const report = await createVideoFromImage(await fixturePath("png"), {
      duration: 0.3, width: 160, height: 90, fps: 20,
      output: path.join(workspace, "from-image.mp4"),
    });
    expect(report.outputMedia?.video[0]).toMatchObject({ width: 160, height: 90 });
  }, 60_000);

  it("legacy/bash/create-silence-audio.sh → audio silence", async () => {
    if (!available) return;
    const report = await generateSilence({
      duration: 0.25, sampleRate: 48000, channels: 2,
      output: path.join(workspace, "silence.wav"),
    });
    expect(report.outputMedia?.audio[0]).toMatchObject({ codecName: "pcm_s16le", sampleRate: 48000, channels: 2 });
  }, 60_000);

  it("legacy/bash/crop-x-seconds-from-start.sh → video trim-start", async () => {
    if (!available) return;
    const input = await copyFixture("mp4-h264-aac", "source.mp4");
    const report = await trimVideoStart(input, {
      seconds: 0.2, mode: "accurate", output: path.join(workspace, "trimmed.mp4"),
    });
    expect(report.outputMedia?.format.durationSeconds ?? 99).toBeLessThan(0.75);
  }, 60_000);

  it("legacy/bash/fix-freezes-and-blocks.sh → observed normalize repair", async () => {
    if (!available) return;
    const input = await copyFixture("video-vfr", "vfr.mp4");
    const report = await normalizeMedia(input, {
      fps: 30, pixelFormat: "yuv420p", output: path.join(workspace, "normalized.mp4"),
    });
    expect(report.outputMedia?.video[0]?.averageFrameRate).toBe("30/1");
    expect(report.after?.some((issue) => issue.severity === "error")).toBe(false);
  }, 90_000);

  it("legacy/bash/increase-video-speed.sh → video speed", async () => {
    if (!available) return;
    const input = await copyFixture("mp4-h264-aac", "source.mp4");
    const report = await changeVideoSpeed(input, {
      factor: 2, audio: "sync", output: path.join(workspace, "speed.mp4"),
    });
    expect(report.outputMedia?.format.durationSeconds ?? 99).toBeLessThan(0.55);
    expect(report.outputMedia?.audio).toHaveLength(1);
  }, 60_000);

  it("legacy/bash/remove-silence-noises.sh → audio remove-silence", async () => {
    if (!available) return;
    const report = await removeSilence(await fixturePath("speech-with-silence"), {
      noiseDb: -30, minDuration: 0.4, keepSilence: 0.03,
      output: path.join(workspace, "cleaned.wav"),
    });
    expect(report.outputMedia?.format.durationSeconds ?? 99).toBeLessThan(1.3);
  }, 60_000);

  it("legacy/bash/stack_vertical.sh → compose slideshow", async () => {
    if (!available) return;
    const images = path.join(workspace, "images");
    await mkdir(images, { recursive: true });
    await copyFile(await fixturePath("png"), path.join(images, "01.png"));
    await copyFile(await fixturePath("jpeg"), path.join(images, "02.jpg"));
    const report = await createVerticalStackSlideshow(images, {
      width: 160, height: 90, fps: 10, duration: 0.4,
      includeIntro: false, includeOutro: false,
      output: path.join(workspace, "slideshow.mp4"),
    });
    expect(report.outputMedia?.video[0]).toMatchObject({ width: 160, height: 90 });
  }, 90_000);

  it("legacy/bash/stream-to-websocket.sh → explicit HTTP relay plan, not WebSocket", async () => {
    if (!available) return;
    const report = await streamCamera({
      device: "/dev/video0", inputFormat: "v4l2", framerate: 15, videoSize: "320x240",
      url: "http://localhost:8083/juninhotest-uuid", transport: "http", container: "mpegts",
      videoCodec: "mpeg1video", videoBitrate: "500k", audioCodec: "none", dryRun: true,
    });
    expect(report.plan.destination).toMatchObject({ transport: "http", container: "mpegts" });
    expect(report.plan.destination.transport).not.toBe("websocket");
  }, 30_000);

  it("legacy/bash/upscale-video-to-fhd.sh → video restore 1920x1080", async () => {
    if (!available) return;
    const input = await copyFixture("video-only", "source.mp4");
    const report = await restoreVideo(input, {
      width: 1920, height: 1080, profile: "balanced",
      output: path.join(workspace, "fhd.mp4"),
    });
    expect(report.outputMedia?.video[0]).toMatchObject({ width: 1920, height: 1080 });
  }, 120_000);

  it("legacy/bash/upscale-video-to-hd.sh → video restore 1280x720", async () => {
    if (!available) return;
    const input = await copyFixture("video-only", "source.mp4");
    const report = await restoreVideo(input, {
      width: 1280, height: 720, profile: "balanced",
      output: path.join(workspace, "hd.mp4"),
    });
    expect(report.outputMedia?.video[0]).toMatchObject({ width: 1280, height: 720 });
  }, 120_000);
});
