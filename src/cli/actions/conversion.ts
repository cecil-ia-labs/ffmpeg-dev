import path from "node:path";

import type { Command } from "commander";
import { z } from "zod";

import {
  batchExitCode,
  convertBatch,
  convertFile,
  normalizeConversionFormat,
  type BatchConversionReport,
  type ConversionFormat,
  type ConversionReport,
  type ConversionTuningOptions,
} from "../../conversion/index.js";
import { ToolkitRuntimeError } from "../../core/errors.js";
import type { HardwareMode } from "../../hardware/types.js";
import type { MediaFit } from "../../media/fit.js";
import type { GlobalCliOptions } from "../global-options.js";
import { executeAction } from "./shared.js";

const formatSchema = z.string().transform((value, context): ConversionFormat => {
  const format = normalizeConversionFormat(value);
  if (!format) {
    context.addIssue({ code: "custom", message: `unsupported media format: ${value}` });
    return z.NEVER;
  }
  return format;
});
const positiveInteger = z.coerce.number().int().positive();
const quality = z.coerce.number().int().min(0).max(100);
const maxColors = z.coerce.number().int().min(2).max(256);
const loop = z.coerce.number().int().min(0).max(65535);

function positionalAt(positional: readonly unknown[], index: number, commandName: string, label: string): string {
  const value = positional[index];
  if (typeof value !== "string" || value.length === 0) {
    throw new ToolkitRuntimeError("E_USAGE_MISSING_ARGUMENT", `${commandName} requires ${label}.`);
  }
  return value;
}

function localOptions(command: Command): Record<string, unknown> {
  return command.opts() as Record<string, unknown>;
}

function runtimeOptions(global: GlobalCliOptions, signal: AbortSignal) {
  return {
    ...(global.output !== undefined ? { output: global.output } : {}),
    overwrite: global.overwrite,
    dryRun: global.dryRun,
    verbose: global.verbose,
    ...(global.ffmpegPath !== undefined ? { ffmpegPath: global.ffmpegPath } : {}),
    ...(global.ffprobePath !== undefined ? { ffprobePath: global.ffprobePath } : {}),
    signal,
    keepTemp: global.keepTemp,
  };
}

interface TuningInput {
  fps?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fit?: MediaFit | undefined;
  background?: string | undefined;
  quality?: number | undefined;
  maxColors?: number | undefined;
  loop?: number | undefined;
  audioBitrate?: string | undefined;
  sampleRate?: number | undefined;
  channels?: number | undefined;
}

function tuningOptions(parsed: TuningInput): ConversionTuningOptions {
  return {
    ...(parsed.fps !== undefined ? { fps: parsed.fps } : {}),
    ...(parsed.width !== undefined ? { width: parsed.width } : {}),
    ...(parsed.height !== undefined ? { height: parsed.height } : {}),
    ...(parsed.fit !== undefined ? { fit: parsed.fit } : {}),
    ...(parsed.background !== undefined ? { background: parsed.background } : {}),
    ...(parsed.quality !== undefined ? { quality: parsed.quality } : {}),
    ...(parsed.maxColors !== undefined ? { maxColors: parsed.maxColors } : {}),
    ...(parsed.loop !== undefined ? { loop: parsed.loop } : {}),
    ...(parsed.audioBitrate !== undefined ? { audioBitrate: parsed.audioBitrate } : {}),
    ...(parsed.sampleRate !== undefined ? { sampleRate: parsed.sampleRate } : {}),
    ...(parsed.channels !== undefined ? { channels: parsed.channels } : {}),
  };
}

const hardwareMode = z.enum(["software", "auto", "nvenc", "qsv", "vaapi", "videotoolbox"]);

function selectedHardwareOptions(parsed: {
  hardware?: HardwareMode | undefined;
  hardwareDevice?: string | undefined;
  hardwareStrict?: boolean | undefined;
}) {
  return {
    ...(parsed.hardware !== undefined ? { hardware: parsed.hardware } : {}),
    ...(parsed.hardwareDevice !== undefined ? { hardwareDevice: parsed.hardwareDevice } : {}),
    ...(parsed.hardwareStrict !== undefined ? { hardwareStrict: parsed.hardwareStrict } : {}),
  };
}

const tuningSchema = {
  fps: positiveInteger.optional(),
  width: positiveInteger.optional(),
  height: positiveInteger.optional(),
  fit: z.enum(["contain", "cover", "stretch"]).default("contain"),
  background: z.string().min(1).default("black"),
  quality: quality.optional(),
  maxColors: maxColors.optional(),
  loop: loop.optional(),
  audioBitrate: z.string().min(1).optional(),
  sampleRate: positiveInteger.optional(),
  channels: positiveInteger.optional(),
  hardware: hardwareMode.default("software"),
  hardwareDevice: z.string().min(1).optional(),
  hardwareStrict: z.boolean().default(false),
} as const;

