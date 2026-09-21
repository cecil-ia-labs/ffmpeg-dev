import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { convertBatch, discoverBatchInputs } from "../../src/conversion/batch.js";

describe("Batch discovery", () => {
  it("filters by extension, recursion, include, and exclude patterns", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-conversion-discovery-"));
    try {
      await mkdir(path.join(directory, "nested"));
      await writeFile(path.join(directory, "keep-root.mp4"), "fixture");
      await writeFile(path.join(directory, "skip-root.mp4"), "fixture");
      await writeFile(path.join(directory, "nested", "keep-child.mp4"), "fixture");
      await writeFile(path.join(directory, "nested", "ignore.webm"), "fixture");

      const flat = await discoverBatchInputs(directory, { from: "mp4", recursive: false });
      expect(flat.map((entry) => entry.relativeInput)).toEqual(["keep-root.mp4", "skip-root.mp4"]);

      const selected = await discoverBatchInputs(directory, {
        from: "mp4",
        recursive: true,
        includes: ["**/keep-*.mp4"],
        excludes: ["skip-*.mp4"],
      });
      expect(selected.map((entry) => entry.relativeInput)).toEqual(["keep-root.mp4", path.join("nested", "keep-child.mp4")]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects flattened output collisions before starting FFmpeg work", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-conversion-collision-"));
    try {
      await mkdir(path.join(directory, "a"));
      await mkdir(path.join(directory, "b"));
      await writeFile(path.join(directory, "a", "same.mp4"), "not-media");
      await writeFile(path.join(directory, "b", "same.mp4"), "not-media");

      await expect(convertBatch(directory, {
        from: "mp4",
        to: "webm",
        recursive: true,
        outputDirectory: path.join(directory, "out"),
        preserveHierarchy: false,
        dryRun: true,
      })).rejects.toMatchObject({ code: "E_CONFIG_CONFLICT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

});
