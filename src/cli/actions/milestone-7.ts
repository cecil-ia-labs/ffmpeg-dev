import type { Command } from "commander";
import { z } from "zod";

import {
  concatMedia,
  createVerticalStackSlideshow,
  transitionMedia,
  type CompositionReport,
} from "../../composition/index.js";
import { ToolkitRuntimeError } from "../../core/errors.js";
import type { GlobalCliOptions } from "../global-options.js";
import { executeAction } from "./shared.js";

const positiveInteger = z.coerce.number().int().positive();
const positiveNumber = z.coerce.number().positive();
const nonNegative = z.coerce.number().min(0);
const audioMode = z.enum(["auto", "preserve", "drop"]);
const transitionName = z.enum([
  "fade", "fadeblack", "fadewhite", "wipeleft", "wiperight", "slideup", "slidedown",
  "circleopen", "circleclose", "dissolve", "pixelize", "distance",
]);

interface NormalizeInput {
  width?: number | undefined;
  height?: number | undefined;
  fps?: number | undefined;
}

function normalizationOptions(parsed: NormalizeInput) {
  return {
    ...(parsed.width !== undefined ? { width: parsed.width } : {}),
    ...(parsed.height !== undefined ? { height: parsed.height } : {}),
    ...(parsed.fps !== undefined ? { fps: parsed.fps } : {}),
  };
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

function positionalString(positional: readonly unknown[], index: number, commandName: string, label: string): string {
  const value = positional[index];
  if (typeof value !== "string" || value.length === 0) {
    throw new ToolkitRuntimeError("E_USAGE_MISSING_ARGUMENT", `${commandName} requires ${label}.`);
  }
  return value;
}

function variadicStrings(positional: readonly unknown[], commandName: string): string[] {
  const first = positional[0];
  const values = Array.isArray(first) ? first : positional;
  if (!values.every((value) => typeof value === "string") || values.length < 2) {
    throw new ToolkitRuntimeError("E_USAGE_MISSING_ARGUMENT", `${commandName} requires at least two input files.`);
  }
  return values as string[];
}

function renderReport(report: CompositionReport): string {
  const lines = [
    `compose ${report.operation}${report.planned ? " (dry run)" : ""}`,
    `Inputs: ${report.sources.length}`,
    `Output: ${report.output}`,
    `Command: ${report.invocation}`,
  ];
  const video = report.outputMedia?.video[0];
  if (video?.width !== undefined && video.height !== undefined) lines.push(`Resolution: ${video.width}x${video.height}`);
  if (report.outputMedia?.format.durationSeconds !== undefined) lines.push(`Duration: ${report.outputMedia.format.durationSeconds}s`);
  return lines.join("\n");
}

export async function runComposeConcatAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (global, signal) => {
    const parsed = z.object({
      transition: z.union([z.literal("none"), transitionName]).default("none"),
      transitionDuration: positiveNumber.default(1),
      width: positiveInteger.optional(),
      height: positiveInteger.optional(),
      fps: positiveInteger.optional(),
      audio: audioMode.default("auto"),
    }).parse(command.opts());
    const report = await concatMedia(variadicStrings(positional, "compose concat"), {
      ...runtimeOptions(global, signal),
      ...normalizationOptions(parsed),
      transition: parsed.transition,
      transitionDuration: parsed.transitionDuration,
      audio: parsed.audio,
    });
    return { data: report, warnings: report.warnings, execution: report.execution };
  }, renderReport);
}

export async function runComposeTransitionAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (global, signal) => {
    const parsed = z.object({
      transition: transitionName.default("fade"),
      duration: positiveNumber.default(1),
      offset: nonNegative.optional(),
      width: positiveInteger.optional(),
      height: positiveInteger.optional(),
      fps: positiveInteger.optional(),
      audio: audioMode.default("auto"),
    }).parse(command.opts());
    const report = await transitionMedia(
      positionalString(positional, 0, "compose transition", "a left input"),
      positionalString(positional, 1, "compose transition", "a right input"),
      {
        ...runtimeOptions(global, signal),
        ...normalizationOptions(parsed),
        transition: parsed.transition,
        duration: parsed.duration,
        ...(parsed.offset !== undefined ? { offset: parsed.offset } : {}),
        audio: parsed.audio,
      },
    );
    return { data: report, warnings: report.warnings, execution: report.execution };
  }, renderReport);
}

export async function runComposeSlideshowAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (global, signal) => {
    const parsed = z.object({
      width: positiveInteger.default(1280),
      height: positiveInteger.default(720),
      fps: positiveInteger.default(30),
      duration: positiveNumber.default(10),
      background: z.string().min(1).default("black"),
      direction: z.enum(["up", "down"]).default("up"),
      intro: z.boolean().default(true),
      outro: z.boolean().default(false),
      recursive: z.boolean().default(false),
    }).parse(command.opts());
    const report = await createVerticalStackSlideshow(
      positionalString(positional, 0, "compose slideshow", "an image directory"),
      {
        ...runtimeOptions(global, signal),
        width: parsed.width,
        height: parsed.height,
        fps: parsed.fps,
        duration: parsed.duration,
        background: parsed.background,
        direction: parsed.direction,
        includeIntro: parsed.intro,
        includeOutro: parsed.outro,
        recursive: parsed.recursive,
      },
    );
    return { data: report, warnings: report.warnings, execution: report.execution };
  }, renderReport);
}
