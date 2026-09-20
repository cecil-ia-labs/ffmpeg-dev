import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { inspectWritablePath, resolveSafePath } from "../../src/skill-runtime/paths.js";

describe("Skill script safe paths", () => {
  it("rejects traversal outside the declared workspace", () => {
    expect(() =>
      resolveSafePath("../outside.mp4", { cwd: "/tmp/workspace", root: "/tmp/workspace" }),
    ).toThrow(/escapes the allowed root/);
    expect(() => resolveSafePath("clip\0.mp4")).toThrow(/NUL/);
  });

  it("checks existing and new output paths without creating them", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-skill-path-"));
    const existing = path.join(directory, "existing.txt");
    const missing = path.join(directory, "missing.txt");
    try {
      await writeFile(existing, "fixture");
      await expect(inspectWritablePath(existing)).resolves.toMatchObject({
        exists: true,
        writable: true,
      });
      await expect(inspectWritablePath(missing)).resolves.toMatchObject({
        exists: false,
        writable: true,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
