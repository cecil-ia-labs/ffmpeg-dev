import { Option, type Command } from "commander";

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function addConversionTuningOptions(command: Command): void {
  command
    .option("--fps <fps>", "target frame rate for animated/image conversion")
    .option("--width <pixels>", "resize output to this width while preserving aspect ratio")
    .option("--quality <value>", "WebP quality from 0 to 100")
    .option("--max-colors <count>", "GIF palette size from 2 to 256")
    .option("--loop <count>", "animation loop count; 0 means infinite");
}

export function configureMilestone6Options(command: Command, path: string): void {
  switch (path) {
    case "cecilia-ffmpeg convert file":
      command
        .requiredOption("--to <format>", "target format: webm, gif, webp, or png")
        .option("--from <format>", "explicit source format: mp4, webm, gif, or webp");
      addConversionTuningOptions(command);
      break;
    case "cecilia-ffmpeg convert batch":
      command
        .requiredOption("--from <format>", "source extension/format selector: mp4, webm, gif, or webp")
        .requiredOption("--to <format>", "target format: webm, gif, webp, or png")
        .option("--recursive", "scan subdirectories recursively", false)
        .option("--include <pattern>", "include glob pattern; repeatable", collect, [])
        .option("--exclude <pattern>", "exclude glob pattern; repeatable", collect, [])
        .option("--parallelism <count>", "maximum concurrent conversions", "2")
        .addOption(new Option("--fail-fast", "stop scheduling new work after the first failure").conflicts("continueOnError"))
        .addOption(new Option("--continue-on-error", "continue converting after item failures").conflicts("failFast"))
        .option("--output-dir <directory>", "write batch outputs under this directory")
        .option("--no-preserve-hierarchy", "flatten discovered files into the output directory")
        .option("--existing <strategy>", "existing output strategy: error, skip, or replace");
      addConversionTuningOptions(command);
      break;
    default:
      break;
  }
}
