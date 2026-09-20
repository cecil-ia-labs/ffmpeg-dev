import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";

describe("Milestone 8 CLI", () => {
  it("registers diagnose and repair commands", () => {
    const program = buildProgram();
    const diagnose = program.commands.find((command) => command.name() === "diagnose");
    const repair = program.commands.find((command) => command.name() === "repair");
    expect(diagnose).toBeDefined();
    expect(repair?.commands.map((command) => command.name())).toEqual(expect.arrayContaining(["timestamps", "normalize"]));
  });
});
