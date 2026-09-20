import { describe, expect, it } from "vitest";

import { COMMAND_TREE, type CommandSpec } from "../../src/cli/command-spec.js";

function flatten(specs: readonly CommandSpec[], prefix = ""): string[] {
  return specs.flatMap((spec) => {
    const name = spec.syntax.split(" ", 1)[0] ?? spec.syntax;
    const path = prefix ? `${prefix} ${name}` : name;
    const children = spec.children ? flatten(spec.children, path) : [];
    return [path, ...children];
  });
}

describe("command tree", () => {
  it("contains representative domain leaves", () => {
    const commands = flatten(COMMAND_TREE);

    expect(commands).toContain("pipeline");
    expect(commands).not.toContain("run");
    expect(commands).toContain("video trim-start");
    expect(commands).toContain("audio telephony");
    expect(commands).toContain("video upscale");
    expect(commands).toContain("video attach-audio");
    expect(commands).toContain("image convert");
    expect(commands).toContain("image extract");
    expect(commands).toContain("convert batch");
    expect(commands).toContain("compose concat");
    expect(commands).toContain("repair timestamps");
    expect(commands).toContain("stream camera");
    expect(commands).toContain("environment check");
    expect(commands).toContain("environment install");
  });
});
