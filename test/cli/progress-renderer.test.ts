import { describe, expect, it } from "vitest";

import {
  CliProgressReporter,
  formatHumanProgress,
  formatProgressDuration,
} from "../../src/cli/progress-renderer.js";

describe("CLI progress renderer", () => {
  it("formats deterministic human-readable metrics", () => {
    expect(formatProgressDuration(3723)).toBe("01:02:03");
    expect(formatHumanProgress({
      runId: "ffmpeg-1",
      state: "continue",
      estimated: true,
      source: "/tmp/clip.mp4",
      percentage: 67,
      frame: 2411,
      fps: 100,
      speedMultiplier: 3.7,
      etaSeconds: 12,
    })).toBe("clip.mp4 | 67% | frame 2411 | 100.0 fps | 3.70x | ETA 00:00:12");
  });

  it("throttles non-TTY output by percentage buckets and collects a summary", () => {
    const output: string[] = [];
    const reporter = new CliProgressReporter({
      enabled: true,
      isTTY: false,
      write: (text) => output.push(text),
    });

    reporter.onEvent({
      runId: "ffmpeg-1",
      state: "continue",
      estimated: true,
      source: "/tmp/clip.mp4",
      percentage: 1,
      processedSeconds: 0.1,
      totalSeconds: 10,
    });
    reporter.onEvent({
      runId: "ffmpeg-1",
      state: "continue",
      estimated: true,
      source: "/tmp/clip.mp4",
      percentage: 10,
      processedSeconds: 1,
      totalSeconds: 10,
    });
    reporter.onEvent({
      runId: "ffmpeg-1",
      state: "continue",
      estimated: true,
      source: "/tmp/clip.mp4",
      percentage: 26,
      processedSeconds: 2.6,
      totalSeconds: 10,
    });
    reporter.onEvent({
      runId: "ffmpeg-1",
      state: "end",
      estimated: true,
      source: "/tmp/clip.mp4",
      percentage: 100,
      processedSeconds: 10,
      totalSeconds: 10,
      etaSeconds: 0,
    });

    expect(output).toHaveLength(3);
    expect(reporter.summary()).toMatchObject({
      completedRuns: 1,
      runs: [{
        runId: "ffmpeg-1",
        state: "end",
        percentage: 100,
        etaSeconds: 0,
      }],
    });
  });
});
