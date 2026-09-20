import { describe, expect, it } from "vitest";

import { ToolkitRuntimeError } from "../../src/core/errors.js";
import { expandPipelineSteps, parsePipelineText } from "../../src/pipeline/index.js";

describe("pipeline presets", () => {
  it("expands nested named presets deterministically", () => {
    const document = parsePipelineText([
      "input: input.mp4",
      "presets:",
      "  social:",
      "    - preset: base",
      "    - resize:",
      "        width: 1080",
      "        height: 1080",
      "  base:",
      "    - trim:",
      "        start: 1",
      "    - speed:",
      "        factor: 1.1",
      "steps:",
      "  - preset: social",
      "  - convert:",
      "      to: mp4",
      "output:",
      "  path: final.mp4",
    ].join("\n"));

    const expanded = expandPipelineSteps(document);
    expect(expanded).toHaveLength(4);
    expect(expanded.map((step) => Object.keys(step)[0])).toEqual(["trim", "speed", "resize", "convert"]);
  });

  it("rejects unknown preset references", () => {
    const document = parsePipelineText([
      "input: input.mp4",
      "steps:",
      "  - preset: missing",
      "output:",
      "  path: final.mp4",
    ].join("\n"));

    expect(() => expandPipelineSteps(document)).toThrowError(ToolkitRuntimeError);
  });

  it("rejects recursive preset cycles", () => {
    const document = parsePipelineText([
      "input: input.mp4",
      "presets:",
      "  a:",
      "    - preset: b",
      "  b:",
      "    - preset: a",
      "steps:",
      "  - preset: a",
      "output:",
      "  path: final.mp4",
    ].join("\n"));

    expect(() => expandPipelineSteps(document)).toThrow(/cycle/i);
  });
});
