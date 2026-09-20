import path from "node:path";

import { ToolkitRuntimeError } from "../core/errors.js";
import {
  hardwareFilterSuffix,
  hardwareGlobalArgs,
  hardwareVideoEncodingArgs,
  type HardwareEncodingSelection,
} from "../hardware/index.js";
import { buildFitFilters } from "../media/fit.js";
import type { MediaInfo, ToolkitWarning } from "../types/contracts.js";
import type { ConversionFormat, ConversionTuningOptions } from "./types.js";

const FORMAT_EXTENSIONS: Readonly<Record<ConversionFormat, readonly string[]>> = {
  mp4: [".mp4", ".m4v", ".mov"],
  webm: [".webm"],
  gif: [".gif"],
  webp: [".webp"],
  png: [".png"],
  jpeg: [".jpg", ".jpeg"],
  wav: [".wav"],
  mp3: [".mp3"],
  aac: [".aac"],
  m4a: [".m4a"],
  flac: [".flac"],
  opus: [".opus"],
  ogg: [".ogg", ".oga"],
};

const TARGET_EXTENSION: Readonly<Record<ConversionFormat, string>> = {
  mp4: ".mp4",
  webm: ".webm",
  gif: ".gif",
  webp: ".webp",
  png: ".png",
  jpeg: ".jpg",
  wav: ".wav",
  mp3: ".mp3",
  aac: ".aac",
  m4a: ".m4a",
  flac: ".flac",
  opus: ".opus",
  ogg: ".ogg",
};

const VISUAL_TARGETS = new Set<ConversionFormat>(["mp4", "webm", "gif", "webp", "png", "jpeg"]);
const AUDIO_TARGETS = new Set<ConversionFormat>(["wav", "mp3", "aac", "m4a", "flac", "opus", "ogg"]);

export interface ConversionPlan {
  argsBeforeOutput: string[];
  warnings: ToolkitWarning[];
  details: Record<string, unknown>;
}

export function targetExtension(format: ConversionFormat): string {
  return TARGET_EXTENSION[format];
}

export function normalizeConversionFormat(value: string): ConversionFormat | undefined {
  const normalized = value.toLowerCase();
  if (normalized === "jpg") return "jpeg";
  return normalized in TARGET_EXTENSION ? normalized as ConversionFormat : undefined;
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
  if (from === to) {
    throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", `Source and target formats are both ${to}.`);
  }
  if (!VISUAL_TARGETS.has(to) && !AUDIO_TARGETS.has(to)) {
    throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", `Unsupported conversion target: ${to}.`);
  }
}

function requireVisualStream(media: MediaInfo, source: string): void {
  if (media.video.length === 0) {
    throw new ToolkitRuntimeError("E_MEDIA_NO_MATCHING_STREAM", "Conversion requires a video/image stream.", {
      details: { source },
    });
  }
}

