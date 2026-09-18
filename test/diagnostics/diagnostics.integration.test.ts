import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";
import { diagnoseMedia, normalizeMedia, repairTimestamps } from "../../src/diagnostics/index.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(): Promise<{ root: string; input: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "cecilia-m8-"));
  roots.push(root);
  const input = path.join(root, "input.mp4");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc2=size=160x90:rate=24:duration=1.2",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=1.2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", input,
  ]);
  return { root, input };
}

describe("Milestone 8 diagnostics and repair", () => {
  it("diagnoses a healthy audiovisual fixture", async () => {
    const { input } = await fixture();
    const report = await diagnoseMedia(input);
    expect(report.media.video).toHaveLength(1);
    expect(report.media.audio).toHaveLength(1);
    expect(report.issues.some((issue) => issue.severity === "error")).toBe(false);
  });

  it("normalizes media and reprobes the result", async () => {
    const { root, input } = await fixture();
    const output = path.join(root, "normalized.mp4");
    const report = await normalizeMedia(input, { output, width: 320, height: 180, fps: 30 });
    expect(report.outputMedia?.video[0]?.width).toBe(320);
    expect(report.outputMedia?.video[0]?.height).toBe(180);
    expect(report.after?.some((issue) => issue.severity === "error")).toBe(false);
  });

  it("repairs timestamps through re-encoding", async () => {
    const { root, input } = await fixture();
    const output = path.join(root, "timestamps.mp4");
    const report = await repairTimestamps(input, { output, fps: 30 });
    expect(report.outputMedia?.video).toHaveLength(1);
    expect(report.outputMedia?.audio).toHaveLength(1);
  });
});
