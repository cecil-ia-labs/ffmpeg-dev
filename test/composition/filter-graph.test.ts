import { describe, expect, it } from "vitest";

import { FilterGraphBuilder } from "../../src/composition/filter-graph.js";
import { resolveVideoNormalization, videoNormalizationFilters } from "../../src/composition/normalization.js";
import type { MediaInfo } from "../../src/types/contracts.js";

const media: MediaInfo = {
  source: "fixture.mp4",
  format: { durationSeconds: 2 },
  streams: [],
  video: [{ index: 0, codecType: "video", width: 640, height: 360 }],
  audio: [],
};

describe("Milestone 7 filter graph", () => {
  it("builds normalized filter chains for FFmpeg input pad labels", () => {
    const normalization = resolveVideoNormalization([media], { fps: 25 });
    expect(normalization).toEqual({ width: 640, height: 360, fps: 25, pixelFormat: "yuv420p" });
    expect(videoNormalizationFilters(normalization)).toContain("settb=AVTB");

    const graph = new FilterGraphBuilder()
      .add(["0:v"], videoNormalizationFilters(normalization), "v0")
      .add(["1:v"], videoNormalizationFilters(normalization), "v1")
      .addRaw("[v0][v1]xfade=transition=fade:duration=1:offset=1[vout]")
      .build();

    expect(graph).toContain("[0:v]");
    expect(graph).toContain("setpts=PTS-STARTPTS");
    expect(graph).toContain("xfade=transition=fade");
  });
});
