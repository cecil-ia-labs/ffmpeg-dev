import type { Command } from "commander";

import { exitCodeForError, ToolkitRuntimeError } from "../../core/index.js";
import { inspectDoctor, type DoctorReport } from "../../environment/doctor.js";
import { inspectEnvironmentCapabilities, type EnvironmentCapabilities } from "../../environment/capabilities.js";
import { inspectEnvironmentVersions, type EnvironmentVersionReport } from "../../environment/version.js";
import { probeMedia, type ProbeReport } from "../../media/probe.js";
import type { MediaStream } from "../../types/contracts.js";
import { executeAction } from "./shared.js";

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) return "unknown";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unit = 0;
  while (Math.abs(value) >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) return "unknown";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
}

function wrapNames(names: readonly string[], indent = "  ", width = 100): string[] {
  if (names.length === 0) return [`${indent}(none)`];
  const lines: string[] = [];
  let current = indent;
  for (const name of names) {
    const piece = current.trim().length === 0 ? name : `${current === indent ? "" : ", "}${name}`;
    if (current.length + piece.length > width && current !== indent) {
      lines.push(current);
      current = `${indent}${name}`;
    } else {
      current += piece;
    }
  }
  if (current !== indent) lines.push(current);
  return lines;
}

function renderVersions(report: EnvironmentVersionReport): string {
  if (report.planned) {
    return [
      "Environment version inspection (dry run)",
      `FFmpeg:  ${report.ffmpeg.path}`,
      `FFprobe: ${report.ffprobe.path}`,
      `Minimum supported FFmpeg: ${report.minimumSupportedFFmpeg}`,
    ].join("\n");
  }
  return [
    "Environment versions",
    `FFmpeg:  ${report.ffmpeg.version?.version ?? "unknown"} (${report.ffmpeg.path})`,
    `FFprobe: ${report.ffprobe.version?.version ?? "unknown"} (${report.ffprobe.path})`,
    `Minimum supported FFmpeg: ${report.minimumSupportedFFmpeg}`,
    `Compatible: ${report.compatible === undefined ? "unknown" : report.compatible ? "yes" : "no"}`,
  ].join("\n");
}

function renderCapabilities(report: EnvironmentCapabilities): string {
  if (report.planned) {
    return ["Capability inspection (dry run)", ...report.plannedCommands.map((command) => `  ${command}`)].join("\n");
  }
  const lines = [
    `FFmpeg: ${report.ffmpegPath}`,
    `Codecs (${report.codecs.length})`,
    ...wrapNames(report.codecs.map((item) => item.name)),
    `Encoders (${report.encoders.length})`,
    ...wrapNames(report.encoders.map((item) => item.name)),
    `Decoders (${report.decoders.length})`,
    ...wrapNames(report.decoders.map((item) => item.name)),
    `Filters (${report.filters.length})`,
    ...wrapNames(report.filters.map((item) => item.name)),
    `Hardware acceleration methods (${report.hardwareAcceleration.methods.length})`,
    ...wrapNames(report.hardwareAcceleration.methods),
    "Hardware backend summary",
  ];
  for (const backend of report.hardwareAcceleration.backends) {
    lines.push(`  ${backend.name}: ${backend.compiled ? "reported/compiled" : "not reported"}`);
    if (backend.encoders.length > 0) lines.push(`    encoders: ${backend.encoders.join(", ")}`);
  }
  lines.push(`Note: ${report.hardwareAcceleration.note}`);
  return lines.join("\n");
}

function renderDoctor(report: DoctorReport): string {
  const lines = [
    `FFmpeg Media Toolkit doctor: ${report.status.toUpperCase()}`,
    `Platform: ${report.runtime.platform} ${report.runtime.architecture}`,
    `Node: ${report.runtime.nodeVersion}`,
    `FFmpeg: ${report.versions.ffmpeg.version?.version ?? (report.planned ? "planned" : "unknown")}`,
    `  ${report.versions.ffmpeg.path}`,
    `FFprobe: ${report.versions.ffprobe.version?.version ?? (report.planned ? "planned" : "unknown")}`,
    `  ${report.versions.ffprobe.path}`,
    `Minimum FFmpeg: ${report.versions.minimumSupportedFFmpeg}`,
    `Capabilities: ${report.capabilitySummary.codecs} codecs, ${report.capabilitySummary.encoders} encoders, ${report.capabilitySummary.decoders} decoders, ${report.capabilitySummary.filters} filters`,
    `Hardware methods: ${report.capabilitySummary.hardwareMethods.join(", ") || "none reported"}`,
  ];
  for (const backend of report.capabilitySummary.backends) {
    if (backend.compiled) lines.push(`  ${backend.name}: ${backend.encoders.length > 0 ? backend.encoders.join(", ") : backend.reportedMethods.join(", ") || "reported"}`);
  }
  return lines.join("\n");
}

