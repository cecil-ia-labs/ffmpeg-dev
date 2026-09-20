import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { executePipeline, loadPipelineFile } from "../../src/pipeline/index.js";
import { ensureFixtureMatrix, fixturePath } from "../helpers/fixture-matrix.js";

let available = false;
const workspaces: string[] = [];

beforeAll(async () => {
  available = await ensureFixtureMatrix();
}, 120_000);

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

describe("pipeline normalization steps", () => {
  it("executes the roadmap-style trim -> speed -> resize -> audio normalize workflow", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-roadmap-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");

    await writeFile(pipelineFile, [
      "version: 1",
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - trim:",
      "      start: 0.1",
      "  - speed:",
      "      factor: 1.25",
      "  - resize:",
      "      width: 640",
      "      height: 360",
      "  - audio:",
      "      normalize: true",
      "      sampleRate: 48000",
      "      channels: 2",
      "output:",
      "  path: final.mp4",
      "  codec: h264",
      "",
    ].join("\n"));

    const report = await executePipeline(await loadPipelineFile(pipelineFile));

    expect(report.steps.map((step) => step.kind)).toEqual(["trim", "speed", "resize", "audio"]);
    expect(report.outputMedia?.video[0]).toMatchObject({ codecName: "h264", width: 640, height: 360 });
    expect(report.outputMedia?.audio[0]).toMatchObject({ sampleRate: 48000, channels: 2 });
  }, 120_000);

  it("supports explicit general normalization", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-normalize-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");

    await writeFile(pipelineFile, [
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - normalize:",
      "      width: 320",
      "      height: 180",
      "      fps: 30",
      "      pixelFormat: yuv420p",
      "output:",
      "  path: normalized.mp4",
      "",
    ].join("\n"));

    const report = await executePipeline(await loadPipelineFile(pipelineFile));
    expect(report.steps[0]?.kind).toBe("normalize");
    expect(report.outputMedia?.video[0]).toMatchObject({ width: 320, height: 180, pixelFormat: "yuv420p" });
  }, 120_000);
});
