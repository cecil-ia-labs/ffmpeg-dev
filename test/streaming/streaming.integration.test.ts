import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";
import { streamCamera, streamFile } from "../../src/streaming/index.js";

async function hasFFmpeg(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    await resolveBinary({ kind: "ffprobe" });
    return true;
  } catch {
    return false;
  }
}

describe("Streaming integration", () => {
  it("plans file streaming after a real FFprobe preflight without opening a socket", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-m9-"));
    const fixture = path.join(directory, "fixture.mp4");
    try {
      await runFFmpeg([
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "testsrc=size=96x64:rate=10",
        "-t",
        "0.25",
        "-c:v",
        "mpeg4",
        "-y",
        fixture,
      ]);
      const report = await streamFile(fixture, {
        url: "udp://127.0.0.1:23000",
        transport: "udp",
        audioCodec: "none",
        dryRun: true,
      });
      expect(report.planned).toBe(true);
      expect(report.execution.executed).toBe(false);
      expect(report.sourceMedia?.video[0]).toMatchObject({ width: 96, height: 64 });
      expect(report.plan.destination).toMatchObject({ transport: "udp", container: "mpegts" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("plans camera capture without opening a device in dry-run mode", async () => {
    if (!(await hasFFmpeg())) return;
    const report = await streamCamera({
      device: "/dev/video0",
      inputFormat: "v4l2",
      framerate: 15,
      videoSize: "320x240",
      url: "http://localhost:8083/live",
      audioCodec: "none",
      dryRun: true,
    });
    expect(report.planned).toBe(true);
    expect(report.plan.source).toMatchObject({ kind: "camera", inputFormat: "v4l2" });
  });
});
