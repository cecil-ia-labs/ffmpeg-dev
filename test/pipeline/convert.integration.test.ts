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

describe("pipeline convert step", () => {
  it("changes container/codec at the end of a multi-step pipeline", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-convert-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");

    await writeFile(pipelineFile, [
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - trim:",
      "      start: 0",
      "      duration: 1",
      "  - convert:",
      "      to: webm",
      "      hardware: software",
      "output:",
      "  path: final.webm",
      "  codec: vp9",
      "",
    ].join("\n"));

    const report = await executePipeline(await loadPipelineFile(pipelineFile));

    expect(report.steps.map((step) => step.kind)).toEqual(["trim", "convert"]);
    expect(report.output).toBe(path.join(workspace, "final.webm"));
    expect(report.outputMedia?.video[0]?.codecName).toBe("vp9");
    expect(report.outputMedia?.audio[0]?.codecName).toBe("opus");
  }, 120_000);
});
