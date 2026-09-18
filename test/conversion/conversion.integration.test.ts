import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { convertBatch, convertFile } from "../../src/conversion/index.js";
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

async function createMp4(directory: string, name = "source.mp4"): Promise<string> {
  const output = path.join(directory, name);
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc=size=128x72:rate=12",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
    "-t", "0.7",
    "-c:v", "mpeg4", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest", "-y", output,
  ]);
  return output;
}

async function createStaticWebp(directory: string): Promise<string> {
  const output = path.join(directory, "static.webp");
  await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "color=c=red:size=64x48:d=0.1",
    "-frames:v", "1", "-c:v", "libwebp", "-f", "webp", "-y", output,
  ]);
  return output;
}

describe("Milestone 6 media conversion integration", () => {
  it("executes all six initial conversion routes", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg m6-"));
    try {
      const mp4 = await createMp4(directory);
      const webm = await convertFile(mp4, { to: "webm", output: path.join(directory, "from-mp4.webm") });
      expect(webm.outputMedia?.video[0]?.codecName).toBe("vp9");
      expect(webm.outputMedia?.audio[0]?.codecName).toBe("opus");

      const gif = await convertFile(mp4, { to: "gif", output: path.join(directory, "from-mp4.gif"), fps: 8 });
      expect(gif.outputMedia?.video[0]?.codecName).toBe("gif");

      const animatedWebp = await convertFile(mp4, { to: "webp", output: path.join(directory, "from-mp4.webp"), fps: 8 });
      expect(animatedWebp.outputMedia?.video[0]?.codecName).toBe("webp");

      const webmGif = await convertFile(webm.output, { from: "webm", to: "gif", output: path.join(directory, "from-webm.gif"), fps: 8 });
      expect(webmGif.outputMedia?.video[0]?.codecName).toBe("gif");

      const gifWebm = await convertFile(gif.output, { from: "gif", to: "webm", output: path.join(directory, "from-gif.webm") });
      expect(gifWebm.outputMedia?.video[0]?.codecName).toBe("vp9");

      const webp = await createStaticWebp(directory);
      const png = await convertFile(webp, { from: "webp", to: "png", output: path.join(directory, "from-webp.png") });
      expect(png.outputMedia?.video[0]?.codecName).toBe("png");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 60_000);

  it("runs a generic recursive batch with hierarchy preservation and existing-output skip", async () => {
    if (!(await hasFFmpeg())) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia ffmpeg batch m6-"));
    const outputDirectory = path.join(directory, "converted");
    try {
      await mkdir(path.join(directory, "nested"));
      await createMp4(directory, "one.mp4");
      await createMp4(path.join(directory, "nested"), "two.mp4");

      const first = await convertBatch(directory, {
        from: "mp4",
        to: "webm",
        recursive: true,
        outputDirectory,
        parallelism: 2,
        preserveHierarchy: true,
      });
      expect(first).toMatchObject({ discovered: 2, attempted: 2, succeeded: 2, failed: 0, skipped: 0 });
      expect(first.items.some((item) => item.output?.endsWith(path.join("nested", "two.webm")))).toBe(true);

      const second = await convertBatch(directory, {
        from: "mp4",
        to: "webm",
        recursive: true,
        outputDirectory,
        existing: "skip",
      });
      expect(second).toMatchObject({ discovered: 2, attempted: 0, succeeded: 0, failed: 0, skipped: 2 });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 60_000);
});
