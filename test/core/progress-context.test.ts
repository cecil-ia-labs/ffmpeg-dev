import { describe, expect, it } from "vitest";

import {
  progressMediaDuration,
  registerProgressMedia,
  withProgressObserver,
} from "../../src/core/progress-context.js";

describe("progress context", () => {
  it("keeps probed duration scoped to the active operation", async () => {
    expect(progressMediaDuration("/tmp/input.mp4")).toBeUndefined();

    await withProgressObserver(() => undefined, async () => {
      registerProgressMedia({
        source: "/tmp/input.mp4",
        format: { durationSeconds: 12.5 },
        streams: [],
        video: [],
        audio: [],
      });
      expect(progressMediaDuration("/tmp/input.mp4")).toBe(12.5);
    });

    expect(progressMediaDuration("/tmp/input.mp4")).toBeUndefined();
  });
});
