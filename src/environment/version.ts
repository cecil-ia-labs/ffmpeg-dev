import { runFFmpeg } from "../core/ffmpeg-runner.js";
import { runFFprobe } from "../core/ffprobe-runner.js";
import { isVersionAtLeast, parseBinaryVersionLine, type BinaryVersion } from "../core/capabilities.js";
import { ToolkitRuntimeError } from "../core/errors.js";
import type { CommandExecution, ToolkitWarning } from "../types/contracts.js";

export const MINIMUM_FFMPEG_VERSION = { major: 6, minor: 1, patch: 0 } as const;
export const MINIMUM_FFMPEG_VERSION_LABEL = "6.1" as const;

export interface BinaryVersionReport {
  path: string;
  version?: BinaryVersion;
  execution: CommandExecution;
}

export interface EnvironmentVersionReport {
  planned: boolean;
  minimumSupportedFFmpeg: string;
  ffmpeg: BinaryVersionReport;
  ffprobe: BinaryVersionReport;
  compatible?: boolean;
  warnings: ToolkitWarning[];
}

export interface InspectVersionOptions {
  ffmpegPath?: string;
  ffprobePath?: string;
  dryRun?: boolean;
  verbose?: boolean;
  signal?: AbortSignal;
}

function parseVersion(execution: CommandExecution, product: "ffmpeg" | "ffprobe"): BinaryVersion {
  const firstLine = execution.stdout?.split(/\r?\n/).find((line) => line.trim().length > 0);
  const parsed = firstLine ? parseBinaryVersionLine(firstLine) : undefined;
  if (!parsed || parsed.product !== product) {
    throw new ToolkitRuntimeError(
      "E_INTERNAL_INVARIANT",
      `Unable to parse ${product} version output.`,
      { details: { product, firstLine: firstLine ?? null } },
    );
  }
  return parsed;
}

export async function inspectEnvironmentVersions(
  options: InspectVersionOptions = {},
): Promise<EnvironmentVersionReport> {
  const runOptions = {
    ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
    ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  };

  const [ffmpegExecution, ffprobeExecution] = await Promise.all([
    runFFmpeg(["-version"], {
      ...runOptions,
      ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
    }),
    runFFprobe(["-version"], {
      ...runOptions,
      ...(options.ffprobePath !== undefined ? { ffprobePath: options.ffprobePath } : {}),
    }),
  ]);

  const planned = !ffmpegExecution.executed || !ffprobeExecution.executed;
  const warnings: ToolkitWarning[] = [];

  const ffmpegVersion = planned ? undefined : parseVersion(ffmpegExecution, "ffmpeg");
  const ffprobeVersion = planned ? undefined : parseVersion(ffprobeExecution, "ffprobe");
  const compatible = ffmpegVersion === undefined
    ? undefined
    : isVersionAtLeast(ffmpegVersion, MINIMUM_FFMPEG_VERSION);

  if (ffmpegVersion && ffprobeVersion &&
      ffmpegVersion.major !== undefined && ffprobeVersion.major !== undefined &&
      (ffmpegVersion.major !== ffprobeVersion.major || ffmpegVersion.minor !== ffprobeVersion.minor)) {
    warnings.push({
      code: "W_ENV_VERSION_MISMATCH",
      message: "FFmpeg and FFprobe report different major/minor versions.",
      details: { ffmpeg: ffmpegVersion.version, ffprobe: ffprobeVersion.version },
    });
  }

  if (compatible === undefined && ffmpegVersion !== undefined) {
    warnings.push({
      code: "W_ENV_VERSION_UNPARSEABLE",
      message: "FFmpeg version does not expose a comparable numeric major/minor prefix.",
      details: { version: ffmpegVersion.version },
    });
  }

  return {
    planned,
    minimumSupportedFFmpeg: MINIMUM_FFMPEG_VERSION_LABEL,
    ffmpeg: {
      path: ffmpegExecution.binary,
      ...(ffmpegVersion !== undefined ? { version: ffmpegVersion } : {}),
      execution: ffmpegExecution,
    },
    ffprobe: {
      path: ffprobeExecution.binary,
      ...(ffprobeVersion !== undefined ? { version: ffprobeVersion } : {}),
      execution: ffprobeExecution,
    },
    ...(compatible !== undefined ? { compatible } : {}),
    warnings,
  };
}
