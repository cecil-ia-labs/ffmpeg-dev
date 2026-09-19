import { ToolkitRuntimeError } from "../core/errors.js";
import { buildFitFilters } from "../media/fit.js";
import type { MediaInfo } from "../types/contracts.js";
import type { NormalizeCompositionOptions } from "./types.js";

export interface ResolvedVideoNormalization {
  width: number;
  height: number;
  fps: number;
  pixelFormat: string;
  fit: "contain" | "cover" | "stretch";
  background: string;
}

function positiveInteger(value: number | undefined, fallback: number | undefined, name: string): number {
  const resolved = value ?? fallback;
  if (resolved === undefined || !Number.isInteger(resolved) || resolved <= 0) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must resolve to a positive integer.`, {
      details: { requested: value, fallback },
    });
  }
  return resolved;
}

export function resolveVideoNormalization(
  media: readonly MediaInfo[],
  options: NormalizeCompositionOptions,
): ResolvedVideoNormalization {
  const first = media[0]?.video[0];
  if (!first) {
    throw new ToolkitRuntimeError("E_MEDIA_NO_MATCHING_STREAM", "Composition requires at least one video stream.");
  }
  return {
    width: positiveInteger(options.width, first.width, "width"),
    height: positiveInteger(options.height, first.height, "height"),
    fps: positiveInteger(options.fps, 30, "fps"),
    pixelFormat: options.pixelFormat ?? "yuv420p",
    fit: options.fit ?? "contain",
    background: options.background ?? "black",
  };
}

export function videoNormalizationFilters(normalization: ResolvedVideoNormalization): string[] {
  const { width, height, fps, pixelFormat, fit, background } = normalization;
  return [
    ...buildFitFilters({ width, height, fit, background }),
    "setpts=PTS-STARTPTS",
    `fps=${fps}`,
    `format=${pixelFormat}`,
    "settb=AVTB",
  ];
}

export const AUDIO_NORMALIZATION_FILTERS = ["aresample=48000", "asetpts=PTS-STARTPTS"] as const;
