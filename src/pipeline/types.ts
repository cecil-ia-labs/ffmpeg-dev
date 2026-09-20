import type { HardwareMode } from "../hardware/types.js";
import type { MediaFit } from "../media/fit.js";
import type { MediaInfo, ToolkitWarning, TrimMode } from "../types/contracts.js";
import type { RestoreProfile, SpeedAudioMode, VideoOutputFormat } from "../video/types.js";
import type { ConversionFormat } from "../conversion/types.js";

export interface PipelineTrimStep {
  trim: {
    start?: number;
    end?: number;
    duration?: number;
    mode?: TrimMode;
  };
}

export interface PipelineSpeedStep {
  speed: {
    factor: number;
    audio?: SpeedAudioMode;
  };
}

export interface PipelineResizeStep {
  resize: {
    width: number;
    height: number;
    fit?: MediaFit;
    background?: string;
    profile?: RestoreProfile;
    fps?: number;
    crf?: number;
    preset?: string;
    to?: VideoOutputFormat;
    hardware?: HardwareMode;
    hardwareDevice?: string;
    hardwareStrict?: boolean;
  };
}

export interface PipelineNormalizeStep {
  normalize: {
    width?: number;
    height?: number;
    fps?: number;
    pixelFormat?: string;
    sampleRate?: number;
    channels?: number;
  };
}

export interface PipelineAudioStep {
  audio: {
    normalize: true;
    sampleRate?: number;
    channels?: number;
  };
}

export interface PipelineConvertStep {
  convert: {
    to: ConversionFormat;
    fps?: number;
    width?: number;
    height?: number;
    fit?: MediaFit;
    background?: string;
    quality?: number;
    maxColors?: number;
    loop?: number;
    audioBitrate?: string;
    sampleRate?: number;
    channels?: number;
    hardware?: HardwareMode;
    hardwareDevice?: string;
    hardwareStrict?: boolean;
  };
}

export interface PipelinePresetStep {
  preset: string;
}

export type ConcretePipelineStep =
  | PipelineTrimStep
  | PipelineSpeedStep
  | PipelineResizeStep
  | PipelineNormalizeStep
  | PipelineAudioStep
  | PipelineConvertStep;

export type PipelineStep =
  | PipelineTrimStep
  | PipelineSpeedStep
  | PipelineResizeStep
  | PipelineNormalizeStep
  | PipelineAudioStep
  | PipelineConvertStep
  | PipelinePresetStep;

export interface PipelineOutput {
  path: string;
  codec?: "h264" | "vp9";
}

export interface PipelineDocument {
  version: 1;
  input: string;
  presets: Record<string, PipelineStep[]>;
  steps: PipelineStep[];
  output: PipelineOutput;
}

export interface LoadedPipeline {
  file: string;
  baseDirectory: string;
  document: PipelineDocument;
}


export interface PipelineRuntimeOptions {
  /** Optional final-output override. Relative paths resolve from the pipeline file directory. */
  output?: string;
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  ffmpegPath?: string;
  ffprobePath?: string;
  signal?: AbortSignal;
  keepTemp?: boolean;
}

export type PipelineStepKind = "trim" | "speed" | "resize" | "normalize" | "audio" | "convert";

export interface PipelineStepReport {
  index: number;
  kind: PipelineStepKind;
  input: string;
  output: string;
  planned: boolean;
  invocation?: string;
  durationMs?: number;
  warnings: ToolkitWarning[];
  details: Record<string, unknown>;
}

export interface PipelineReport {
  operation: "pipeline";
  file: string;
  source: string;
  output: string;
  planned: boolean;
  stepCount: number;
  steps: PipelineStepReport[];
  warnings: ToolkitWarning[];
  outputMedia?: MediaInfo;
  workspace?: string;
}
