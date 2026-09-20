import path from "node:path";

import { TemporaryWorkspace } from "../core/temp-files.js";
import { ToolkitRuntimeError } from "../core/errors.js";
import { convertFile, targetExtension } from "../conversion/index.js";
import type { ConversionReport } from "../conversion/types.js";
import { normalizeMedia } from "../diagnostics/index.js";
import type { RepairReport } from "../diagnostics/types.js";
import { resolveReadableFile } from "../media/io.js";
import type { MediaInfo } from "../types/contracts.js";
import { changeVideoSpeed, trimVideoRange, trimVideoStart, upscaleVideo } from "../video/index.js";
import type { VideoOperationReport } from "../video/types.js";
import type {
  LoadedPipeline,
  PipelineReport,
  PipelineRuntimeOptions,
  PipelineStep,
  PipelineStepKind,
  PipelineStepReport,
} from "./types.js";

function stepKind(step: PipelineStep): PipelineStepKind | "preset" {
  if ("trim" in step) return "trim";
  if ("speed" in step) return "speed";
  if ("resize" in step) return "resize";
  if ("normalize" in step) return "normalize";
  if ("audio" in step) return "audio";
  if ("convert" in step) return "convert";
  return "preset";
}

function finalOutput(loaded: LoadedPipeline): string {
  const target = loaded.document.output.path;
  return path.isAbsolute(target) ? path.normalize(target) : path.resolve(loaded.baseDirectory, target);
}

function videoFormatForPath(target: string): "mp4" | "webm" {
  return path.extname(target).toLowerCase() === ".webm" ? "webm" : "mp4";
}

function intermediateExtension(current: string, step: PipelineStep): string {
  if ("convert" in step) return targetExtension(step.convert.to);
  if ("resize" in step && step.resize.to !== undefined) return `.${step.resize.to}`;
  return path.extname(current) || ".mp4";
}

function commonRuntime(options: PipelineRuntimeOptions, output: string, final: boolean) {
  return {
    output,
    overwrite: final ? (options.overwrite ?? false) : true,
    dryRun: false,
    verbose: options.verbose ?? false,
    ...(options.ffmpegPath !== undefined ? { ffmpegPath: options.ffmpegPath } : {}),
    ...(options.ffprobePath !== undefined ? { ffprobePath: options.ffprobePath } : {}),
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
    keepTemp: false,
  };
}

function fromVideoReport(
  index: number,
  kind: PipelineStepKind,
  report: VideoOperationReport,
): PipelineStepReport {
  return {
    index,
    kind,
    input: report.source,
    output: report.output,
    planned: report.planned,
    invocation: report.invocation,
    durationMs: report.execution.durationMs,
    warnings: report.warnings,
    details: report.details,
  };
}

function fromConversionReport(
  index: number,
  report: ConversionReport,
): PipelineStepReport {
  return {
    index,
    kind: "convert",
    input: report.source,
    output: report.output,
    planned: report.planned,
    invocation: report.invocation,
    durationMs: report.execution.durationMs,
    warnings: report.warnings,
    details: report.details,
  };
}

function fromRepairReport(
  index: number,
  kind: "normalize" | "audio",
  report: RepairReport,
): PipelineStepReport {
  return {
    index,
    kind,
    input: report.source,
    output: report.output,
    planned: report.planned,
    invocation: report.invocation,
    durationMs: report.execution.durationMs,
    warnings: report.warnings,
    details: report.details,
  };
}

async function executeConvert(
  index: number,
  input: string,
  output: string,
  step: Extract<PipelineStep, { convert: unknown }>,
  runtime: PipelineRuntimeOptions,
  final: boolean,
): Promise<{ step: PipelineStepReport; media: MediaInfo | undefined }> {
  const convert = step.convert;
  const report = await convertFile(input, {
    ...commonRuntime(runtime, output, final),
    to: convert.to,
    ...(convert.fps !== undefined ? { fps: convert.fps } : {}),
    ...(convert.width !== undefined ? { width: convert.width } : {}),
    ...(convert.height !== undefined ? { height: convert.height } : {}),
    ...(convert.fit !== undefined ? { fit: convert.fit } : {}),
    ...(convert.background !== undefined ? { background: convert.background } : {}),
    ...(convert.quality !== undefined ? { quality: convert.quality } : {}),
    ...(convert.maxColors !== undefined ? { maxColors: convert.maxColors } : {}),
    ...(convert.loop !== undefined ? { loop: convert.loop } : {}),
    ...(convert.audioBitrate !== undefined ? { audioBitrate: convert.audioBitrate } : {}),
    ...(convert.sampleRate !== undefined ? { sampleRate: convert.sampleRate } : {}),
    ...(convert.channels !== undefined ? { channels: convert.channels } : {}),
    ...(convert.hardware !== undefined ? { hardware: convert.hardware } : {}),
    ...(convert.hardwareDevice !== undefined ? { hardwareDevice: convert.hardwareDevice } : {}),
    ...(convert.hardwareStrict !== undefined ? { hardwareStrict: convert.hardwareStrict } : {}),
  });
  return { step: fromConversionReport(index, report), media: report.outputMedia };
}

