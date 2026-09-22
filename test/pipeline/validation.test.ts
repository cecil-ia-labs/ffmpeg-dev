import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { executePipeline, expandPipelineSteps, loadPipelineFile, parsePipelineText, validatePipelineOutput, validatePipelineResultCodec } from "../../src/pipeline/index.js";

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

  it("rejects a video-only step after an audio conversion", () => {
    const document = parsePipelineText([
      "input: source.mp4",
      "steps:",
      "  - convert:",
      "      to: mp3",
      "  - resize:",
      "      width: 640",
      "      height: 360",
      "output:",
      "  path: final.mp4",
    ].join("\n"));

    expect(() => validatePipelineOutput(document, expandPipelineSteps(document), "/tmp/final.mp4"))
      .toThrow(/requires video media/i);
  });

  it("resolves a relative runtime output override from the pipeline file directory", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-output-test-"));
    try {
      await writeFile(path.join(workspace, "input.mp4"), "placeholder");
      const pipelineFile = path.join(workspace, "pipeline.yaml");
      await writeFile(pipelineFile, [
        "input: input.mp4",
        "steps:",
        "  - trim:",
        "      start: 1",
        "output:",
        "  path: default.mp4",
      ].join("\n"));

      const report = await executePipeline(
        await loadPipelineFile(pipelineFile),
        { dryRun: true, output: "alternate.mp4" },
      );

      expect(report.output).toBe(path.join(workspace, "alternate.mp4"));
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });


  it("rejects a final output that would replace the original pipeline input", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-input-collision-test-"));
    try {
      await writeFile(path.join(workspace, "input.mp4"), "placeholder");
      const pipelineFile = path.join(workspace, "pipeline.yaml");
      await writeFile(pipelineFile, [
        "input: input.mp4",
        "steps:",
        "  - trim:",
        "      start: 1",
        "  - speed:",
        "      factor: 1.1",
        "output:",
        "  path: input.mp4",
      ].join("\n"));

      await expect(
        executePipeline(await loadPipelineFile(pipelineFile), { dryRun: true, overwrite: true }),
      ).rejects.toMatchObject({
        code: "E_CONFIG_CONFLICT",
        message: "Input and output paths must be different.",
      });
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });


  it("rejects final media that violates the declared codec assertion", () => {
    const document = parsePipelineText([
      "input: source.mkv",
      "steps:",
      "  - trim:",
      "      start: 1",
      "      mode: copy",
      "output:",
      "  path: final.mkv",
      "  codec: h264",
    ].join("\n"));

    expect(() => validatePipelineResultCodec(document, {
      source: "/tmp/final.mkv",
      format: {},
      streams: [{ index: 0, codecType: "video", codecName: "vp9" }],
      video: [{ index: 0, codecType: "video", codecName: "vp9" }],
      audio: [],
    })).toThrow(/declared output codec/i);
  });


  it("rejects more than 256 directly declared steps at schema validation time", () => {
    const repeated = Array.from(
      { length: 257 },
      () => "  - trim:\n      start: 1",
    ).join("\n");

    expect(() => parsePipelineText([
      "input: input.mp4",
      "steps:",
      repeated,
      "output:",
      "  path: final.mp4",
    ].join("\n"))).toThrow(/schema/i);
  });


  it("fails on an existing final output before executing any media step", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-existing-output-test-"));
    try {
      const input = path.join(workspace, "input.mp4");
      const output = path.join(workspace, "already-exists.mp4");
      await writeFile(input, "not valid media on purpose");
      await writeFile(output, "existing output");
      const pipelineFile = path.join(workspace, "pipeline.yaml");
      await writeFile(pipelineFile, [
        "input: input.mp4",
        "steps:",
        "  - trim:",
        "      start: 1",
        "output:",
        "  path: already-exists.mp4",
      ].join("\n"));

      await expect(
        executePipeline(await loadPipelineFile(pipelineFile)),
      ).rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("allows an existing final output during preflight when overwrite is explicit", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-overwrite-preflight-test-"));
    try {
      const input = path.join(workspace, "input.mp4");
      const output = path.join(workspace, "already-exists.mp4");
      await writeFile(input, "placeholder");
      await writeFile(output, "existing output");
      const pipelineFile = path.join(workspace, "pipeline.yaml");
      await writeFile(pipelineFile, [
        "input: input.mp4",
        "steps:",
        "  - trim:",
        "      start: 1",
        "output:",
        "  path: already-exists.mp4",
      ].join("\n"));

      const report = await executePipeline(
        await loadPipelineFile(pipelineFile),
        { dryRun: true, overwrite: true },
      );
      expect(report.planned).toBe(true);
      expect(report.output).toBe(output);
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

});
