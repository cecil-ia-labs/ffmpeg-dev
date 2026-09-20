import { describe, expect, it } from "vitest";

import { buildProgram, CLI_HEADLINE } from "../../src/cli/program.js";

const expectedTopLevelCommands = [
  "doctor",
  "probe",
  "environment",
  "video",
  "image",
  "audio",
  "convert",
  "compose",
  "diagnose",
  "repair",
  "stream",
] as const;

describe("CLI help", () => {
  it("exposes the public top-level command grammar without running FFmpeg", () => {
    const program = buildProgram();
    const help = program.helpInformation();

    expect(help).toContain("cecilia-ffmpeg");
    expect(help).toContain(CLI_HEADLINE);
    for (const command of expectedTopLevelCommands) {
      expect(help).toContain(command);
    }
  });

  it("exposes every frozen global option", () => {
    const help = buildProgram().helpInformation();

    for (const flag of [
      "--output",
      "--overwrite",
      "--dry-run",
      "--json",
      "--quiet",
      "--verbose",
      "--no-progress",
      "--no-color",
      "--ffmpeg-path",
      "--ffprobe-path",
      "--keep-temp",
    ]) {
      expect(help).toContain(flag);
    }
  });
});
