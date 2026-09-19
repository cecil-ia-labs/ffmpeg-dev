import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { convertFile } from "../../src/conversion/index.js";
import { ensureFixtureMatrix, fixturePath } from "../helpers/fixture-matrix.js";

let available = false;
const directories: string[] = [];

beforeAll(async () => {
  available = await ensureFixtureMatrix();
}, 120_000);

afterEach(async () => {
  await Promise.all(directories.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

describe("expanded audio conversion integration", () => {
  it("converts PCM WAV to MP3", async () => {
    if (!available) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-audio-convert-"));
    directories.push(directory);
    const report = await convertFile(await fixturePath("wav-pcm"), {
      to: "mp3",
      output: path.join(directory, "audio.mp3"),
      audioBitrate: "128k",
    });
    expect(report.outputMedia?.audio[0]?.codecName).toBe("mp3");
    expect(report.outputMedia?.video).toHaveLength(0);
  }, 60_000);

  it("extracts video audio to PCM WAV", async () => {
    if (!available) return;
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-audio-convert-"));
    directories.push(directory);
    const report = await convertFile(await fixturePath("mp4-h264-aac"), {
      to: "wav",
      output: path.join(directory, "audio.wav"),
    });
    expect(report.outputMedia?.audio[0]?.codecName).toBe("pcm_s16le");
    expect(report.outputMedia?.video).toHaveLength(0);
  }, 60_000);
});
