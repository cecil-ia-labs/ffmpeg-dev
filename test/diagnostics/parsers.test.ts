import { describe, expect, it } from "vitest";

import { parseDecodeDiagnostics, parseFreezeDiagnostics } from "../../src/diagnostics/analyze.js";

describe("Milestone 8 diagnostics parsers", () => {
  it("classifies common decode and timestamp failures", () => {
    const issues = parseDecodeDiagnostics(`
      [mp4 @ 0x1] Non-monotonous DTS in output stream 0:0
      [h264 @ 0x2] error while decoding MB 4 2
      [mpegts @ 0x3] Packet corrupt (stream = 0, dts = 42)
    `);
    expect(issues.map((issue) => issue.code)).toEqual([
      "NON_MONOTONIC_DTS",
      "DECODE_ERROR",
      "CORRUPT_PACKET",
    ]);
  });

  it("parses freezedetect intervals", () => {
    const intervals = parseFreezeDiagnostics(`
      [freezedetect @ 0x1] lavfi.freezedetect.freeze_start: 1.52
      [freezedetect @ 0x1] lavfi.freezedetect.freeze_duration: 2.25
      [freezedetect @ 0x1] lavfi.freezedetect.freeze_end: 3.77
    `);
    expect(intervals).toEqual([{ start: 1.52, duration: 2.25, end: 3.77 }]);
  });
});
