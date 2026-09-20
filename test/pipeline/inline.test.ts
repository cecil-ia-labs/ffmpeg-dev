import { describe, expect, it } from "vitest";

import { parsePipelineInvocation } from "../../src/pipeline/inline.js";

describe("inline pipeline parser", () => {
  it("requires chained inputs to match declared intermediate outputs", () => {
    expect(() => parsePipelineInvocation([
      "--step", "trim",
      "--input", "source.mp4",
      "--output", "trim.mp4",
      "--step", "convert",
      "--input", "other.mp4",
      "--to", "webm",
      "--output", "final.webm",
      "run",
    ])).toThrow(/must chain/);
  });

  it("accepts a final global output fallback for an inline pipeline", () => {
    const invocation = parsePipelineInvocation([
      "--step", "trim",
      "--input", "source.mp4",
      "--trim-start", "1",
      "run",
    ], { outputOverride: "final.mp4" });

    expect(invocation.document?.output.path).toBe("final.mp4");
  });
});
