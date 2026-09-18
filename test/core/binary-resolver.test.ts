import { describe, expect, it } from "vitest";

import { resolveBinary } from "../../src/core/binary-resolver.js";

describe("resolveBinary", () => {
  it("accepts an explicit executable path", async () => {
    await expect(resolveBinary({ kind: "ffmpeg", explicitPath: process.execPath })).resolves.toBe(
      process.execPath,
    );
  });

  it("returns a typed missing-binary error", async () => {
    const missing = `/definitely/missing/cecilia-ffmpeg-${process.pid}`;
    await expect(resolveBinary({ kind: "ffprobe", explicitPath: missing })).rejects.toMatchObject({
      code: "E_ENV_FFPROBE_NOT_FOUND",
    });
  });
});
