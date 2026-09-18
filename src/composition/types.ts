import type { CommandExecution, MediaInfo, ToolkitWarning } from "../types/contracts.js";

export type CompositionOperation = "concat" | "transition" | "slideshow";
export type CompositionAudioMode = "auto" | "drop" | "preserve";
export type XfadeTransition =
  | "fade"
  | "fadeblack"
  | "fadewhite"
  | "wipeleft"
  | "wiperight"
  | "slideup"
  | "slidedown"
  | "circleopen"
  | "circleclose"
  | "dissolve"
  | "pixelize"
  | "distance";
export type SlideshowDirection = "up" | "down";

export interface CompositionRuntimeOptions {
  output?: string;
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  ffmpegPath?: string;
  ffprobePath?: string;
  signal?: AbortSignal;
  cwd?: string;
  keepTemp?: boolean;
}

export interface NormalizeCompositionOptions {
  width?: number;
  height?: number;
  fps?: number;
  pixelFormat?: string;
}

export interface ConcatRequest extends CompositionRuntimeOptions, NormalizeCompositionOptions {
  transition?: "none" | XfadeTransition;
  transitionDuration?: number;
  audio?: CompositionAudioMode;
}

export interface TransitionRequest extends CompositionRuntimeOptions, NormalizeCompositionOptions {
  transition?: XfadeTransition;
  duration?: number;
  offset?: number;
  audio?: CompositionAudioMode;
}

export interface SlideshowRequest extends CompositionRuntimeOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  background?: string;
  direction?: SlideshowDirection;
  includeIntro?: boolean;
  includeOutro?: boolean;
  recursive?: boolean;
}

export interface CompositionReport {
  operation: CompositionOperation;
  sources: string[];
  output: string;
  planned: boolean;
  invocation: string;
  execution: CommandExecution;
  inputMedia?: MediaInfo[];
  outputMedia?: MediaInfo;
  warnings: ToolkitWarning[];
  details: Record<string, unknown>;
}
