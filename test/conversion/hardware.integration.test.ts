import { beforeAll, describe, expect, it } from "vitest";

import { convertFile } from "../../src/conversion/index.js";
import { ensureFixtureMatrix, fixturePath } from "../helpers/fixture-matrix.js";

let available = false;

beforeAll(async () => {
  available = await ensureFixtureMatrix();
}, 120_000);

describe("Milestone 17 hardware conversion policy", () => {
  it("plans auto hardware encoding from actual FFmpeg capabilities", async () => {
    if (!available) return;
    const webm = await fixturePath("webm-vp9-opus");
    const report = await convertFile(webm, {
      to: "mp4",
      hardware: "auto",
      dryRun: true,
    });

    expect(report.planned).toBe(true);
    expect(report.details["hardware"]).toMatchObject({ requested: "auto" });
    expect(report.invocation).toContain("-c:v");
  }, 120_000);

  it("falls back deterministically when a backend cannot encode the target codec", async () => {
    if (!available) return;
    const mp4 = await fixturePath("mp4-h264-aac");
    const report = await convertFile(mp4, {
      to: "webm",
      hardware: "nvenc",
      dryRun: true,
    });

    expect(report.details["hardware"]).toMatchObject({
      requested: "nvenc",
      resolved: "software",
      fallback: true,
    });
    expect(report.invocation).toContain("libvpx-vp9");
    expect(report.warnings.map((warning) => warning.code)).toContain("W_HARDWARE_SOFTWARE_FALLBACK");
  }, 120_000);
});
