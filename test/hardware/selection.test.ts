import { describe, expect, it } from "vitest";

import {
  HARDWARE_RUNTIME_PROBE_SIZE,
  hardwareEncoderName,
  hardwareFilterSuffix,
  hardwareGlobalArgs,
  hardwareVideoEncodingArgs,
  preferredHardwareBackends,
  type HardwareEncodingSelection,
} from "../../src/hardware/index.js";
import { buildConversionPlan } from "../../src/conversion/profiles.js";
import type { MediaInfo } from "../../src/types/contracts.js";

const media: MediaInfo = {
  source: "/tmp/input.webm",
  format: {},
  streams: [],
  video: [{ index: 0, codecType: "video", codecName: "vp9", width: 640, height: 360 }],
  audio: [{ index: 1, codecType: "audio", codecName: "opus", sampleRate: 48000, channels: 2 }],
};

function selection(
  resolved: HardwareEncodingSelection["resolved"],
  codec: HardwareEncodingSelection["codec"],
  encoder: string,
): HardwareEncodingSelection {
  return {
    requested: resolved === "software" ? "software" : resolved,
    resolved,
    codec,
    encoder,
    softwareEncoder: codec === "h264" ? "libx264" : "libvpx-vp9",
    runtimeVerified: true,
    fallback: false,
    attempts: [],
    ...(resolved === "vaapi" ? { device: "/dev/dri/renderD128" } : {}),
  };
}

describe("Hardware selection primitives", () => {
  it("uses an encoder-safe runtime probe frame size", () => {
    expect(HARDWARE_RUNTIME_PROBE_SIZE).toBe("256x256");
  });

  it("maps compatible encoders and excludes unsupported backend/codec pairs", () => {
    expect(hardwareEncoderName("nvenc", "h264")).toBe("h264_nvenc");
    expect(hardwareEncoderName("qsv", "vp9")).toBe("vp9_qsv");
    expect(hardwareEncoderName("vaapi", "vp9")).toBe("vp9_vaapi");
    expect(hardwareEncoderName("nvenc", "vp9")).toBeUndefined();
    expect(hardwareEncoderName("videotoolbox", "vp9")).toBeUndefined();
  });

  it("uses platform-aware auto preference ordering", () => {
    expect(preferredHardwareBackends("linux", "h264").slice(0, 3)).toEqual(["nvenc", "qsv", "vaapi"]);
    expect(preferredHardwareBackends("darwin", "h264")[0]).toBe("videotoolbox");
    expect(preferredHardwareBackends("win32", "h264").slice(0, 2)).toEqual(["nvenc", "qsv"]);
    expect(preferredHardwareBackends("linux", "vp9")).toEqual(["qsv", "vaapi"]);
  });

  it("builds backend-specific encoder/filter/device arguments", () => {
    const nvenc = selection("nvenc", "h264", "h264_nvenc");
    expect(hardwareVideoEncodingArgs(nvenc).join(" ")).toContain("-c:v h264_nvenc");
    expect(hardwareVideoEncodingArgs(nvenc).join(" ")).toContain("-cq 23");

    const vaapi = selection("vaapi", "h264", "h264_vaapi");
    expect(hardwareGlobalArgs(vaapi)).toEqual(["-vaapi_device", "/dev/dri/renderD128"]);
    expect(hardwareFilterSuffix(vaapi)).toEqual(["format=nv12", "hwupload"]);

    const qsv = selection("qsv", "vp9", "vp9_qsv");
    expect(hardwareFilterSuffix(qsv)).toEqual(["format=nv12"]);
    expect(hardwareVideoEncodingArgs(qsv).join(" ")).toContain("-global_quality 28");
  });

  it("injects hardware encoding into typed conversion plans without changing audio policy", () => {
    const nvenc = selection("nvenc", "h264", "h264_nvenc");
    const mp4 = buildConversionPlan("/tmp/input.webm", "webm", "mp4", media, {}, nvenc);
    const command = mp4.argsBeforeOutput.join(" ");
    expect(command).toContain("-c:v h264_nvenc");
    expect(command).toContain("-c:a aac");
    expect(mp4.details).toMatchObject({
      codec: "h264_nvenc",
      hardware: {
        requested: "nvenc",
        resolved: "nvenc",
        runtimeVerified: true,
        fallback: false,
      },
    });
  });
});