function requireAudioStream(media: MediaInfo, source: string): void {
  if (media.audio.length === 0) {
    throw new ToolkitRuntimeError("E_MEDIA_NO_MATCHING_STREAM", "Audio conversion requires an audio stream.", {
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
  if (options.width !== undefined && options.height !== undefined) {
    filters.push(...buildFitFilters({
      width: positiveInteger(options.width, options.width, "width"),
      height: positiveInteger(options.height, options.height, "height"),
      ...(options.fit !== undefined ? { fit: options.fit } : {}),
      ...(options.background !== undefined ? { background: options.background } : {}),
    }));
  } else if (options.width !== undefined) {
    const width = positiveInteger(options.width, options.width, "width");
    filters.push(`scale=${width}:-2:flags=lanczos`);
  } else if (options.height !== undefined) {
    const height = positiveInteger(options.height, options.height, "height");
    filters.push(`scale=-2:${height}:flags=lanczos`);
  }
  return filters.length > 0 ? filters.join(",") : undefined;
}

function droppedAudioWarning(media: MediaInfo, target: ConversionFormat): ToolkitWarning[] {
  if (media.audio.length === 0) return [];
  if (!["gif", "webp", "png", "jpeg"].includes(target)) return [];
  return [{
    code: "W_CONVERSION_AUDIO_DROPPED",
    message: `${target.toUpperCase()} output does not preserve the input audio stream in this conversion profile.`,
    details: { target, audioStreams: media.audio.length },
  }];
}

function audioPlan(source: string, to: ConversionFormat, media: MediaInfo, options: ConversionTuningOptions): ConversionPlan {
  requireAudioStream(media, source);
  const common = ["-i", source, "-map", "0:a:0", "-vn"];
  const sample = options.sampleRate !== undefined ? ["-ar", String(positiveInteger(options.sampleRate, options.sampleRate, "sampleRate"))] : [];
  const channels = options.channels !== undefined ? ["-ac", String(positiveInteger(options.channels, options.channels, "channels"))] : [];
  const bitrate = options.audioBitrate ?? "192k";
  const profile: Record<string, string[]> = {
    wav: ["-c:a", "pcm_s16le"],
    mp3: ["-c:a", "libmp3lame", "-b:a", bitrate],
    aac: ["-c:a", "aac", "-b:a", bitrate, "-f", "adts"],
    m4a: ["-c:a", "aac", "-b:a", bitrate, "-f", "ipod"],
    flac: ["-c:a", "flac"],
    opus: ["-c:a", "libopus", "-b:a", options.audioBitrate ?? "128k", "-f", "opus"],
    ogg: ["-c:a", "libopus", "-b:a", options.audioBitrate ?? "128k", "-f", "ogg"],
  };
  return {
    argsBeforeOutput: [...common, ...sample, ...channels, ...(profile[to] ?? [])],
    warnings: media.video.length > 0 ? [{
      code: "W_CONVERSION_VIDEO_DROPPED",
      message: "Audio-only target drops the input video stream.",
      details: { target: to, videoStreams: media.video.length },
    }] : [],
    details: { mediaType: "audio", target: to, audioBitrate: bitrate },
  };
}

function hardwareAwareFilter(
  filter: string | undefined,
  hardware: HardwareEncodingSelection | undefined,
): string | undefined {
  const suffix = hardware === undefined ? [] : hardwareFilterSuffix(hardware);
  const parts = [...(filter ? [filter] : []), ...suffix];
  return parts.length > 0 ? parts.join(",") : undefined;
}

function hardwareWarnings(
  base: ToolkitWarning[],
  hardware: HardwareEncodingSelection | undefined,
): ToolkitWarning[] {
  return hardware?.warning === undefined ? base : [...base, hardware.warning];
}

function hardwareDetails(hardware: HardwareEncodingSelection | undefined): Record<string, unknown> {
  return hardware === undefined ? {} : {
    hardware: {
      requested: hardware.requested,
      resolved: hardware.resolved,
      encoder: hardware.encoder,
      runtimeVerified: hardware.runtimeVerified,
      fallback: hardware.fallback,
      ...(hardware.device !== undefined ? { device: hardware.device } : {}),
      attempts: hardware.attempts,
    },
  };
}

export function buildConversionPlan(
  source: string,
  from: ConversionFormat,
  to: ConversionFormat,
  media: MediaInfo,
  options: ConversionTuningOptions = {},
  hardware?: HardwareEncodingSelection,
): ConversionPlan {
  assertSupportedConversion(from, to);
  if (AUDIO_TARGETS.has(to)) return audioPlan(source, to, media, options);

  requireVisualStream(media, source);
  const warnings = droppedAudioWarning(media, to);
  const vf = videoFilter(options);

  if (to === "mp4") {
    const hasAudio = media.audio.length > 0;
    const effectiveFilter = hardwareAwareFilter(vf, hardware);
    const videoArgs = hardware === undefined
      ? ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p"]
      : hardwareVideoEncodingArgs(hardware, { softwareCrf: 18, softwarePreset: "medium" });
    return {
      argsBeforeOutput: [
        ...(hardware === undefined ? [] : hardwareGlobalArgs(hardware)),
        "-i", source,
        "-map", "0:v:0",
        ...(hasAudio ? ["-map", "0:a:0?"] : []),
        ...(effectiveFilter ? ["-vf", effectiveFilter] : []),
        ...videoArgs,
        ...(hasAudio ? ["-c:a", "aac", "-b:a", options.audioBitrate ?? "192k"] : ["-an"]),
        "-movflags", "+faststart", "-map_metadata", "0",
      ],
      warnings: hardwareWarnings(warnings, hardware),
      details: {
        codec: hardware?.encoder ?? "libx264",
        audioCodec: hasAudio ? "aac" : null,
        ...(effectiveFilter ? { videoFilter: effectiveFilter } : {}),
        ...hardwareDetails(hardware),
      },
    };
  }

  if (to === "webm") {
    const hasAudio = media.audio.length > 0;
    const effectiveFilter = hardwareAwareFilter(vf, hardware);
    const videoArgs = hardware === undefined
      ? ["-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-pix_fmt", "yuv420p"]
      : hardwareVideoEncodingArgs(hardware, { softwareCrf: 32 });
    return {
      argsBeforeOutput: [
        ...(hardware === undefined ? [] : hardwareGlobalArgs(hardware)),
        "-i", source,
        "-map", "0:v:0",
        ...(hasAudio ? ["-map", "0:a:0?"] : []),
        ...(effectiveFilter ? ["-vf", effectiveFilter] : []),
        ...videoArgs,
        ...(hasAudio ? ["-c:a", "libopus", "-b:a", options.audioBitrate ?? "128k"] : ["-an"]),
        "-map_metadata", "0",
      ],
      warnings: hardwareWarnings(warnings, hardware),
      details: {
        codec: hardware?.encoder ?? "libvpx-vp9",
        audioCodec: hasAudio ? "libopus" : null,
        ...(effectiveFilter ? { videoFilter: effectiveFilter } : {}),
        ...hardwareDetails(hardware),
      },
    };
  }

  if (to === "gif") {
    const fps = positiveInteger(options.fps, 10, "fps");
    const maxColors = boundedInteger(options.maxColors, 256, 2, 256, "maxColors");
    const loop = boundedInteger(options.loop, 0, 0, 65535, "loop");
    const pre = [`fps=${fps}`, ...(vf ? [vf] : [])].join(",");
    const filter = `[0:v]${pre},split[v1][v2];[v1]palettegen=max_colors=${maxColors}[p];[v2][p]paletteuse=dither=sierra2_4a[v]`;
    return {
      argsBeforeOutput: ["-i", source, "-filter_complex", filter, "-map", "[v]", "-an", "-loop", String(loop)],
      warnings,
      details: { fps, maxColors, loop, palette: "generated-inline" },
    };
  }

  if (to === "webp") {
    const fps = positiveInteger(options.fps, 10, "fps");
    const quality = boundedInteger(options.quality, 80, 0, 100, "quality");
    const loop = boundedInteger(options.loop, 0, 0, 65535, "loop");
    const webpFilter = videoFilter({ ...options, fps }, fps);
    return {
      argsBeforeOutput: [
        "-i", source, ...(webpFilter ? ["-vf", webpFilter] : []), "-an",
        "-c:v", "libwebp", "-quality", String(quality), "-compression_level", "4",
        "-loop", String(loop), "-f", "webp",
      ],
      warnings,
      details: { codec: "libwebp", fps, quality, loop, ...(webpFilter ? { videoFilter: webpFilter } : {}) },
    };
  }

  if (to === "png" || to === "jpeg") {
    return {
      argsBeforeOutput: [
        "-i", source, "-map", "0:v:0", ...(vf ? ["-vf", vf] : []),
        "-frames:v", "1", "-an",
        ...(to === "png" ? ["-c:v", "png"] : ["-c:v", "mjpeg", "-q:v", "2"]),
      ],
      warnings,
      details: { codec: to === "png" ? "png" : "mjpeg", frameSelection: "first", ...(vf ? { videoFilter: vf } : {}) },
    };
  }

  throw new ToolkitRuntimeError("E_OPERATION_UNSUPPORTED", `No conversion profile is defined for ${from} -> ${to}.`);
}