function renderConversionReport(report: ConversionReport): string {
  const lines = [
    `convert file${report.planned ? " (dry run)" : ""}`,
    `Input: ${report.source}`,
    `Format: ${report.sourceFormat} -> ${report.targetFormat}`,
    `Output: ${report.output}`,
    `Command: ${report.invocation}`,
  ];
  const hardware = report.details["hardware"];
  if (hardware && typeof hardware === "object") {
    const value = hardware as { requested?: unknown; resolved?: unknown; encoder?: unknown; fallback?: unknown };
    lines.push(
      `Hardware: ${String(value.requested ?? "software")} -> ${String(value.resolved ?? "software")} (${String(value.encoder ?? "unknown")})${value.fallback === true ? " [fallback]" : ""}`,
    );
  }
  const video = report.outputMedia?.video[0];
  const audio = report.outputMedia?.audio[0];
  if (video) {
    const resolution = video.width !== undefined && video.height !== undefined ? `${video.width}x${video.height}` : undefined;
    const details = [video.codecName, resolution].filter((value): value is string => value !== undefined);
    if (details.length > 0) lines.push(`Result: ${details.join(", ")}`);
  } else if (audio) {
    const details = [
      audio.codecName,
      audio.sampleRate !== undefined ? `${audio.sampleRate} Hz` : undefined,
      audio.channels !== undefined ? `${audio.channels} ch` : undefined,
    ].filter((value): value is string => value !== undefined);
    if (details.length > 0) lines.push(`Result: ${details.join(", ")}`);
  }
  return lines.join("\n");
}

function renderBatchReport(report: BatchConversionReport): string {
  const lines = [
    `convert batch: ${report.sourceFormat} -> ${report.targetFormat}`,
    `Directory: ${report.directory}`,
    `Output directory: ${report.outputDirectory}`,
    `Discovered: ${report.discovered}`,
    `Attempted: ${report.attempted}`,
    `Succeeded: ${report.succeeded}`,
    `Failed: ${report.failed}`,
    `Skipped: ${report.skipped}`,
    `Parallelism: ${report.parallelism}`,
  ];
  if (report.failed > 0) {
    lines.push("Failures:");
    for (const item of report.items.filter((entry) => entry.status === "failed")) {
      lines.push(`  - ${item.relativeInput}: ${item.error?.message ?? "unknown error"}`);
    }
  }
  return lines.join("\n");
}

export async function runConvertFileAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (global, signal) => {
    const parsed = z.object({
      to: formatSchema,
      from: formatSchema.optional(),
      ...tuningSchema,
    }).parse(localOptions(command));

    const report = await convertFile(positionalAt(positional, 0, "convert file", "an input file"), {
      ...runtimeOptions(global, signal),
      to: parsed.to,
      ...(parsed.from !== undefined ? { from: parsed.from } : {}),
      ...tuningOptions(parsed),
      ...selectedHardwareOptions(parsed),
    });
    return { data: report, warnings: report.warnings, execution: report.execution };
  }, renderConversionReport);
}

export async function runConvertBatchAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (global, signal) => {
    if (global.output !== undefined) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Use --output-dir for batch conversion instead of the global --output option.");
    }

    const parsed = z.object({
      from: formatSchema,
      to: formatSchema,
      recursive: z.boolean().default(false),
      include: z.array(z.string()).default([]),
      exclude: z.array(z.string()).default([]),
      parallelism: z.coerce.number().int().min(1).max(32).default(2),
      failFast: z.boolean().default(false),
      continueOnError: z.boolean().default(false),
      outputDir: z.string().min(1).optional(),
      preserveHierarchy: z.boolean().default(true),
      existing: z.enum(["error", "skip", "replace"]).optional(),
      ...tuningSchema,
    }).parse(localOptions(command));

    const existing = parsed.existing ?? (global.overwrite ? "replace" : "error");
    const report = await convertBatch(positionalAt(positional, 0, "convert batch", "a directory"), {
      from: parsed.from,
      to: parsed.to,
      recursive: parsed.recursive,
      includes: parsed.include,
      excludes: parsed.exclude,
      parallelism: parsed.parallelism,
      failFast: parsed.failFast,
      ...(parsed.outputDir !== undefined ? { outputDirectory: path.resolve(parsed.outputDir) } : {}),
      preserveHierarchy: parsed.preserveHierarchy,
      existing,
      dryRun: global.dryRun,
      verbose: global.verbose,
      ...(global.ffmpegPath !== undefined ? { ffmpegPath: global.ffmpegPath } : {}),
      ...(global.ffprobePath !== undefined ? { ffprobePath: global.ffprobePath } : {}),
      signal,
      keepTemp: global.keepTemp,
      ...tuningOptions(parsed),
      ...selectedHardwareOptions(parsed),
      ...(global.progress && !global.json && !global.quiet
        ? {
            onProgress: (event: { completed: number; total: number; input: string; status: "succeeded" | "failed" | "skipped" }) => {
              process.stderr.write(`[${event.completed}/${event.total}] ${event.status}: ${event.input}\n`);
            },
          }
        : {}),
    });

    const exitCode = batchExitCode(report);
    return { data: report, ...(exitCode !== undefined ? { exitCode } : {}) };
  }, renderBatchReport);
}

export function isConversionFormat(value: string): value is ConversionFormat {
  return normalizeConversionFormat(value) !== undefined;
}