function streamLine(stream: MediaStream): string {
  const codec = stream.codecName ?? "unknown";
  if (stream.codecType === "video") {
    const dimensions = stream.width !== undefined && stream.height !== undefined ? `${stream.width}x${stream.height}` : "unknown-size";
    const fps = stream.averageFrameRate ?? stream.realFrameRate;
    return `#${stream.index} video ${codec} ${dimensions}${stream.pixelFormat ? ` ${stream.pixelFormat}` : ""}${fps ? ` fps=${fps}` : ""}`;
  }
  if (stream.codecType === "audio") {
    return `#${stream.index} audio ${codec}${stream.sampleRate ? ` ${stream.sampleRate}Hz` : ""}${stream.channels ? ` ${stream.channels}ch` : ""}${stream.channelLayout ? ` ${stream.channelLayout}` : ""}`;
  }
  return `#${stream.index} ${stream.codecType} ${codec}`;
}

function renderProbe(report: ProbeReport): string {
  if (report.planned) return `Probe dry run\n  ${report.invocation}`;
  const media = report.media;
  if (!media) return "Probe completed without normalized media information.";
  const lines = [
    `Source: ${media.source}`,
    `Format: ${media.format.formatLongName ?? media.format.formatName ?? "unknown"}`,
    `Duration: ${formatDuration(media.format.durationSeconds)}`,
    `Size: ${formatBytes(media.format.sizeBytes)}`,
    `Bitrate: ${media.format.bitrate !== undefined ? `${Math.round(media.format.bitrate / 1000)} kb/s` : "unknown"}`,
    `Streams (${media.streams.length})`,
    ...media.streams.map((stream) => `  ${streamLine(stream)}`),
  ];
  return lines.join("\n");
}

export async function runDoctorAction(command: Command): Promise<void> {
  await executeAction(command, async (options, signal) => {
    const report = await inspectDoctor({
      ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
      ...(options.ffprobePath !== undefined ? { ffprobePath: options.ffprobePath } : {}),
      dryRun: options.dryRun,
      verbose: options.verbose,
      signal,
    });
    return {
      data: report,
      warnings: report.warnings,
      ...(report.status === "error" ? { exitCode: exitCodeForError("E_ENV_UNSUPPORTED_FFMPEG") } : {}),
    };
  }, renderDoctor);
}

export async function runEnvironmentVersionAction(command: Command): Promise<void> {
  await executeAction(command, async (options, signal) => {
    const report = await inspectEnvironmentVersions({
      ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
      ...(options.ffprobePath !== undefined ? { ffprobePath: options.ffprobePath } : {}),
      dryRun: options.dryRun,
      verbose: options.verbose,
      signal,
    });
    return { data: report, warnings: report.warnings };
  }, renderVersions);
}

export async function runEnvironmentCapabilitiesAction(command: Command): Promise<void> {
  await executeAction(command, async (options, signal) => ({
    data: await inspectEnvironmentCapabilities({
      ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
      dryRun: options.dryRun,
      verbose: options.verbose,
      signal,
    }),
  }), renderCapabilities);
}

export async function runProbeAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (options, signal) => {
    const input = positional[0];
    if (typeof input !== "string" || input.length === 0) {
      throw new ToolkitRuntimeError("E_USAGE_MISSING_ARGUMENT", "probe requires an input path.");
    }
    const report = await probeMedia(input, {
      ...(options.ffprobePath !== undefined ? { ffprobePath: options.ffprobePath } : {}),
      dryRun: options.dryRun,
      verbose: options.verbose,
      signal,
    });
    return { data: report, execution: report.execution };
  }, renderProbe);
}

export async function runEnvironmentInstallAction(command: Command): Promise<void> {
  await executeAction(command, async () => {
    throw new ToolkitRuntimeError(
      "E_OPERATION_UNSUPPORTED",
      "Automatic system installation is reserved and intentionally not implemented in the current release. Install FFmpeg with the platform package manager or provide --ffmpeg-path/--ffprobe-path.",
      { details: { reserved: true, reason: "system package management requires an explicit platform policy" } },
    );
  }, () => "");
}
