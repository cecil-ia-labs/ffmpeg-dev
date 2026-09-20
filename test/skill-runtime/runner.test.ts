import { describe, expect, it } from "vitest";

import { ToolkitRuntimeError } from "../../src/core/errors.js";
import { runSkillScript } from "../../src/skill-runtime/runner.js";

describe("Skill script runner", () => {
  it("emits one stable success envelope and redacts sensitive input keys", async () => {
    const output: string[] = [];
    const exitCode = await runSkillScript({
      operation: "test.inspect",
      request: {
        context: "codex",
        input: { path: "clip.mp4", apiKey: "do-not-print" },
      },
      writeStdout: (value) => output.push(value),
      handler: async ({ context }) => ({
        input: { path: "clip.mp4", apiKey: "do-not-print" },
        output: { context: context.name },
      }),
    });

    expect(exitCode).toBe(0);
    expect(output).toHaveLength(1);
    const envelope = JSON.parse(output[0] ?? "") as Record<string, unknown>;
    expect(envelope).toMatchObject({
      schemaVersion: "1.0",
      ok: true,
      operation: "test.inspect",
      status: "completed",
      context: "codex",
      warnings: [],
      artifacts: [],
      next: [],
    });
    expect(envelope["input"]).toEqual({ path: "clip.mp4", apiKey: "[redacted]" });
  });

  it("serializes typed failures and supports an externally cancelled signal", async () => {
    const output: string[] = [];
    const controller = new AbortController();
    controller.abort(new Error("cancelled by test"));
    const exitCode = await runSkillScript({
      operation: "test.cancel",
      request: { context: "codex" },
      signal: controller.signal,
      writeStdout: (value) => output.push(value),
      handler: async ({ signal }) => {
        if (signal.aborted) throw new ToolkitRuntimeError("E_ABORTED", "cancelled");
        return {};
      },
    });

    expect(exitCode).toBe(130);
    expect(JSON.parse(output[0] ?? "")).toMatchObject({
      ok: false,
      status: "cancelled",
      error: { code: "E_ABORTED", retryable: true },
    });
  });
});
