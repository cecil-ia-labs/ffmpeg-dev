import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFmpeg } from "../../src/core/ffmpeg-runner.js";

async function ffmpegAvailable(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    return true;
  } catch {
    return false;
  }
}

describe("runFFmpeg", () => {
  it("runs the resolved FFmpeg binary", async () => {
    if (!(await ffmpegAvailable())) return;
    const result = await runFFmpeg(["-version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/^ffmpeg version/m);
  });

  it("supports a real dry-run without spawning FFmpeg", async () => {
    if (!(await ffmpegAvailable())) return;
    const result = await runFFmpeg(["-this-option-does-not-exist"], { dryRun: true });
    expect(result.executed).toBe(false);
    expect(result.exitCode).toBe(0);
  });
});
