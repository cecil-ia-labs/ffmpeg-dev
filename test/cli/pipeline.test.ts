import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";

describe("pipeline CLI", () => {
  it("registers the public run command", () => {
    const program = buildProgram();
    const run = program.commands.find((command) => command.name() === "run");
    expect(run).toBeDefined();
    expect(run?.usage()).toContain("<pipeline>");
    expect(run?.description()).toContain("declarative YAML");
  });
});
