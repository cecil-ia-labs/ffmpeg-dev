import {
  parseCodecTable,
  parseEncoderDecoderTable,
  parseFilterTable,
  parseHardwareAccelerators,
} from "../core/capabilities.js";
import { runFFmpeg } from "../core/ffmpeg-runner.js";
import { renderCommandForDisplay } from "../core/command-result.js";
import type {
  CodecCapability,
  EncoderDecoderCapability,
  FilterCapability,
  HardwareBackendCapability,
  HardwareAccelerationInfo,
} from "../types/contracts.js";

export interface EnvironmentCapabilities {
  planned: boolean;
  ffmpegPath: string;
  codecs: CodecCapability[];
  encoders: EncoderDecoderCapability[];
  decoders: EncoderDecoderCapability[];
  filters: FilterCapability[];
  hardwareAcceleration: HardwareAccelerationInfo;
  plannedCommands: string[];
}

export interface InspectCapabilitiesOptions {
  ffmpegPath?: string;
  dryRun?: boolean;
  verbose?: boolean;
  signal?: AbortSignal;
}

function capturedCapabilityText(execution: { stdout?: string; stderr?: string }): string {
  // FFmpeg capability tables are normally written to stdout, but packaging,
  // wrappers, and some downstream builds may route informational output to
  // stderr. Parse both streams; the table parsers ignore banners/legend noise.
  return [execution.stdout, execution.stderr]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join("\n");
}

function backend(
  name: HardwareBackendCapability["name"],
  methods: readonly string[],
  encoders: readonly EncoderDecoderCapability[],
  acceleratorMethods: readonly string[],
  suffixes: readonly string[],
): HardwareBackendCapability {
  const compiledEncoders = encoders
    .map((entry) => entry.name)
    .filter((encoderName) => suffixes.some((suffix) => encoderName.endsWith(suffix)));
  const reportedMethods = acceleratorMethods.filter((method) => methods.includes(method));
  return {
    name,
    compiled: compiledEncoders.length > 0 || (name !== "nvenc" && reportedMethods.length > 0),
    reportedMethods,
    encoders: compiledEncoders,
  };
}

function hardwareInfo(
  methods: string[],
  encoders: EncoderDecoderCapability[],
): HardwareAccelerationInfo {
  return {
    methods,
    backends: [
      backend("nvenc", methods, encoders, ["cuda"], ["_nvenc"]),
      backend("vaapi", methods, encoders, ["vaapi"], ["_vaapi"]),
      backend("qsv", methods, encoders, ["qsv"], ["_qsv"]),
      backend("videotoolbox", methods, encoders, ["videotoolbox"], ["_videotoolbox"]),
      backend("cuda", methods, encoders, ["cuda"], ["_cuda"]),
      backend("vulkan", methods, encoders, ["vulkan"], ["_vulkan"]),
      backend("opencl", methods, encoders, ["opencl"], ["_opencl"]),
    ],
    note: "Reported/compiled support does not prove that compatible hardware, drivers, or device permissions are available at runtime.",
  };
}

export async function inspectEnvironmentCapabilities(
  options: InspectCapabilitiesOptions = {},
): Promise<EnvironmentCapabilities> {
  const common = {
    ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
    ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
    ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
    maxCaptureBytes: 8 * 1024 * 1024,
  };

  const executions = await Promise.all([
    runFFmpeg(["-hide_banner", "-codecs"], common),
    runFFmpeg(["-hide_banner", "-encoders"], common),
    runFFmpeg(["-hide_banner", "-decoders"], common),
    runFFmpeg(["-hide_banner", "-filters"], common),
    runFFmpeg(["-hide_banner", "-hwaccels"], common),
  ]);

  const [codecExecution, encoderExecution, decoderExecution, filterExecution, hwExecution] = executions;
  if (!codecExecution || !encoderExecution || !decoderExecution || !filterExecution || !hwExecution) {
    throw new Error("Capability execution invariant failed.");
  }

  const planned = executions.some((execution) => !execution.executed);
  const codecs = planned ? [] : parseCodecTable(capturedCapabilityText(codecExecution));
  const encoders = planned ? [] : parseEncoderDecoderTable(capturedCapabilityText(encoderExecution), "encoder");
  const decoders = planned ? [] : parseEncoderDecoderTable(capturedCapabilityText(decoderExecution), "decoder");
  const filters = planned ? [] : parseFilterTable(capturedCapabilityText(filterExecution));
  const methods = planned ? [] : parseHardwareAccelerators(capturedCapabilityText(hwExecution));

  return {
    planned,
    ffmpegPath: codecExecution.binary,
    codecs,
    encoders,
    decoders,
    filters,
    hardwareAcceleration: hardwareInfo(methods, encoders),
    plannedCommands: planned
      ? executions.map((execution) => renderCommandForDisplay({ binary: execution.binary, args: execution.args }))
      : [],
  };
}
