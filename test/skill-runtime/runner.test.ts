import { describe, expect, it } from "vitest";

import { ToolkitRuntimeError } from "../../src/core/errors.js";
import { runSkillScript } from "../../src/skill-runtime/runner.js";
import { reportResult } from "../../src/skill-scripts/shared.js";

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

  it("keeps plans and validation reports from claiming verified artifacts", () => {
    const validation = reportResult(
      { action: "validate" },
      { operation: "pipeline.validate", output: "/tmp/missing.mp4" },
    );
    expect(validation.artifacts).toEqual([]);

    const plan = reportResult(
      { action: "silence" },
      { operation: "silence", output: "/tmp/planned.wav", planned: true },
    );
    expect(plan.status).toBe("planned");
    expect(plan.artifacts).toEqual([
      { kind: "file", path: "/tmp/planned.wav", verified: false },
    ]);
  });

  it("turns a partial batch into a failed Skill envelope", async () => {
    const output: string[] = [];
    const exitCode = await runSkillScript({
      operation: "conversion.run",
      request: { context: "codex" },
      writeStdout: (value) => output.push(value),
      handler: async () => reportResult(
        { action: "batch" },
        {
          operation: "convert-batch",
          directory: "/tmp/input",
          outputDirectory: "/tmp/output",
          planned: false,
          discovered: 2,
          attempted: 2,
          succeeded: 1,
          failed: 1,
          skipped: 0,
          items: [
            { input: "bad.mp4", output: "bad.webm", status: "failed", error: { code: "E_PROBE_FAILED" } },
          ],
        },
      ),
    });

    expect(exitCode).toBe(7);
    expect(JSON.parse(output[0] ?? "")).toMatchObject({
      ok: false,
      status: "failed",
      error: { code: "E_BATCH_PARTIAL_FAILURE" },
      artifacts: [],
    });
  });
});
