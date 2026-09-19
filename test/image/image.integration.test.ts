import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { extractImage } from "../../src/image/index.js";
import { ensureFixtureMatrix, fixturePath } from "../helpers/fixture-matrix.js";

let available = false;
const directories: string[] = [];

beforeAll(async () => {
  available = await ensureFixtureMatrix();
}, 120_000);

afterEach(async () => {
  await Promise.all(directories.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

describe("image extraction integration", () => {
  it("extracts and resizes a JPEG frame from video", async () => {
    if (!available) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-image-"));
    directories.push(directory);
    const report = await extractImage(await fixturePath("mp4-h264-aac"), {
      at: 0.2,
      to: "jpeg",
      width: 96,
      height: 96,
      fit: "contain",
      background: "black",
      output: path.join(directory, "frame.jpg"),
    });

    expect(report.outputMedia?.video[0]).toMatchObject({
      codecName: "mjpeg",
      width: 96,
      height: 96,
    });
  }, 60_000);
});
