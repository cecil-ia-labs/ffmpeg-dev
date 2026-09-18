import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";
import { runFFprobe } from "../../src/core/ffprobe-runner.js";

async function ffprobeAvailable(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffprobe" });
    return true;
  } catch {
    return false;
  }
}

describe("runFFprobe", () => {
  it("runs the resolved FFprobe binary", async () => {
    if (!(await ffprobeAvailable())) return;
    const result = await runFFprobe(["-version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/^ffprobe version/m);
  });
});
