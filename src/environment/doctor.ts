import os from "node:os";

import type { ToolkitWarning } from "../types/contracts.js";
import { inspectEnvironmentCapabilities, type EnvironmentCapabilities } from "./capabilities.js";
import { inspectEnvironmentVersions, type EnvironmentVersionReport } from "./version.js";

export type DoctorStatus = "ok" | "warning" | "error" | "planned";

export interface DoctorReport {
  status: DoctorStatus;
  planned: boolean;
  runtime: {
    platform: NodeJS.Platform;
    architecture: string;
    nodeVersion: string;
    hostname: string;
    cpus: number;
  };
  versions: EnvironmentVersionReport;
  capabilitySummary: {
    codecs: number;
    encoders: number;
    decoders: number;
    filters: number;
    hardwareMethods: string[];
    backends: EnvironmentCapabilities["hardwareAcceleration"]["backends"];
  };
  warnings: ToolkitWarning[];
}

export interface DoctorOptions {
  ffmpegPath?: string;
  ffprobePath?: string;
  dryRun?: boolean;
  verbose?: boolean;
  signal?: AbortSignal;
}

export async function inspectDoctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const shared = {
    ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
    ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  };

  const [versions, capabilities] = await Promise.all([
    inspectEnvironmentVersions({
      ...shared,
      ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
      ...(options.ffprobePath !== undefined ? { ffprobePath: options.ffprobePath } : {}),
    }),
    inspectEnvironmentCapabilities({
      ...shared,
      ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
    }),
  ]);

  const warnings = [...versions.warnings];
  let status: DoctorStatus = versions.planned || capabilities.planned ? "planned" : "ok";

  if (!versions.planned && versions.compatible === false) {
    status = "error";
    warnings.push({
      code: "W_ENV_UNSUPPORTED_FFMPEG",
      message: `FFmpeg ${versions.ffmpeg.version?.version ?? "unknown"} is below the supported minimum ${versions.minimumSupportedFFmpeg}.`,
    });
  } else if (status !== "planned" && warnings.length > 0) {
    status = "warning";
  }

  return {
    status,
    planned: versions.planned || capabilities.planned,
    runtime: {
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      hostname: os.hostname(),
      cpus: os.cpus().length,
    },
    versions,
    capabilitySummary: {
      codecs: capabilities.codecs.length,
      encoders: capabilities.encoders.length,
      decoders: capabilities.decoders.length,
      filters: capabilities.filters.length,
      hardwareMethods: capabilities.hardwareAcceleration.methods,
      backends: capabilities.hardwareAcceleration.backends,
    },
    warnings,
  };
}
