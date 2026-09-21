import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildAtempoChain } from "../../src/video/speed.js";
import { buildRestoreFilter } from "../../src/video/restore.js";
import { deriveOutputPath } from "../../src/video/io.js";


describe("Video builders", () => {
  it("decomposes audio tempo changes into FFmpeg-safe stages", () => {
    expect(buildAtempoChain(1)).toBe("atempo=1");
    expect(buildAtempoChain(4)).toBe("atempo=2,atempo=2");
    expect(buildAtempoChain(0.25)).toBe("atempo=0.5,atempo=0.5");
    expect(buildAtempoChain(2.5)).toBe("atempo=2,atempo=1.25");
  });

  it("builds deterministic balanced and aggressive restore filters", () => {
    const balanced = buildRestoreFilter(1920, 1080, "balanced");
    expect(balanced).toContain("scale=1920:1080");
    expect(balanced).toContain("pad=1920:1080");
    expect(balanced).not.toContain("nlmeans");

    const aggressive = buildRestoreFilter(1280, 720, "aggressive");
    expect(aggressive).toContain("bwdif");
    expect(aggressive).toContain("nlmeans");
    expect(aggressive).toContain("unsharp");
  });

  it("derives output paths without modifying the source path", () => {
    const source = path.join("/tmp", "media files", "demo clip.mp4");
    expect(deriveOutputPath(source, "trim-start")).toBe(path.join("/tmp", "media files", "demo clip.trim-start.mp4"));
    expect(deriveOutputPath(source, "clip", undefined, { defaultExtension: ".mp4" })).toBe(path.join("/tmp", "media files", "demo clip.clip.mp4"));
  });
});
