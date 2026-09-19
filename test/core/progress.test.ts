import { describe, expect, it } from "vitest";

import {
  deriveProgressEvent,
  estimateProgressDuration,
  FFmpegProgressParser,
  parseClockSeconds,
  parseSpeedMultiplier,
} from "../../src/core/progress.js";

describe("FFmpeg progress", () => {
  it("parses incremental FFmpeg progress records", () => {
    const parser = new FFmpegProgressParser();
    expect(parser.push("frame=42\nfps=29.97\nout_time_us=1000000\n")).toEqual([]);
    const snapshots = parser.push("speed=1.2x\nprogress=continue\n");

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      frame: 42,
      fps: 29.97,
      outTimeUs: 1_000_000,
      speed: "1.2x",
      progress: "continue",
    });
  });

  it("derives percentage, speed multiplier, and ETA from a snapshot", () => {
    const parser = new FFmpegProgressParser();
    const [snapshot] = parser.push(
      "frame=120\nfps=60\nout_time_us=5000000\nspeed=2.0x\nprogress=continue\n",
    );
    expect(snapshot).toBeDefined();
    const event = deriveProgressEvent("ffmpeg-1", snapshot!, {
      source: "/tmp/clip.mp4",
      duration: { seconds: 10, source: "probe", estimated: true },
    });

    expect(event).toMatchObject({
      frame: 120,
      fps: 60,
      processedSeconds: 5,
      totalSeconds: 10,
      percentage: 50,
      speedMultiplier: 2,
      etaSeconds: 2.5,
      state: "continue",
      estimated: true,
    });
  });

  it("forces a completed progress record to 100 percent", () => {
    const parser = new FFmpegProgressParser();
    const [snapshot] = parser.push("out_time_us=9900000\nspeed=3.1x\nprogress=end\n");
    const event = deriveProgressEvent("ffmpeg-1", snapshot!, {
      duration: { seconds: 10, source: "explicit", estimated: false },
    });
    expect(event).toMatchObject({ percentage: 100, etaSeconds: 0, state: "end" });
  });

  it("parses numeric and clock durations and speed values", () => {
    expect(parseClockSeconds("12.5")).toBe(12.5);
    expect(parseClockSeconds("01:02:03.500")).toBe(3723.5);
    expect(parseSpeedMultiplier("3.7x")).toBe(3.7);
  });

  it("prefers an explicit output duration", () => {
    expect(estimateProgressDuration(
      ["-i", "/tmp/in.mp4", "-t", "00:00:08.500", "/tmp/out.mp4"],
      () => 20,
    )).toEqual({ seconds: 8.5, source: "explicit", estimated: false });
  });

  it("adjusts probe duration for a speed transform", () => {
    expect(estimateProgressDuration(
      ["-i", "/tmp/in.mp4", "-vf", "setpts=PTS/2", "/tmp/out.mp4"],
      (source) => source === "/tmp/in.mp4" ? 20 : undefined,
    )).toEqual({ seconds: 10, source: "probe", estimated: true });
  });

  it("estimates composition duration from inputs and xfade overlap", () => {
    expect(estimateProgressDuration(
      [
        "-i", "/tmp/a.mp4",
        "-i", "/tmp/b.mp4",
        "-filter_complex", "[0:v][1:v]xfade=transition=fade:duration=1:offset=4[v]",
        "/tmp/out.mp4",
      ],
      () => 5,
    )).toEqual({ seconds: 9, source: "composition", estimated: true });
  });
});
