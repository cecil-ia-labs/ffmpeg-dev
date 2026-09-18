import { describe, expect, it } from "vitest";

import {
  isVersionAtLeast,
  parseBinaryVersionLine,
  parseCodecTable,
  parseEncoderDecoderTable,
  parseFilterTable,
  parseHardwareAccelerators,
} from "../../src/core/capabilities.js";

describe("capability parsers", () => {
  it("parses semantic numeric version prefixes", () => {
    const parsed = parseBinaryVersionLine("ffmpeg version 7.1.5-0+deb13u1 Copyright");
    expect(parsed).toMatchObject({
      product: "ffmpeg",
      version: "7.1.5-0+deb13u1",
      major: 7,
      minor: 1,
      patch: 5,
    });
    expect(parsed && isVersionAtLeast(parsed, { major: 6, minor: 1 })).toBe(true);
  });

  it("parses encoder/decoder tables without legend rows", () => {
    const encoders = parseEncoderDecoderTable(
      "Encoders:\n V..... = Video\n V....D h264_nvenc NVIDIA NVENC H.264 encoder (codec h264)\n A..... aac AAC (Advanced Audio Coding)\n",
      "encoder",
    );
    expect(encoders.map((entry) => entry.name)).toEqual(["h264_nvenc", "aac"]);
    expect(encoders[0]).toMatchObject({ mediaType: "video", directRendering: true });
  });

  it("parses codec, filter, and hardware tables", () => {
    const codecs = parseCodecTable("Codecs:\n DEV.L. h264 H.264 / AVC\n");
    expect(codecs[0]).toMatchObject({ name: "h264", decoding: true, encoding: true, mediaType: "video", lossy: true });

    const filters = parseFilterTable("Filters:\n TSC overlay VV->V Overlay a video source on top of the input.\n");
    expect(filters[0]).toMatchObject({ name: "overlay", timelineSupport: true, sliceThreading: true, commandSupport: true });

    const portableFilters = parseFilterTable(
      "\u001b[32mFilters:\u001b[0m\n TSC overlay VV->V Overlay a video source on top of the input.\n ... anull A->A Pass the source unchanged.\n",
    );
    expect(portableFilters.map((entry) => entry.name)).toEqual(["overlay", "anull"]);

    expect(parseHardwareAccelerators("Hardware acceleration methods:\ncuda\nvaapi\nqsv\n")).toEqual(["cuda", "vaapi", "qsv"]);
  });
  it("parses FFmpeg 8 two-character filter capability flags", () => {
    const filters = parseFilterTable(`Filters:
  T.. = Timeline support
  .S. = Slice threading
  A = Audio input/output
  V = Video input/output
  N = Dynamic number and/or type of input/output
  | = Source or sink filter
 TS aap               AA->A      Apply Affine Projection algorithm to first audio stream.
 .. abench            A->A       Benchmark part of a filtergraph.
 .S acrossover        A->N       Split audio into per-bands streams.
 T. acrusher          A->A       Reduce audio bit resolution.
`);

    expect(filters.map((entry) => entry.name)).toEqual([
      "aap",
      "abench",
      "acrossover",
      "acrusher",
    ]);
    expect(filters[0]).toMatchObject({ flags: "TS", timelineSupport: true, sliceThreading: true, commandSupport: false });
    expect(filters[1]).toMatchObject({ flags: "..", timelineSupport: false, sliceThreading: false, commandSupport: false });
    expect(filters[2]).toMatchObject({ flags: ".S", timelineSupport: false, sliceThreading: true, commandSupport: false });
    expect(filters[3]).toMatchObject({ flags: "T.", timelineSupport: true, sliceThreading: false, commandSupport: false });
  });

});
