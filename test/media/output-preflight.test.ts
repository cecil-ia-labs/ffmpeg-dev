import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateSilence } from "../../src/audio/index.js";
import { concatMedia } from "../../src/composition/index.js";
import { convertFile } from "../../src/conversion/index.js";
import { normalizeMedia } from "../../src/diagnostics/index.js";
import { extractImage } from "../../src/image/index.js";
import { trimVideoStart } from "../../src/video/index.js";

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map(async (directory) =>
    await rm(directory, { recursive: true, force: true }),
  ));
});

async function workspace() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-output-preflight-domain-"));
  workspaces.push(directory);
  return directory;
}

async function invalidMedia(directory: string, name: string): Promise<string> {
  const file = path.join(directory, name);
  await writeFile(file, "deliberately invalid media");
  return file;
}

async function existingOutput(directory: string, name = "existing.mp4"): Promise<string> {
  const file = path.join(directory, name);
  await writeFile(file, "existing output");
  return file;
}

describe("cross-domain output preflight", () => {
  it("video fails on an existing destination before probing invalid media", async () => {
    const directory = await workspace();
    const input = await invalidMedia(directory, "input.mp4");
    const output = await existingOutput(directory);

    await expect(trimVideoStart(input, { seconds: 1, output }))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });

  it("conversion fails on an existing destination before probing invalid media", async () => {
    const directory = await workspace();
    const input = await invalidMedia(directory, "input.mp4");
    const output = await existingOutput(directory, "existing.webm");

    await expect(convertFile(input, { to: "webm", output }))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });

  it("composition fails on an existing destination before probing invalid inputs", async () => {
    const directory = await workspace();
    const left = await invalidMedia(directory, "left.mp4");
    const right = await invalidMedia(directory, "right.mp4");
    const output = await existingOutput(directory);

    await expect(concatMedia([left, right], { output }))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });

  it("image extraction fails on an existing destination before probing invalid media", async () => {
    const directory = await workspace();
    const input = await invalidMedia(directory, "input.mp4");
    const output = await existingOutput(directory, "frame.png");

    await expect(extractImage(input, { output }))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });

  it("repair fails on an existing explicit destination before probing invalid media", async () => {
    const directory = await workspace();
    const input = await invalidMedia(directory, "input.mp4");
    const output = await existingOutput(directory);

    await expect(normalizeMedia(input, { output }))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });

  it("generated audio fails immediately when its output already exists", async () => {
    const directory = await workspace();
    const output = await existingOutput(directory, "silence.wav");

    await expect(generateSilence({ output }))
      .rejects.toMatchObject({ code: "E_IO_OUTPUT_EXISTS" });
  });
});
