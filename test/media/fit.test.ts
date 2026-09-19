import { describe, expect, it } from "vitest";

import { buildFitFilters } from "../../src/media/fit.js";

describe("media fit filters", () => {
  it("builds contain with deterministic padding", () => {
    expect(buildFitFilters({ width: 1920, height: 1080, fit: "contain", background: "black" })).toEqual([
      "scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos",
      "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black",
    ]);
  });

  it("builds cover with crop", () => {
    expect(buildFitFilters({ width: 1280, height: 720, fit: "cover" })).toEqual([
      "scale=1280:720:force_original_aspect_ratio=increase:flags=lanczos",
      "crop=1280:720",
    ]);
  });

  it("builds stretch without aspect-ratio preservation", () => {
    expect(buildFitFilters({ width: 640, height: 480, fit: "stretch" })).toEqual([
      "scale=640:480:flags=lanczos",
    ]);
  });
});
