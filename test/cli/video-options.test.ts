import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";

function findCommand(path: readonly string[]) {
  let current = buildProgram();
  for (const name of path) {
    const next = current.commands.find((command) => command.name() === name);
    if (!next) throw new Error(`Missing command ${name}`);
    current = next;
  }
  return current;
}

describe("Milestone 4 CLI options", () => {
  it("exposes trim-specific options", () => {
    const help = findCommand(["video", "trim-start"]).helpInformation();
    expect(help).toContain("--seconds");
    expect(help).toContain("--mode");
  });

  it("exposes speed and restore options", () => {
    expect(findCommand(["video", "speed"]).helpInformation()).toContain("--factor");
    const restoreHelp = findCommand(["video", "restore"]).helpInformation();
    expect(restoreHelp).toContain("--resolution");
    expect(restoreHelp).toContain("--profile");
  });
});
