import { describe, expect, it } from "vitest";

import { FFmpegProgressParser } from "../../src/core/progress.js";

describe("FFmpegProgressParser", () => {
  it("parses incremental FFmpeg progress records", () => {
    const parser = new FFmpegProgressParser();
    expect(parser.push("frame=42\nfps=29.97\nout_time_us=1000000\n")).toEqual([]);
    const snapshots = parser.push("speed=1.2x\nprogress=continue\n");

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      frame: 42,
      fps: 29.97,
      outTimeUs: 1_000_000,
      speed: "1.2x",
      progress: "continue",
    });
  });
});
