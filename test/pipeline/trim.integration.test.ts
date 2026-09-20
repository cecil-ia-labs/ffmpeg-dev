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

describe("pipeline trim step", () => {
  it("executes a declarative trim as the first real pipeline operation", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-trim-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");
    await writeFile(pipelineFile, [
      "version: 1",
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - trim:",
      "      start: 0",
      "      duration: 1",
      "output:",
      "  path: trimmed.mp4",
      "  codec: h264",
      "",
    ].join("\n"));

    const loaded = await loadPipelineFile(pipelineFile);
    const report = await executePipeline(loaded);

    expect(report.planned).toBe(false);
    expect(report.stepCount).toBe(1);
    expect(report.steps[0]).toMatchObject({ kind: "trim", planned: false });
    expect(report.output).toBe(path.join(workspace, "trimmed.mp4"));
    expect(report.outputMedia?.video[0]?.codecName).toBe("h264");
  }, 120_000);

  it("plans without mutating media during pipeline dry-run", async () => {
    if (!available) return;
    const input = await fixturePath("mp4-h264-aac");
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-pipeline-plan-test-"));
    workspaces.push(workspace);
    const pipelineFile = path.join(workspace, "pipeline.yaml");
    await writeFile(pipelineFile, [
      `input: ${JSON.stringify(input)}`,
      "steps:",
      "  - trim:",
      "      start: 0.25",
      "output:",
      "  path: planned.mp4",
      "",
    ].join("\n"));

    const loaded = await loadPipelineFile(pipelineFile);
    const report = await executePipeline(loaded, { dryRun: true });
    expect(report.planned).toBe(true);
    expect(report.steps[0]).toMatchObject({ kind: "trim", planned: true });
  }, 120_000);
});
