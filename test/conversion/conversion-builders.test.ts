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
    expect(inferConversionFormat("photo.JPG")).toBe("jpeg");
    expect(inferConversionFormat("call.wav")).toBe("wav");
    expect(() => assertSupportedConversion("mp4", "webm")).not.toThrow();
    expect(() => assertSupportedConversion("gif", "mp4")).not.toThrow();
    expect(() => assertSupportedConversion("mp4", "png")).not.toThrow();
    expect(() => assertSupportedConversion("wav", "mp3")).not.toThrow();
    expect(() => assertSupportedConversion("mp4", "mp4")).toThrowError(/both mp4/);
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

  it("builds MP4, JPEG and audio conversion profiles", () => {
    const mp4 = buildConversionPlan("/tmp/input.webm", "webm", "mp4", mediaWithAudio);
    expect(mp4.argsBeforeOutput.join(" ")).toContain("libx264");

    const jpeg = buildConversionPlan("/tmp/input.mp4", "mp4", "jpeg", mediaWithAudio);
    expect(jpeg.argsBeforeOutput.join(" ")).toContain("mjpeg");

    const audioOnly: MediaInfo = {
      source: "/tmp/input.wav",
      format: {},
      streams: [],
      video: [],
      audio: [{ index: 0, codecType: "audio", codecName: "pcm_s16le", sampleRate: 48000, channels: 1 }],
    };
    const mp3 = buildConversionPlan("/tmp/input.wav", "wav", "mp3", audioOnly, { audioBitrate: "128k" });
    expect(mp3.argsBeforeOutput.join(" ")).toContain("libmp3lame");
    expect(mp3.argsBeforeOutput.join(" ")).toContain("128k");
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
