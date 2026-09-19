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

describe("Milestone 13.5 media capability CLI", () => {
  it("registers image convert and extract", () => {
    const convert = findCommand(["image", "convert"]).helpInformation();
    const extract = findCommand(["image", "extract"]).helpInformation();
    expect(convert).toContain("--to");
    expect(convert).toContain("--fit");
    expect(extract).toContain("--at");
    expect(extract).toContain("--to");
  });

  it("registers canonical video aliases", () => {
    expect(findCommand(["video", "upscale"]).helpInformation()).toContain("--resolution");
    expect(findCommand(["video", "attach-audio"]).helpInformation()).toContain("--mode");
    expect(findCommand(["video", "add-silence"]).helpInformation()).toContain("--sample-rate");
  });

  it("advertises expanded conversion controls", () => {
    const help = findCommand(["convert", "file"]).helpInformation();
    for (const value of ["jpeg/jpg", "wav", "mp3", "mp4", "--height", "--fit", "--audio-bitrate"]) {
      expect(help).toContain(value);
    }
  });

  it("advertises sequence slideshow controls", () => {
    const help = findCommand(["compose", "slideshow"]).helpInformation();
    for (const option of ["--style", "--transition", "--transition-duration", "--include", "--exclude", "--to", "--fit"]) {
      expect(help).toContain(option);
    }
  });
});
