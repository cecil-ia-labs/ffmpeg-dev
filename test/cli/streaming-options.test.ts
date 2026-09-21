import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";

describe("Streaming CLI", () => {
  it("registers real stream camera and file commands", () => {
    const program = buildProgram();
    const stream = program.commands.find((command) => command.name() === "stream");
    expect(stream).toBeDefined();
    expect(stream?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["camera", "file"]),
    );

    const camera = stream?.commands.find((command) => command.name() === "camera");
    const file = stream?.commands.find((command) => command.name() === "file");
    expect(camera?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining(["--device", "--url", "--transport", "--video-codec"]),
    );
    expect(file?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining(["--url", "--transport", "--no-realtime"]),
    );
  });
});
