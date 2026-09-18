import { readdir } from "node:fs/promises";
import path from "node:path";

import { ToolkitRuntimeError } from "../core/errors.js";
import { resolveEncodingProfile } from "../video/encoding.js";
import { FilterGraphBuilder } from "./filter-graph.js";
import { executeComposition } from "./helpers.js";
import type { CompositionReport, SlideshowRequest } from "./types.js";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);

async function discoverImages(directory: string, recursive: boolean): Promise<string[]> {
  const root = path.resolve(directory);
  const found: string[] = [];
  async function visit(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory() && recursive) await visit(absolute);
      else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) found.push(absolute);
    }
  }
  try {
    await visit(root);
  } catch (error: unknown) {
    throw new ToolkitRuntimeError("E_INPUT_UNREADABLE", `Unable to read slideshow directory: ${root}`, { cause: error });
  }
  return found;
}

function positiveInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved <= 0) throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be a positive integer.`);
  return resolved;
}

function positiveNumber(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || resolved <= 0) throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be positive.`);
  return resolved;
}

function safeColor(value: string): string {
  if (!/^(?:[A-Za-z]+|#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?)$/.test(value)) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", "background must be a named color or #RRGGBB/#RRGGBBAA value.");
  }
  return value;
}

export async function createVerticalStackSlideshow(directory: string, request: SlideshowRequest = {}): Promise<CompositionReport> {
  const images = await discoverImages(directory, request.recursive ?? false);
  if (images.length < 2) {
    throw new ToolkitRuntimeError("E_BATCH_EMPTY_SELECTION", "Slideshow requires at least two images.", { details: { directory, discovered: images.length } });
  }

  const width = positiveInteger(request.width, 1280, "width");
  const height = positiveInteger(request.height, 720, "height");
  const fps = positiveInteger(request.fps, 30, "fps");
  const duration = positiveNumber(request.duration, 10, "duration");
  const background = safeColor(request.background ?? "black");
  const direction = request.direction ?? "up";
  const includeIntro = request.includeIntro ?? true;
  const includeOutro = request.includeOutro ?? false;

  const graph = new FilterGraphBuilder();
  images.forEach((_image, index) => {
    graph.add([`${index}:v`], [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${background}`,
      "setsar=1",
      `fps=${fps}`,
      "setpts=PTS-STARTPTS",
    ], `slide${index}`);
  });

  graph.addRaw(`color=c=${background}:s=${width}x${height}:r=${fps}:d=${duration}[bg]`);
  if (includeIntro) graph.addRaw(`color=c=${background}:s=${width}x${height}:r=${fps}:d=${duration}[intro]`);
  if (includeOutro) graph.addRaw(`color=c=${background}:s=${width}x${height}:r=${fps}:d=${duration}[outro]`);

  const stacked = [
    ...(includeIntro ? ["[intro]"] : []),
    ...images.map((_image, index) => `[slide${index}]`),
    ...(includeOutro ? ["[outro]"] : []),
  ];
  graph.addRaw(`${stacked.join("")}vstack=inputs=${stacked.length}[stack]`);
  const y = direction === "down"
    ? `-(overlay_h-${height})+(overlay_h-${height})*t/${duration}`
    : `-(overlay_h-${height})*t/${duration}`;
  graph.addRaw(`[bg][stack]overlay=x=0:y='${y}':shortest=1,trim=duration=${duration},format=yuv420p[vout]`);

  const root = path.resolve(directory);
  const output = request.output !== undefined
    ? path.resolve(request.cwd ?? process.cwd(), request.output)
    : path.join(root, "slideshow.vertical-stack.mp4");
  const encoding = resolveEncodingProfile(output);
  const args: string[] = [];
  for (const image of images) args.push("-loop", "1", "-framerate", String(fps), "-i", image);
  args.push(
    "-filter_complex", graph.build(),
    "-map", "[vout]",
    "-c:v", encoding.videoCodec,
    ...encoding.videoQualityArgs,
    ...encoding.muxerArgs,
    "-pix_fmt", "yuv420p",
    "-r", String(fps),
    "-an",
    "-t", String(duration),
  );

  return await executeComposition({
    operation: "slideshow",
    sources: images,
    output,
    argsBeforeOutput: args,
    runtime: request,
    warnings: [],
    details: {
      style: "vertical-stack",
      imageCount: images.length,
      width,
      height,
      fps,
      duration,
      background,
      direction,
      includeIntro,
      includeOutro,
      recursive: request.recursive ?? false,
    },
  });
}
