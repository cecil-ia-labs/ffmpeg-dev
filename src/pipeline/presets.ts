import { ToolkitRuntimeError } from "../core/errors.js";
import type { ConcretePipelineStep, PipelineDocument, PipelineStep } from "./types.js";

function expandList(
  steps: readonly PipelineStep[],
  document: PipelineDocument,
  stack: readonly string[],
): ConcretePipelineStep[] {
  const expanded: ConcretePipelineStep[] = [];

  for (const step of steps) {
    if (!("preset" in step)) {
      expanded.push(step);
      continue;
    }

    const name = step.preset;
    const preset = document.presets[name];
    if (preset === undefined) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Pipeline references an unknown preset.", {
        details: { preset: name, availablePresets: Object.keys(document.presets).sort() },
      });
    }
    if (stack.includes(name)) {
      throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Pipeline preset cycle detected.", {
        details: { cycle: [...stack, name] },
      });
    }

    expanded.push(...expandList(preset, document, [...stack, name]));
  }

  return expanded;
}

export function expandPipelineSteps(document: PipelineDocument): ConcretePipelineStep[] {
  return expandList(document.steps, document, []);
}
