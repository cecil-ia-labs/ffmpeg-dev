import path from "node:path";

import { ToolkitRuntimeError } from "../core/errors.js";
import { isExtensionForFormat } from "../conversion/profiles.js";
import type { MediaInfo } from "../types/contracts.js";
import type { ConcretePipelineStep, PipelineDocument } from "./types.js";

const H264_EXTENSIONS = new Set([".mp4", ".m4v", ".mov", ".mkv"]);
const VP9_EXTENSIONS = new Set([".webm"]);

function codecForFormat(format: string): "h264" | "vp9" | undefined {
  if (format === "mp4") return "h264";
  if (format === "webm") return "vp9";
  return undefined;
}

export function validatePipelineOutput(
  document: PipelineDocument,
  steps: readonly ConcretePipelineStep[],
  output: string,
): void {
  const extension = path.extname(output).toLowerCase();
  const codec = document.output.codec;

  if (codec !== undefined) {
    const valid = codec === "h264" ? H264_EXTENSIONS.has(extension) : VP9_EXTENSIONS.has(extension);
    if (!valid) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Pipeline output codec is incompatible with the output file extension.", {
        details: { codec, output, extension },
      });
    }
  }

  const final = steps.at(-1);
  if (final === undefined) {
    throw new ToolkitRuntimeError("E_INTERNAL_INVARIANT", "Expanded pipeline contains no executable steps.");
  }

  if ("convert" in final) {
    if (!isExtensionForFormat(output, final.convert.to)) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Final conversion target does not match the pipeline output extension.", {
        details: { target: final.convert.to, output, extension },
      });
    }
    const targetCodec = codecForFormat(final.convert.to);
    if (codec !== undefined && targetCodec !== undefined && targetCodec !== codec) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Pipeline output codec conflicts with the final conversion target.", {
        details: { codec, target: final.convert.to, expectedCodec: targetCodec },
      });
    }
    if (codec !== undefined && targetCodec === undefined) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Pipeline output codec cannot be declared for a non-video final conversion target.", {
        details: { codec, target: final.convert.to },
      });
    }
  }

  if ("resize" in final && final.resize.to !== undefined) {
    const expectedExtension = `.${final.resize.to}`;
    if (extension !== expectedExtension) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Final resize target does not match the pipeline output extension.", {
        details: { target: final.resize.to, output, extension },
      });
    }
    const targetCodec = codecForFormat(final.resize.to);
    if (codec !== undefined && targetCodec !== codec) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Pipeline output codec conflicts with the final resize target.", {
        details: { codec, target: final.resize.to, expectedCodec: targetCodec },
      });
    }
  }
}


export function validatePipelineResultCodec(
  document: PipelineDocument,
  media: MediaInfo | undefined,
): void {
  const codec = document.output.codec;
  if (codec === undefined || media === undefined) return;

  const actual = media.video[0]?.codecName;
  if (actual === codec) return;

  throw new ToolkitRuntimeError(
    "E_MEDIA_INCOMPATIBLE",
    "Pipeline final output does not satisfy the declared output codec.",
    { details: { expectedCodec: codec, actualCodec: actual ?? null, output: document.output.path } },
  );
}
