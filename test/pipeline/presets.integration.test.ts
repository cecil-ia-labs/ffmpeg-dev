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

describe("pipeline preset execution", () => {
  it("executes a named preset inline with surrounding steps", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-preset-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");

    await writeFile(pipelineFile, [
      `input: ${JSON.stringify(input)}`,
      "presets:",
      "  social-360p:",
      "    - resize:",
      "        width: 640",
      "        height: 360",
      "    - speed:",
      "        factor: 1.05",
      "steps:",
      "  - trim:",
      "      start: 0",
      "      duration: 0.5",
      "  - preset: social-360p",
      "output:",
      "  path: preset-result.mp4",
      "",
    ].join("\n"));

    const report = await executePipeline(await loadPipelineFile(pipelineFile));
    expect(report.stepCount).toBe(3);
    expect(report.steps.map((step) => step.kind)).toEqual(["trim", "resize", "speed"]);
    expect(report.outputMedia?.video[0]).toMatchObject({ width: 640, height: 360 });
  }, 120_000);
});
