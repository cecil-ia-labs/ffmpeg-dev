import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";
import { parsePipelineInvocation } from "../../src/pipeline/inline.js";

describe("pipeline CLI", () => {
  it("registers the namespaced pipeline command and removes top-level run", () => {
    const program = buildProgram();
    const run = program.commands.find((command) => command.name() === "run");
    const pipeline = program.commands.find((command) => command.name() === "pipeline");
    expect(run).toBeUndefined();
    expect(pipeline).toBeDefined();
    expect(pipeline?.usage()).toContain("[tokens...]");
    expect(pipeline?.description()).toContain("declarative");
  });

  it("parses file actions and inline steps into the same typed document", () => {
    expect(parsePipelineInvocation(["pipeline.yaml", "validate"])).toMatchObject({
      action: "validate",
      source: "file",
      file: "pipeline.yaml",
    });

    const inline = parsePipelineInvocation([
      "--step", "trim",
      "--input", "source.mp4",
      "--trim-start", "2",
      "--output", "trim.mp4",
      "--step", "convert",
      "--input", "trim.mp4",
      "--to", "webm",
      "--output", "final.webm",
      "run",
    ], { cwd: "/tmp/pipeline-workspace" });

    expect(inline.action).toBe("run");
    expect(inline.source).toBe("inline");
    expect(inline.document).toMatchObject({
      input: "source.mp4",
      output: { path: "final.webm" },
      steps: [{ trim: { start: 2 } }, { convert: { to: "webm" } }],
    });
  });
});
