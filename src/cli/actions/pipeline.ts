import type { Command } from "commander";

import { ToolkitRuntimeError } from "../../core/errors.js";
import { executePipeline, loadPipelineFile, type PipelineReport } from "../../pipeline/index.js";
import { executeAction } from "./shared.js";

function pipelineAt(positional: readonly unknown[]): string {
  const value = positional[0];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ToolkitRuntimeError("E_USAGE_MISSING_ARGUMENT", "run requires a pipeline YAML file.");
  }
  return value;
}

function renderPipelineReport(report: PipelineReport): string {
  const lines = [
    `run pipeline${report.planned ? " (dry run)" : ""}`,
    `Pipeline: ${report.file}`,
    `Input: ${report.source}`,
    `Output: ${report.output}`,
    `Steps: ${report.stepCount}`,
  ];

  for (const step of report.steps) {
    lines.push(`  ${step.index}. ${step.kind}${step.planned ? " [planned]" : " [done]"} -> ${step.output}`);
  }
  if (report.workspace !== undefined) lines.push(`Workspace: ${report.workspace}`);
  return lines.join("\n");
}

export async function runPipelineAction(command: Command, positional: readonly unknown[]): Promise<void> {
  await executeAction(command, async (global, signal) => {
    const loaded = await loadPipelineFile(pipelineAt(positional));
    const report = await executePipeline(loaded, {
      ...(global.output !== undefined ? { output: global.output } : {}),
      overwrite: global.overwrite,
      dryRun: global.dryRun,
      verbose: global.verbose,
      ...(global.ffmpegPath !== undefined ? { ffmpegPath: global.ffmpegPath } : {}),
      ...(global.ffprobePath !== undefined ? { ffprobePath: global.ffprobePath } : {}),
      signal,
      keepTemp: global.keepTemp,
    });
    return { data: report, warnings: report.warnings };
  }, renderPipelineReport);
}
