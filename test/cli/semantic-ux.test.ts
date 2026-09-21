import { describe, expect, it } from "vitest";

import { buildProgram } from "../../src/cli/program.js";
import { colorizeError, colorizeHumanOutput, colorizeWarning } from "../../src/cli/colors.js";
import { CLI_ICONS, decorateCommandDescription } from "../../src/cli/icons.js";
import { CliProgressReporter, formatHumanProgress } from "../../src/cli/progress-renderer.js";

describe("Semantic human UX", () => {
  const event = {
    runId: "ffmpeg-1",
    state: "continue" as const,
    estimated: true,
    source: "/tmp/clip.mp4",
    percentage: 67,
    frame: 2411,
    fps: 100,
    speedMultiplier: 3.7,
    etaSeconds: 12,
  };

  it("adds domain icons to human command descriptions", () => {
    const video = decorateCommandDescription("cecilia-ffmpeg video", "Video operations.");
    expect(video).toContain("🎬");
    expect(video).toContain("Video operations.");

    const stream = decorateCommandDescription("cecilia-ffmpeg stream camera", "Capture.");
    expect(stream).toContain("📡");
    expect(stream).toContain("Capture.");
  });

  it("keeps plain progress machine/log friendly", () => {
    expect(formatHumanProgress(event, false))
      .toBe("clip.mp4 | 67% | frame 2411 | 100.0 fps | 3.70x | ETA 00:00:12");
  });

  it("renders friendly semantic progress for a TTY", () => {
    const line = formatHumanProgress(event, true);
    for (const token of [CLI_ICONS.video, CLI_ICONS.progress, CLI_ICONS.frame, CLI_ICONS.fps, CLI_ICONS.speed, CLI_ICONS.eta]) {
      expect(line).toContain(token);
    }
  });

  it("never adds emoji or ANSI to non-friendly progress reporter output", () => {
    const output: string[] = [];
    const reporter = new CliProgressReporter({
      enabled: true,
      isTTY: false,
      friendly: false,
      write: (text) => output.push(text),
    });
    reporter.onEvent({ ...event, state: "end", percentage: 100, etaSeconds: 0 });
    expect(output.join("")).not.toContain("\u001b[");
    expect(output.join("")).not.toContain("🎬");
    expect(output.join("")).toContain("100%");
  });

  it("adds visible semantic icons only in decorated human summaries", () => {
    const plain = "video upscale\nInput: clip.mp4\nOutput: out.mp4\nResolution: 1920x1080";
    expect(colorizeHumanOutput(plain, false)).toBe(plain);
    const decorated = colorizeHumanOutput(plain, true);
    expect(decorated).toContain("🎬");
    expect(decorated).toContain("📥");
    expect(decorated).toContain("📦");
    expect(decorated).toContain("📐");
    expect(decorated).toContain("\u001b[");
  });

  it("uses warning/error icons only in decorated human mode", () => {
    expect(colorizeWarning("W_TEST", "warning", false)).toBe("warning [W_TEST]: warning");
    expect(colorizeError("E_TEST", "error", false)).toBe("error [E_TEST]: error");
    expect(colorizeWarning("W_TEST", "warning", true)).toContain("⚠️");
    expect(colorizeError("E_TEST", "error", true)).toContain("❌");
  });

  it("still constructs the command tree after semantic decoration changes", () => {
    expect(buildProgram().commands.length).toBeGreaterThan(0);
  });
});
