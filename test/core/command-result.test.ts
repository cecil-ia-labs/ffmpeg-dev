import { describe, expect, it } from "vitest";

import { runCommand } from "../../src/core/command-result.js";

describe("runCommand", () => {
  it("captures stdout, stderr, exit code, and timing", async () => {
    const result = await runCommand({
      binary: process.execPath,
      args: ["-e", 'console.log("hello"); console.error("warn")'],
    });

    expect(result.executed).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hello");
    expect(result.stderr).toContain("warn");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("never executes in dry-run mode", async () => {
    const result = await runCommand(
      { binary: process.execPath, args: ["-e", "process.exit(23)"] },
      { dryRun: true },
    );

    expect(result.executed).toBe(false);
    expect(result.exitCode).toBe(0);
  });

  it("returns non-zero process exits without reclassifying them", async () => {
    const result = await runCommand({
      binary: process.execPath,
      args: ["-e", "process.exit(9)"],
    });

    expect(result.exitCode).toBe(9);
  });

  it("supports cancellation through AbortSignal", async () => {
    const controller = new AbortController();
    const promise = runCommand(
      { binary: process.execPath, args: ["-e", "setTimeout(() => {}, 10000)"] },
      { signal: controller.signal, abortGraceMs: 50 },
    );

    setTimeout(() => controller.abort(new Error("test abort")), 50);

    await expect(promise).rejects.toMatchObject({ code: "E_ABORTED" });
  });
});
