import { describe, expect, it } from "vitest";

import { expandPipelineSteps, parsePipelineText, validatePipelineOutput } from "../../src/pipeline/index.js";

describe("pipeline output validation", () => {
  it("accepts roadmap H.264 output semantics", () => {
    const document = parsePipelineText([
      "input: source.mp4",
      "steps:",
      "  - trim:",
      "      start: 1",
      "output:",
      "  path: final.mp4",
      "  codec: h264",
    ].join("\n"));
    expect(() => validatePipelineOutput(document, expandPipelineSteps(document), "/tmp/final.mp4")).not.toThrow();
  });

  it("rejects VP9 declared for an MP4 output", () => {
    const document = parsePipelineText([
      "input: source.mp4",
      "steps:",
      "  - trim:",
      "      start: 1",
      "output:",
      "  path: final.mp4",
      "  codec: vp9",
    ].join("\n"));
    expect(() => validatePipelineOutput(document, expandPipelineSteps(document), "/tmp/final.mp4")).toThrow(/codec.*extension/i);
  });

  it("rejects a final conversion whose target disagrees with the output extension", () => {
    const document = parsePipelineText([
      "input: source.mp4",
      "steps:",
      "  - convert:",
      "      to: webm",
      "output:",
      "  path: final.mp4",
    ].join("\n"));
    expect(() => validatePipelineOutput(document, expandPipelineSteps(document), "/tmp/final.mp4")).toThrow(/conversion target/i);
  });

  it("rejects video codec declarations for image/audio final conversions", () => {
    const document = parsePipelineText([
      "input: source.mp4",
      "steps:",
      "  - convert:",
      "      to: gif",
      "output:",
      "  path: final.gif",
      "  codec: h264",
    ].join("\n"));
    expect(() => validatePipelineOutput(document, expandPipelineSteps(document), "/tmp/final.gif")).toThrow(/codec/i);
  });
});
