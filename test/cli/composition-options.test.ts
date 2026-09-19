import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";

describe("Milestone 7 CLI options", () => {
  it("registers concat, transition and slideshow options", () => {
    const program = buildProgram();
    const compose = program.commands.find((command) => command.name() === "compose");
    expect(compose).toBeDefined();
    const concat = compose?.commands.find((command) => command.name() === "concat");
    const transition = compose?.commands.find((command) => command.name() === "transition");
    const slideshow = compose?.commands.find((command) => command.name() === "slideshow");
    expect(concat?.options.some((option) => option.long === "--transition-duration")).toBe(true);
    expect(concat?.options.some((option) => option.long === "--fit")).toBe(true);
    expect(concat?.options.some((option) => option.long === "--to")).toBe(true);
    expect(transition?.options.some((option) => option.long === "--offset")).toBe(true);
    expect(slideshow?.options.some((option) => option.long === "--direction")).toBe(true);
    expect(slideshow?.options.some((option) => option.long === "--style")).toBe(true);
    expect(slideshow?.options.some((option) => option.long === "--include")).toBe(true);
    expect(slideshow?.options.some((option) => option.long === "--exclude")).toBe(true);
    expect(slideshow?.options.some((option) => option.long === "--to")).toBe(true);
  });
});
