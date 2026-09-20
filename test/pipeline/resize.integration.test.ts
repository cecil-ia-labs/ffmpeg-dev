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

describe("pipeline resize step", () => {
  it("chains speed -> resize through existing typed video domains", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-resize-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");

    await writeFile(pipelineFile, [
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - speed:",
      "      factor: 1.1",
      "  - resize:",
      "      width: 640",
      "      height: 360",
      "      fit: contain",
      "      profile: balanced",
      "      hardware: software",
      "output:",
      "  path: resized.mp4",
      "  codec: h264",
      "",
    ].join("\n"));

    const report = await executePipeline(await loadPipelineFile(pipelineFile));

    expect(report.steps.map((step) => step.kind)).toEqual(["speed", "resize"]);
    expect(report.outputMedia?.video[0]).toMatchObject({
      codecName: "h264",
      width: 640,
      height: 360,
    });
  }, 120_000);
});
