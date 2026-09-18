import type { Command } from "commander";

export function configureMilestone4Options(command: Command, path: string): void {
  switch (path) {
    case "cecilia-ffmpeg video trim-start":
    case "cecilia-ffmpeg video trim-end":
      command.requiredOption("--seconds <seconds>", "seconds to remove").option("--mode <mode>", "trim mode: auto, copy, or accurate", "auto");
      break;
    case "cecilia-ffmpeg video trim":
      command
        .option("--start <seconds>", "range start in seconds", "0")
        .option("--end <seconds>", "range end in seconds")
        .option("--duration <seconds>", "range duration in seconds")
        .option("--mode <mode>", "trim mode: auto, copy, or accurate", "auto");
      break;
    case "cecilia-ffmpeg video speed":
      command
        .requiredOption("--factor <factor>", "playback-speed multiplier")
        .option("--audio <mode>", "audio handling: sync or drop", "sync");
      break;
    case "cecilia-ffmpeg video from-image":
      command
        .option("--duration <seconds>", "clip duration in seconds", "5")
        .option("--resolution <widthxheight>", "output resolution", "1920x1080")
        .option("--fps <fps>", "output frame rate", "30")
        .option("--pixel-format <format>", "output pixel format", "yuv420p");
      break;
    case "cecilia-ffmpeg video restore":
      command
        .requiredOption("--resolution <widthxheight>", "target resolution")
        .option("--profile <profile>", "restore profile: balanced or aggressive", "balanced")
        .option("--fps <fps>", "optional output frame rate")
        .option("--crf <crf>", "encoder quality CRF")
        .option("--preset <preset>", "encoder preset");
      break;
    default:
      break;
  }
}
