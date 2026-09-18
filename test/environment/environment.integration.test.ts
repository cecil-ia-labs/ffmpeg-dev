import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";
import { inspectDoctor } from "../../src/environment/doctor.js";
import { inspectEnvironmentCapabilities } from "../../src/environment/capabilities.js";
import { inspectEnvironmentVersions } from "../../src/environment/version.js";
import { probeMedia } from "../../src/media/probe.js";

async function hasFFmpeg(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    await resolveBinary({ kind: "ffprobe" });
    return true;
  } catch {
    return false;
  }
}

describe("Milestone 3 environment inspection", () => {
  it("inspects versions, capabilities and doctor report when FFmpeg is installed", async () => {
    if (!(await hasFFmpeg())) return;
    const versions = await inspectEnvironmentVersions();
    const capabilities = await inspectEnvironmentCapabilities();
    const doctor = await inspectDoctor();

    expect(versions.ffmpeg.version?.product).toBe("ffmpeg");
    expect(versions.ffprobe.version?.product).toBe("ffprobe");
    expect(capabilities.codecs.length).toBeGreaterThan(0);
    expect(capabilities.encoders.length).toBeGreaterThan(0);
    expect(capabilities.decoders.length).toBeGreaterThan(0);
    expect(capabilities.filters.length).toBeGreaterThan(0);
    expect(["ok", "warning", "error"]).toContain(doctor.status);
  });

  it("generates and normalizes a real audiovisual fixture", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-m3-"));
    const fixture = path.join(directory, "fixture.mp4");
    try {
      await runFFmpeg([
        "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", "testsrc=size=96x64:rate=10",
        "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
        "-t", "0.5", "-c:v", "mpeg4", "-c:a", "aac", "-shortest", "-y", fixture,
      ]);
      const report = await probeMedia(fixture);
      expect(report.planned).toBe(false);
      expect(report.media?.video[0]).toMatchObject({ width: 96, height: 64, codecName: "mpeg4" });
      expect(report.media?.audio[0]).toMatchObject({ sampleRate: 48000, codecName: "aac" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
