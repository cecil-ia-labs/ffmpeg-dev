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

describe("Audio CLI options", () => {
  it("exposes attach and silence generation options", () => {
    const attach = findCommand(["audio", "attach"]).helpInformation();
    expect(attach).toContain("--mode");
    expect(attach).toContain("--video-mode");
    expect(attach).toContain("--no-pad");

    const silence = findCommand(["audio", "silence"]).helpInformation();
    expect(silence).toContain("--duration");
    expect(silence).toContain("--sample-rate");
    expect(silence).toContain("--channels");
  });

  it("exposes silence analysis and telephony options", () => {
    const detect = findCommand(["audio", "detect-silence"]).helpInformation();
    expect(detect).toContain("--noise-db");
    expect(detect).toContain("--min-duration");

    const telephony = findCommand(["audio", "telephony"]).helpInformation();
    expect(telephony).toContain("--codec");
    expect(telephony).toContain("--container");
    expect(telephony).toContain("--sample-format");
  });
});
