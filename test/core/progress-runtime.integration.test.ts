import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";
import { withProgressObserver } from "../../src/core/progress-context.js";
import type { FFmpegProgressEvent } from "../../src/core/progress.js";

async function ffmpegAvailable(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    return true;
  } catch {
    return false;
  }
}

describe("Progress runtime integration", () => {
  it("collects structured FFmpeg progress without scraping decorated stderr", async () => {
    if (!(await ffmpegAvailable())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-progress-"));
    const output = path.join(directory, "progress.mp4");
    const events: FFmpegProgressEvent[] = [];

    try {
      await withProgressObserver((event) => events.push(event), async () => {
        await runFFmpeg([
          "-hide_banner",
          "-loglevel", "error",
          "-f", "lavfi",
          "-i", "testsrc2=size=64x48:rate=10:duration=0.4",
          "-t", "0.4",
          "-c:v", "mpeg4",
          "-y", output,
        ]);
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events.at(-1)).toMatchObject({
        state: "end",
        percentage: 100,
        totalSeconds: 0.4,
      });
      expect(events.some((event) => event.frame !== undefined)).toBe(true);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);
});
