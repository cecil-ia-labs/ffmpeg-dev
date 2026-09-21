import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";
import { changeVideoSpeed, createVideoFromImage, restoreVideo, trimVideoEnd, trimVideoRange, trimVideoStart } from "../../src/video/index.js";

async function hasFFmpeg(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    await resolveBinary({ kind: "ffprobe" });
    return true;
  } catch {
    return false;
  }
}

async function createFixture(directory: string): Promise<string> {
  const fixture = path.join(directory, "source clip.mp4");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc=size=160x90:rate=20",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
    "-t", "1.6", "-c:v", "mpeg4", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-y", fixture,
  ]);
  return fixture;
}

function duration(report: { outputMedia?: { format: { durationSeconds?: number } } }): number {
  const value = report.outputMedia?.format.durationSeconds;
  if (value === undefined) throw new Error("Expected output duration");
  return value;
}

describe("Video editing integration", () => {
  it("trims start/end/ranges with accurate mode and validates the outputs", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m4-"));
    try {
      const source = await createFixture(directory);
      const start = await trimVideoStart(source, { seconds: 0.4, mode: "accurate", output: path.join(directory, "trim start.mp4") });
      const end = await trimVideoEnd(source, { seconds: 0.4, mode: "accurate", output: path.join(directory, "trim end.mp4") });
      const range = await trimVideoRange(source, { start: 0.3, duration: 0.7, mode: "accurate", output: path.join(directory, "trim range.mp4") });

      expect(start.outputMedia?.video[0]).toMatchObject({ width: 160, height: 90 });
      expect(duration(start)).toBeGreaterThan(1.0);
      expect(duration(start)).toBeLessThan(1.35);
      expect(duration(end)).toBeGreaterThan(1.0);
      expect(duration(end)).toBeLessThan(1.35);
      expect(duration(range)).toBeGreaterThan(0.6);
      expect(duration(range)).toBeLessThan(0.85);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("changes speed while keeping synchronized audio", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m4-"));
    try {
      const source = await createFixture(directory);
      const report = await changeVideoSpeed(source, { factor: 2, audio: "sync", output: path.join(directory, "speed output.mp4") });
      expect(report.outputMedia?.video).toHaveLength(1);
      expect(report.outputMedia?.audio.length).toBeGreaterThan(0);
      expect(duration(report)).toBeGreaterThan(0.7);
      expect(duration(report)).toBeLessThan(0.95);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("creates a clip from a still image and restores video to an explicit resolution", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m4-"));
    try {
      const image = path.join(directory, "still image.ppm");
      await writeFile(image, "P3\n2 2\n255\n255 0 0  0 255 0\n0 0 255  255 255 255\n", "utf8");
      const fromImage = await createVideoFromImage(image, {
        duration: 0.5,
        width: 160,
        height: 90,
        fps: 20,
        output: path.join(directory, "still clip.mp4"),
      });
      expect(fromImage.outputMedia?.video[0]).toMatchObject({ width: 160, height: 90 });

      const source = await createFixture(directory);
      const restored = await restoreVideo(source, {
        width: 320,
        height: 180,
        profile: "balanced",
        output: path.join(directory, "restored video.mp4"),
      });
      expect(restored.outputMedia?.video[0]).toMatchObject({ width: 320, height: 180 });
      expect(restored.outputMedia?.audio.length).toBeGreaterThan(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);
});
