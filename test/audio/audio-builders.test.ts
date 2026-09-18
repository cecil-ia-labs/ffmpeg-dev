import { describe, expect, it } from "vitest";

import { buildSilenceRemoveFilter } from "../../src/audio/remove-silence.js";
import { parseSilenceDetectOutput } from "../../src/audio/silence-detect.js";
import { resolveTelephonyProfile } from "../../src/audio/telephony.js";


describe("Milestone 5 audio builders", () => {
  it("parses FFmpeg silencedetect stderr into typed intervals", () => {
    const stderr = `
[silencedetect @ 0x1] silence_start: 0.302
[silencedetect @ 0x1] silence_end: 0.904 | silence_duration: 0.602
[silencedetect @ 0x1] silence_start: 1.202
[silencedetect @ 0x1] silence_end: 1.804 | silence_duration: 0.602
`;
    expect(parseSilenceDetectOutput(stderr)).toEqual([
      { start: 0.302, end: 0.904, duration: 0.602 },
      { start: 1.202, end: 1.804, duration: 0.602 },
    ]);
  });

  it("builds deterministic silenceremove configuration", () => {
    const filter = buildSilenceRemoveFilter(-30, 0.5, 0.05);
    expect(filter).toContain("start_threshold=-30dB");
    expect(filter).toContain("stop_periods=-1");
    expect(filter).toContain("stop_duration=0.5");
    expect(filter).toContain("stop_silence=0.05");
  });

  it("keeps G.711 mu-law and GSM profiles semantically distinct", () => {
    const mulaw = resolveTelephonyProfile({ codec: "mulaw" });
    expect(mulaw).toMatchObject({
      codec: "mulaw",
      ffmpegCodec: "pcm_mulaw",
      container: "wav",
      sampleRate: 8000,
      channels: 1,
    });

    const rawMulaw = resolveTelephonyProfile({ codec: "mulaw", output: "voice.ulaw" });
    expect(rawMulaw.container).toBe("mulaw");

    const gsm = resolveTelephonyProfile({ codec: "gsm" });
    expect(gsm).toMatchObject({
      codec: "gsm",
      ffmpegCodec: "libgsm",
      container: "gsm",
      sampleRate: 8000,
      channels: 1,
    });
  });
});
