import { describe, expect, it } from "vitest";

import { ToolkitRuntimeError } from "../../src/core/errors.js";
import { expandPipelineSteps, MAX_EXPANDED_PIPELINE_STEPS, MAX_PIPELINE_PRESET_DEPTH, parsePipelineText } from "../../src/pipeline/index.js";

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

  it("rejects preset nesting beyond the deterministic depth limit", () => {
    const presets = Array.from({ length: MAX_PIPELINE_PRESET_DEPTH + 1 }, (_, index) => {
      const name = `p${index}`;
      const next = index === MAX_PIPELINE_PRESET_DEPTH
        ? "    - trim:\n        start: 1"
        : `    - preset: p${index + 1}`;
      return `  ${name}:\n${next}`;
    }).join("\n");

    const document = parsePipelineText([
      "input: input.mp4",
      "presets:",
      presets,
      "steps:",
      "  - preset: p0",
      "output:",
      "  path: final.mp4",
    ].join("\n"));

    expect(() => expandPipelineSteps(document)).toThrow(/nesting.*depth/i);
  });

  it("rejects expanded pipelines beyond the supported step limit", () => {
    const repeated = Array.from(
      { length: MAX_EXPANDED_PIPELINE_STEPS + 1 },
      () => "  - trim:\n      start: 1",
    ).join("\n");

    const document = parsePipelineText([
      "input: input.mp4",
      "steps:",
      repeated,
      "output:",
      "  path: final.mp4",
    ].join("\n"));

    expect(() => expandPipelineSteps(document)).toThrow(/step limit/i);
  });

});