async function executeNormalize(
  index: number,
  input: string,
  output: string,
  step: Extract<PipelineStep, { normalize: unknown }>,
  runtime: PipelineRuntimeOptions,
  final: boolean,
): Promise<{ step: PipelineStepReport; media: MediaInfo | undefined }> {
  const normalize = step.normalize;
  const report = await normalizeMedia(input, {
    ...commonRuntime(runtime, output, final),
    ...(normalize.width !== undefined ? { width: normalize.width } : {}),
    ...(normalize.height !== undefined ? { height: normalize.height } : {}),
    ...(normalize.fps !== undefined ? { fps: normalize.fps } : {}),
    ...(normalize.pixelFormat !== undefined ? { pixelFormat: normalize.pixelFormat } : {}),
    ...(normalize.sampleRate !== undefined ? { sampleRate: normalize.sampleRate } : {}),
    ...(normalize.channels !== undefined ? { channels: normalize.channels } : {}),
  });
  return { step: fromRepairReport(index, "normalize", report), media: report.outputMedia };
}

async function executeAudioNormalize(
  index: number,
  input: string,
  output: string,
  step: Extract<PipelineStep, { audio: unknown }>,
  runtime: PipelineRuntimeOptions,
  final: boolean,
): Promise<{ step: PipelineStepReport; media: MediaInfo | undefined }> {
  const audio = step.audio;
  const report = await normalizeMedia(input, {
    ...commonRuntime(runtime, output, final),
    ...(audio.sampleRate !== undefined ? { sampleRate: audio.sampleRate } : {}),
    ...(audio.channels !== undefined ? { channels: audio.channels } : {}),
  });
  return { step: fromRepairReport(index, "audio", report), media: report.outputMedia };
}

async function executeResize(
  index: number,
  input: string,
  output: string,
  step: Extract<PipelineStep, { resize: unknown }>,
  runtime: PipelineRuntimeOptions,
  final: boolean,
): Promise<{ step: PipelineStepReport; media: MediaInfo | undefined }> {
  const resize = step.resize;
  const report = await upscaleVideo(input, {
    ...commonRuntime(runtime, output, final),
    width: resize.width,
    height: resize.height,
    ...(resize.fit !== undefined ? { fit: resize.fit } : {}),
    ...(resize.background !== undefined ? { background: resize.background } : {}),
    ...(resize.profile !== undefined ? { profile: resize.profile } : {}),
    ...(resize.fps !== undefined ? { fps: resize.fps } : {}),
    ...(resize.crf !== undefined ? { crf: resize.crf } : {}),
    ...(resize.preset !== undefined ? { preset: resize.preset } : {}),
    to: resize.to ?? videoFormatForPath(output),
    ...(resize.hardware !== undefined ? { hardware: resize.hardware } : {}),
    ...(resize.hardwareDevice !== undefined ? { hardwareDevice: resize.hardwareDevice } : {}),
    ...(resize.hardwareStrict !== undefined ? { hardwareStrict: resize.hardwareStrict } : {}),
  });
  return { step: fromVideoReport(index, "resize", report), media: report.outputMedia };
}

async function executeSpeed(
  index: number,
  input: string,
  output: string,
  step: Extract<PipelineStep, { speed: unknown }>,
  runtime: PipelineRuntimeOptions,
  final: boolean,
): Promise<{ step: PipelineStepReport; media: MediaInfo | undefined }> {
  const speed = step.speed;
  const report = await changeVideoSpeed(input, {
    ...commonRuntime(runtime, output, final),
    factor: speed.factor,
    ...(speed.audio !== undefined ? { audio: speed.audio } : {}),
  });
  return { step: fromVideoReport(index, "speed", report), media: report.outputMedia };
}

