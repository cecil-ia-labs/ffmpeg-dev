import { describe, expect, it } from "vitest";

import { globalCliOptionsSchema } from "../../src/cli/global-options.js";

describe("global CLI option schema", () => {
  it("supplies deterministic defaults", () => {
    expect(globalCliOptionsSchema.parse({})).toEqual({
      overwrite: false,
      dryRun: false,
      json: false,
      quiet: false,
      verbose: false,
      keepTemp: false,
    });
  });

  it("accepts explicit runtime paths and output", () => {
    const parsed = globalCliOptionsSchema.parse({
      output: "./out.mp4",
      overwrite: true,
      ffmpegPath: "/opt/bin/ffmpeg",
      ffprobePath: "/opt/bin/ffprobe",
    });

    expect(parsed.output).toBe("./out.mp4");
    expect(parsed.overwrite).toBe(true);
    expect(parsed.ffmpegPath).toBe("/opt/bin/ffmpeg");
    expect(parsed.ffprobePath).toBe("/opt/bin/ffprobe");
  });
});
