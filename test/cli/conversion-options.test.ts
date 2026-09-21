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

describe("Conversion CLI options", () => {
  it("exposes single-file conversion controls", () => {
    const help = findCommand(["convert", "file"]).helpInformation();
    expect(help).toContain("--to");
    expect(help).toContain("--from");
    expect(help).toContain("--fps");
    expect(help).toContain("--quality");
    expect(help).toContain("--hardware");
    expect(help).toContain("--hardware-device");
    expect(help).toContain("--hardware-strict");
  });

  it("exposes generic batch selection and failure controls", () => {
    const help = findCommand(["convert", "batch"]).helpInformation();
    for (const option of [
      "--recursive",
      "--include",
      "--exclude",
      "--parallelism",
      "--fail-fast",
      "--continue-on-error",
      "--output-dir",
      "--no-preserve-hierarchy",
      "--existing",
      "--hardware",
      "--hardware-device",
      "--hardware-strict",
    ]) {
      expect(help).toContain(option);
    }
  });
});
