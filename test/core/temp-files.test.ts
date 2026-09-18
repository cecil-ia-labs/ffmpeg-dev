import { access } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { TemporaryWorkspace } from "../../src/core/temp-files.js";

describe("TemporaryWorkspace", () => {
  it("contains generated paths and removes itself", async () => {
    const workspace = await TemporaryWorkspace.create();
    const directory = workspace.directory;
    const nested = workspace.pathFor("nested/output.tmp");
    expect(nested.startsWith(directory)).toBe(true);

    await workspace.cleanup();
    await expect(access(directory)).rejects.toBeDefined();
  });

  it("rejects path traversal", async () => {
    const workspace = await TemporaryWorkspace.create();
    try {
      expect(() => workspace.pathFor("../outside.tmp")).toThrow(/escapes/);
    } finally {
      await workspace.cleanup();
    }
  });
});