async function executeTrim(
  index: number,
  input: string,
  output: string,
  step: Extract<PipelineStep, { trim: unknown }>,
  runtime: PipelineRuntimeOptions,
  final: boolean,
): Promise<{ step: PipelineStepReport; media: MediaInfo | undefined }> {
  const trim = step.trim;
  const common = commonRuntime(runtime, output, final);
  const report = trim.end !== undefined || trim.duration !== undefined
    ? await trimVideoRange(input, {
        ...common,
        start: trim.start ?? 0,
        ...(trim.end !== undefined ? { end: trim.end } : {}),
        ...(trim.duration !== undefined ? { duration: trim.duration } : {}),
        ...(trim.mode !== undefined ? { mode: trim.mode } : {}),
      })
    : await trimVideoStart(input, {
        ...common,
        seconds: trim.start as number,
        ...(trim.mode !== undefined ? { mode: trim.mode } : {}),
      });
  return { step: fromVideoReport(index, "trim", report), media: report.outputMedia };
}

function plannedReport(loaded: LoadedPipeline, source: string, output: string): PipelineReport {
  const steps: PipelineStepReport[] = loaded.document.steps.map((step, offset) => {
    const kind = stepKind(step);
    if (kind === "preset") {
      throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", "Preset expansion is not executable until the preset phase is resolved.", {
        details: { index: offset + 1 },
      });
    }
    const isFinal = offset === loaded.document.steps.length - 1;
    return {
      index: offset + 1,
      kind,
      input: offset === 0 ? source : `<pipeline-step-${offset}-output>`,
      output: isFinal ? output : `<pipeline-step-${offset + 1}-output>`,
      planned: true,
      warnings: [],
      details: { declaration: step },
    };
  });
  return {
    operation: "pipeline",
    file: loaded.file,
    source,
    output,
    planned: true,
    stepCount: steps.length,
    steps,
    warnings: [],
  };
}

export async function executePipeline(
  loaded: LoadedPipeline,
  options: PipelineRuntimeOptions = {},
): Promise<PipelineReport> {
  const input = loaded.document.input;
  const source = await resolveReadableFile(input, loaded.baseDirectory);
  const output = finalOutput(loaded);

  if (options.dryRun) return plannedReport(loaded, source, output);

  const workspace = await TemporaryWorkspace.create({
    prefix: "cecilia-ffmpeg-pipeline-",
    keep: options.keepTemp ?? false,
  });

  try {
    let current = source;
    let outputMedia: MediaInfo | undefined;
    const reports: PipelineStepReport[] = [];

    for (let offset = 0; offset < loaded.document.steps.length; offset += 1) {
      const declaration = loaded.document.steps[offset] as PipelineStep;
      const kind = stepKind(declaration);
      const index = offset + 1;
      const isFinal = offset === loaded.document.steps.length - 1;
      const stepOutput = isFinal
        ? output
        : workspace.pathFor(`step-${String(index).padStart(3, "0")}-${kind}${intermediateExtension(current, declaration)}`);

      const result = kind === "trim" && "trim" in declaration
        ? await executeTrim(index, current, stepOutput, declaration, options, isFinal)
        : kind === "speed" && "speed" in declaration
          ? await executeSpeed(index, current, stepOutput, declaration, options, isFinal)
          : kind === "resize" && "resize" in declaration
            ? await executeResize(index, current, stepOutput, declaration, options, isFinal)
            : kind === "normalize" && "normalize" in declaration
              ? await executeNormalize(index, current, stepOutput, declaration, options, isFinal)
              : kind === "audio" && "audio" in declaration
                ? await executeAudioNormalize(index, current, stepOutput, declaration, options, isFinal)
                : kind === "convert" && "convert" in declaration
                  ? await executeConvert(index, current, stepOutput, declaration, options, isFinal)
                  : undefined;

      if (result === undefined) {
        throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", `Pipeline step "${kind}" is not executable in the current implementation phase.`, {
          details: { index, kind },
        });
      }
      reports.push(result.step);
      current = result.step.output;
      outputMedia = result.media;
    }

    return {
      operation: "pipeline",
      file: loaded.file,
      source,
      output,
      planned: false,
      stepCount: reports.length,
      steps: reports,
      warnings: reports.flatMap((report) => report.warnings),
      ...(outputMedia !== undefined ? { outputMedia } : {}),
      ...(options.keepTemp ? { workspace: workspace.directory } : {}),
    };
  } finally {
    await workspace.cleanup();
  }
}
