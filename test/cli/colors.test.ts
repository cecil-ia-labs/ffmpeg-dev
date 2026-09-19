import { describe, expect, it } from "vitest";

import {
  colorEnabled,
  colorizeError,
  colorizeHumanOutput,
  colorizeWarning,
} from "../../src/cli/colors.js";

describe("CLI colors", () => {
  it("enables color only for TTY by default", () => {
    expect(colorEnabled(true, { isTTY: true }, {})).toBe(true);
    expect(colorEnabled(true, { isTTY: false }, {})).toBe(false);
    expect(colorEnabled(false, { isTTY: true }, {})).toBe(false);
  });

  it("honors NO_COLOR and FORCE_COLOR", () => {
    expect(colorEnabled(true, { isTTY: true }, { NO_COLOR: "1" })).toBe(false);
    expect(colorEnabled(true, { isTTY: false }, { FORCE_COLOR: "1" })).toBe(true);
    expect(colorEnabled(true, { isTTY: true }, { FORCE_COLOR: "0" })).toBe(false);
  });

  it("colors human stdout without changing plain mode", () => {
    const plain = "convert-file\nInput:  source.mp4\nOutput: out.webm\nResult: 160x90";
    expect(colorizeHumanOutput(plain, false)).toBe(plain);

    const colored = colorizeHumanOutput(plain, true);
    expect(colored).toContain("\u001b[");
    expect(colored).toContain("convert-file");
    expect(colored).toContain("Output:");
    expect(colored).toContain("Result:");
  });

  it("colors warning and error prefixes only in human color mode", () => {
    expect(colorizeWarning("W_TEST", "warning", false)).toBe("warning [W_TEST]: warning");
    expect(colorizeError("E_TEST", "error", false)).toBe("error [E_TEST]: error");
    expect(colorizeWarning("W_TEST", "warning", true)).toContain("\u001b[");
    expect(colorizeError("E_TEST", "error", true)).toContain("\u001b[");
  });
});
