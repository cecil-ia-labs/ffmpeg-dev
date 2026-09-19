import { describe, expect, it } from "vitest";

import { ToolkitRuntimeError } from "../../src/core/errors.js";
import {
  createFailureEnvelope,
  createResultContext,
  createSuccessEnvelope,
} from "../../src/core/result-envelope.js";

describe("result envelopes", () => {
  it("creates schema-stable success output", () => {
    const context = createResultContext("test command", "req-1");
    const result = createSuccessEnvelope(context, { value: 42 }, {
      progress: {
        completedRuns: 1,
        runs: [{ runId: "ffmpeg-1", state: "end", estimated: true, percentage: 100 }],
      },
    });
    expect(result).toMatchObject({
      schemaVersion: "1.0",
      ok: true,
      command: "test command",
      requestId: "req-1",
      data: { value: 42 },
      error: null,
      progress: {
        completedRuns: 1,
        runs: [{ runId: "ffmpeg-1", state: "end", percentage: 100 }],
      },
    });
  });

  it("serializes typed failures", () => {
    const context = createResultContext("test command", "req-2");
    const result = createFailureEnvelope(
      context,
      new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", "not implemented"),
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "E_OPERATION_UNSUPPORTED", category: "operation" },
    });
  });
});
