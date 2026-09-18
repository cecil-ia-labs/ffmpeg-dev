import { describe, expect, it } from "vitest";

import { normalizeFFprobeJson } from "../../src/media/ffprobe-normalizer.js";

describe("normalizeFFprobeJson", () => {
  it("normalizes format, video, audio, and numeric strings", () => {
    const media = normalizeFFprobeJson("/tmp/sample.mp4", {
      streams: [
        {
          index: 0,
          codec_name: "h264",
          codec_long_name: "H.264 / AVC",
          codec_type: "video",
          width: 1920,
          height: 1080,
          pix_fmt: "yuv420p",
          avg_frame_rate: "30/1",
          r_frame_rate: "30/1",
          time_base: "1/15360",
          duration: "2.500000",
          bit_rate: "900000",
        },
        {
          index: 1,
          codec_name: "aac",
          codec_type: "audio",
          sample_rate: "48000",
          channels: 2,
          channel_layout: "stereo",
          sample_fmt: "fltp",
        },
      ],
      format: {
        format_name: "mov,mp4,m4a,3gp,3g2,mj2",
        format_long_name: "QuickTime / MOV",
        duration: "2.500000",
        size: "123456",
        bit_rate: "1000000",
      },
    });

    expect(media.format).toMatchObject({ durationSeconds: 2.5, sizeBytes: 123456, bitrate: 1000000 });
    expect(media.video).toHaveLength(1);
    expect(media.video[0]).toMatchObject({ codecName: "h264", width: 1920, height: 1080, pixelFormat: "yuv420p" });
    expect(media.audio).toHaveLength(1);
    expect(media.audio[0]).toMatchObject({ codecName: "aac", sampleRate: 48000, channels: 2, channelLayout: "stereo" });
  });

  it("keeps unknown/non-A/V streams without unsafe casts in the public union", () => {
    const media = normalizeFFprobeJson("sample.mkv", {
      streams: [{ index: 3, codec_type: "subtitle", codec_name: "subrip" }],
      format: {},
    });
    expect(media.streams[0]).toMatchObject({ index: 3, codecType: "subtitle", codecName: "subrip" });
  });
});
