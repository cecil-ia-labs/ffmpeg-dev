import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { concatMedia, transitionMedia } from "../../src/composition/index.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";

const directories: string[] = [];

async function fixture(directory: string, name: string, frequency: number): Promise<string> {
  const output = path.join(directory, name);
  const execution = await runFFmpeg([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", `testsrc2=size=160x90:rate=24:duration=1.5`,
    "-f", "lavfi", "-i", `sine=frequency=${frequency}:sample_rate=48000:duration=1.5`,
    "-shortest", "-c:v", "mpeg4", "-c:a", "aac", "-y", output,
  ]);
  if (!execution.executed || execution.exitCode !== 0) throw new Error("Unable to create composition fixture");
  return output;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

describe("Composition integration", () => {
  it("composes normalized inputs with xfade and acrossfade", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-compose-"));
    directories.push(directory);
    const left = await fixture(directory, "left.mp4", 440);
    const right = await fixture(directory, "right.mp4", 660);

    const transitioned = await transitionMedia(left, right, {
      output: path.join(directory, "transition.mp4"),
      duration: 0.25,
      fps: 30,
    });
    expect(transitioned.planned).toBe(false);
    expect(transitioned.outputMedia?.video[0]?.width).toBe(160);
    expect(transitioned.outputMedia?.audio.length).toBeGreaterThan(0);

    const concatenated = await concatMedia([left, right], {
      output: path.join(directory, "concat.mp4"),
      transition: "fade",
      transitionDuration: 0.25,
      fps: 30,
    });
    expect(concatenated.planned).toBe(false);
    expect(concatenated.outputMedia?.video[0]?.averageFrameRate).toBeDefined();
  });
});
