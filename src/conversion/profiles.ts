import path from "node:path";

import { ToolkitRuntimeError } from "../core/errors.js";
import type { MediaInfo, ToolkitWarning } from "../types/contracts.js";
import type { ConversionFormat, ConversionTuningOptions } from "./types.js";

const FORMAT_EXTENSIONS: Readonly<Record<ConversionFormat, readonly string[]>> = {
  mp4: [".mp4"],
  webm: [".webm"],
  gif: [".gif"],
  webp: [".webp"],
  png: [".png"],
};

const TARGET_EXTENSION: Readonly<Record<ConversionFormat, string>> = {
  mp4: ".mp4",
  webm: ".webm",
  gif: ".gif",
  webp: ".webp",
  png: ".png",
};

const SUPPORTED_PAIRS = new Set([
  "mp4:webm",
  "mp4:gif",
  "mp4:webp",
  "webm:gif",
  "webp:png",
  "gif:webm",
]);

export interface ConversionPlan {
  argsBeforeOutput: string[];
  warnings: ToolkitWarning[];
  details: Record<string, unknown>;
}

export function targetExtension(format: ConversionFormat): string {
  return TARGET_EXTENSION[format];
}

export function inferConversionFormat(file: string): ConversionFormat | undefined {
  const extension = path.extname(file).toLowerCase();
  for (const [format, extensions] of Object.entries(FORMAT_EXTENSIONS) as [ConversionFormat, readonly string[]][]) {
    if (extensions.includes(extension)) return format;
  }
  return undefined;
}

export function isExtensionForFormat(file: string, format: ConversionFormat): boolean {
  return FORMAT_EXTENSIONS[format].includes(path.extname(file).toLowerCase());
}

export function assertSupportedConversion(from: ConversionFormat, to: ConversionFormat): void {
  if (!SUPPORTED_PAIRS.has(`${from}:${to}`)) {
    throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", `Unsupported conversion: ${from} -> ${to}.`, {
      details: {
        from,
        to,
        supportedPairs: [...SUPPORTED_PAIRS].sort(),
      },
    });
  }
}

function requireVisualStream(media: MediaInfo, source: string): void {
  if (media.video.length === 0) {
    throw new ToolkitRuntimeError("E_MEDIA_NO_MATCHING_STREAM", "Conversion requires a video/image stream.", {
      details: { source },
    });
  }
}

function positiveInteger(value: number | undefined, fallback: number, label: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved <= 0) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${label} must be a positive integer.`, {
      details: { [label]: value },
    });
  }
  return resolved;
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number, label: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < min || resolved > max) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${label} must be an integer from ${min} to ${max}.`, {
      details: { [label]: value, min, max },
    });
  }
  return resolved;
}

function videoFilter(options: ConversionTuningOptions, defaultFps?: number): string | undefined {
  const filters: string[] = [];
  const fps = options.fps ?? defaultFps;
  if (fps !== undefined) filters.push(`fps=${positiveInteger(fps, fps, "fps")}`);
  if (options.width !== undefined) {
    const width = positiveInteger(options.width, options.width, "width");
    filters.push(`scale=${width}:-2:flags=lanczos`);
  }
  return filters.length > 0 ? filters.join(",") : undefined;
}

function droppedAudioWarning(media: MediaInfo, target: ConversionFormat): ToolkitWarning[] {
  if (media.audio.length === 0) return [];
  if (target !== "gif" && target !== "webp" && target !== "png") return [];
  return [{
    code: "W_CONVERSION_AUDIO_DROPPED",
    message: `${target.toUpperCase()} output does not preserve the input audio stream in this conversion profile.`,
    details: { target, audioStreams: media.audio.length },
  }];
}

export function buildConversionPlan(
  source: string,
  from: ConversionFormat,
  to: ConversionFormat,
  media: MediaInfo,
  options: ConversionTuningOptions = {},
): ConversionPlan {
  assertSupportedConversion(from, to);
  requireVisualStream(media, source);
  const warnings = droppedAudioWarning(media, to);

  if (to === "webm") {
    const vf = videoFilter(options);
    const hasAudio = media.audio.length > 0;
    return {
      argsBeforeOutput: [
        "-i", source,
        "-map", "0:v:0",
        ...(hasAudio ? ["-map", "0:a:0?"] : []),
        ...(vf ? ["-vf", vf] : []),
        "-c:v", "libvpx-vp9",
        "-crf", "32",
        "-b:v", "0",
        "-pix_fmt", "yuv420p",
        ...(hasAudio ? ["-c:a", "libopus", "-b:a", "128k"] : ["-an"]),
        "-map_metadata", "0",
      ],
      warnings,
      details: { codec: "libvpx-vp9", audioCodec: hasAudio ? "libopus" : null, ...(vf ? { videoFilter: vf } : {}) },
    };
  }

  if (to === "gif") {
    const fps = positiveInteger(options.fps, 10, "fps");
    const maxColors = boundedInteger(options.maxColors, 256, 2, 256, "maxColors");
    const loop = boundedInteger(options.loop, 0, 0, 65535, "loop");
    const preFilters = [`fps=${fps}`];
    if (options.width !== undefined) preFilters.push(`scale=${positiveInteger(options.width, options.width, "width")}:-2:flags=lanczos`);
    const chain = preFilters.join(",");
    const filter = `[0:v]${chain},split[v1][v2];[v1]palettegen=max_colors=${maxColors}[p];[v2][p]paletteuse=dither=sierra2_4a[v]`;
    return {
      argsBeforeOutput: [
        "-i", source,
        "-filter_complex", filter,
        "-map", "[v]",
        "-an",
        "-loop", String(loop),
      ],
      warnings,
      details: { fps, maxColors, loop, palette: "generated-inline", dither: "sierra2_4a" },
    };
  }

  if (to === "webp") {
    const fps = positiveInteger(options.fps, 10, "fps");
    const quality = boundedInteger(options.quality, 80, 0, 100, "quality");
    const loop = boundedInteger(options.loop, 0, 0, 65535, "loop");
    const vf = videoFilter({ ...options, fps }, fps);
    return {
      argsBeforeOutput: [
        "-i", source,
        ...(vf ? ["-vf", vf] : []),
        "-an",
        "-c:v", "libwebp",
        "-quality", String(quality),
        "-compression_level", "4",
        "-loop", String(loop),
        "-f", "webp",
      ],
      warnings,
      details: { codec: "libwebp", animated: true, fps, quality, loop, ...(vf ? { videoFilter: vf } : {}) },
    };
  }

  if (to === "png") {
    const vf = videoFilter(options);
    return {
      argsBeforeOutput: [
        "-i", source,
        "-map", "0:v:0",
        ...(vf ? ["-vf", vf] : []),
        "-frames:v", "1",
        "-an",
        "-c:v", "png",
      ],
      warnings,
      details: { codec: "png", frameSelection: "first" },
    };
  }

  throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", `No conversion profile is defined for ${from} -> ${to}.`, {
    details: { from, to },
  });
}
