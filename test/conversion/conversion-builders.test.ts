import { describe, expect, it } from "vitest";

import {
  assertSupportedConversion,
  buildConversionPlan,
  globToRegExp,
  inferConversionFormat,
} from "../../src/conversion/index.js";
import type { MediaInfo } from "../../src/types/contracts.js";

const mediaWithAudio: MediaInfo = {
  source: "/tmp/input.mp4",
  format: {},
  streams: [],
  video: [{ index: 0, codecType: "video", codecName: "h264", width: 320, height: 180 }],
  audio: [{ index: 1, codecType: "audio", codecName: "aac", sampleRate: 48000, channels: 2 }],
};

describe("Milestone 6 conversion profiles", () => {
  it("recognizes the supported migration formats and pairs", () => {
    expect(inferConversionFormat("clip.MP4")).toBe("mp4");
    expect(inferConversionFormat("animation.webp")).toBe("webp");
    expect(() => assertSupportedConversion("mp4", "webm")).not.toThrow();
    expect(() => assertSupportedConversion("gif", "webm")).not.toThrow();
    expect(() => assertSupportedConversion("mp4", "png")).toThrowError(/Unsupported conversion/);
  });

  it("builds an inline-palette GIF profile and reports dropped audio", () => {
    const plan = buildConversionPlan("/tmp/input.mp4", "mp4", "gif", mediaWithAudio, {
      fps: 12,
      maxColors: 128,
    });
    expect(plan.argsBeforeOutput.join(" ")).toContain("palettegen=max_colors=128");
    expect(plan.argsBeforeOutput.join(" ")).toContain("paletteuse=dither=sierra2_4a");
    expect(plan.warnings.map((warning) => warning.code)).toContain("W_CONVERSION_AUDIO_DROPPED");
  });

  it("builds animated WebP without requiring the external webpmux utility", () => {
    const plan = buildConversionPlan("/tmp/input.mp4", "mp4", "webp", mediaWithAudio, {
      fps: 8,
      quality: 75,
    });
    const command = plan.argsBeforeOutput.join(" ");
    expect(command).toContain("libwebp");
    expect(command).toContain("-f webp");
    expect(command).not.toContain("webpmux");
  });
});

describe("Milestone 6 glob matching", () => {
  it("supports *, ?, and ** path matching", () => {
    expect(globToRegExp("**/keep-*.mp4").test("nested/keep-one.mp4")).toBe(true);
    expect(globToRegExp("skip-?.mp4").test("skip-a.mp4")).toBe(true);
    expect(globToRegExp("*.mp4").test("nested/clip.mp4")).toBe(false);
  });
});
