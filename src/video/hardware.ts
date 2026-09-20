import {
  selectHardwareEncoding,
  type HardwareEncodingSelection,
} from "../hardware/index.js";
import type { VideoOutputFormat, VideoRuntimeOptions } from "./types.js";

export async function resolveVideoHardware(
  format: VideoOutputFormat,
  request: VideoRuntimeOptions,
): Promise<HardwareEncodingSelection | undefined> {
  const mode = request.hardware ?? "software";
  if (mode === "software") return undefined;

  return await selectHardwareEncoding({
    codec: format === "mp4" ? "h264" : "vp9",
    hardware: mode,
    ...(request.hardwareDevice !== undefined ? { hardwareDevice: request.hardwareDevice } : {}),
    hardwareStrict: request.hardwareStrict ?? false,
    ...(request.ffmpegPath !== undefined ? { ffmpegPath: request.ffmpegPath } : {}),
    ...(request.cwd !== undefined ? { cwd: request.cwd } : {}),
    dryRun: request.dryRun ?? false,
    verbose: request.verbose ?? false,
    ...(request.signal !== undefined ? { signal: request.signal } : {}),
  });
}

export function hardwareReportDetails(
  selection: HardwareEncodingSelection | undefined,
): Record<string, unknown> {
  if (selection === undefined) return {};
  return {
    hardware: {
      requested: selection.requested,
      resolved: selection.resolved,
      encoder: selection.encoder,
      runtimeVerified: selection.runtimeVerified,
      fallback: selection.fallback,
      ...(selection.device !== undefined ? { device: selection.device } : {}),
      attempts: selection.attempts,
    },
  };
}
