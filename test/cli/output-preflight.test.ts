import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";

import { globalCliOptionsSchema } from "../../src/cli/global-options.js";
import { preflightExplicitCliOutput } from "../../src/cli/output-preflight.js";

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map(async (directory) =>
    await rm(directory, { recursive: true, force: true }),
  ));
});

function trimCommand(): Command {
  const root = new Command().name("cecilia-ffmpeg");
  const video = root.command("video");
  return video.command("trim <input>");
}

describe("CLI output preflight", () => {
  it("rejects an existing explicit output before the action runs", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-cli-output-preflight-"));
    workspaces.push(workspace);
    const output = path.join(workspace, "existing.mp4");
    await writeFile(output, "existing");

    const options = globalCliOptionsSchema.parse({ output });
    await expect(preflightExplicitCliOutput(trimCommand(), options))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });

  it("allows an existing explicit output when overwrite is enabled", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-cli-output-overwrite-"));
    workspaces.push(workspace);
    const output = path.join(workspace, "existing.mp4");
    await writeFile(output, "existing");

    const options = globalCliOptionsSchema.parse({ output, overwrite: true });
    await expect(preflightExplicitCliOutput(trimCommand(), options)).resolves.toBeUndefined();
  });

  it("does not apply the generic path rule to pipeline output overrides", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "cecilia-cli-pipeline-preflight-"));
    workspaces.push(workspace);
    const output = path.join(workspace, "existing.mp4");
    await writeFile(output, "existing");

    const root = new Command().name("cecilia-ffmpeg");
    const pipeline = root.command("pipeline [tokens...]");
    const options = globalCliOptionsSchema.parse({ output });

    await expect(preflightExplicitCliOutput(pipeline, options)).resolves.toBeUndefined();
  });
});
