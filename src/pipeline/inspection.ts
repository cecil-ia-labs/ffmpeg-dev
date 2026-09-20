import path from "node:path";

import { expandPipelineSteps } from "./presets.js";
import { validatePipelineOutput } from "./validation.js";
import type {
  ConcretePipelineStep,
  LoadedPipeline,
  PipelineDocument,
  PipelineStepKind,
} from "./types.js";

export interface PipelineInspectionStep {
  index: number;
  kind: PipelineStepKind;
  declaration: ConcretePipelineStep;
}

export interface PipelineInspectionReport {
  operation: "pipeline.validate" | "pipeline.print";
  file: string;
  baseDirectory: string;
  input: string;
  output: string;
  stepCount: number;
  document: PipelineDocument;
  steps: PipelineInspectionStep[];
}

function finalOutput(loaded: LoadedPipeline, override?: string): string {
  const target = override ?? loaded.document.output.path;
  return path.isAbsolute(target) ? path.normalize(target) : path.resolve(loaded.baseDirectory, target);
}

function stepKind(step: ConcretePipelineStep): PipelineStepKind {
  if ("trim" in step) return "trim";
  if ("speed" in step) return "speed";
  if ("resize" in step) return "resize";
  if ("normalize" in step) return "normalize";
  if ("audio" in step) return "audio";
  return "convert";
}

export function inspectPipeline(
  loaded: LoadedPipeline,
  operation: "pipeline.validate" | "pipeline.print",
  outputOverride?: string,
): PipelineInspectionReport {
  const output = finalOutput(loaded, outputOverride);
  const declarations = expandPipelineSteps(loaded.document);
  validatePipelineOutput(loaded.document, declarations, output);

  return {
    operation,
    file: loaded.file,
    baseDirectory: loaded.baseDirectory,
    input: path.isAbsolute(loaded.document.input)
      ? path.normalize(loaded.document.input)
      : path.resolve(loaded.baseDirectory, loaded.document.input),
    output,
    stepCount: declarations.length,
    document: loaded.document,
    steps: declarations.map((declaration, offset) => ({
      index: offset + 1,
      kind: stepKind(declaration),
      declaration,
    })),
  };
}
