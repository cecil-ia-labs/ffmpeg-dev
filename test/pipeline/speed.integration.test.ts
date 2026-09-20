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

describe("pipeline speed step", () => {
  it("chains trim -> speed through a real intermediate artifact", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-speed-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");

    await writeFile(pipelineFile, [
      "version: 1",
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - trim:",
      "      start: 0",
      "      duration: 0.5",
      "  - speed:",
      "      factor: 1.5",
      "      audio: sync",
      "output:",
      "  path: accelerated.mp4",
      "  codec: h264",
      "",
    ].join("\n"));

    const report = await executePipeline(await loadPipelineFile(pipelineFile));

    expect(report.stepCount).toBe(2);
    expect(report.steps.map((step) => step.kind)).toEqual(["trim", "speed"]);
    expect(report.steps.every((step) => step.planned === false)).toBe(true);
    expect(report.outputMedia?.video[0]?.codecName).toBe("h264");
    expect(report.outputMedia?.format.durationSeconds).toBeLessThan(0.5);
  }, 120_000);
});
