import { Option, type Command } from "commander";

const TRANSITIONS = "fade, fadeblack, fadewhite, wipeleft, wiperight, slideup, slidedown, circleopen, circleclose, dissolve, pixelize, or distance";

function addNormalizeOptions(command: Command): void {
  command
    .option("--width <pixels>", "normalized output width")
    .option("--height <pixels>", "normalized output height")
    .option("--fps <fps>", "normalized output frame rate", "30");
}

function addAudioOption(command: Command): void {
  command.option("--audio <mode>", "audio policy: auto, preserve, or drop", "auto");
}

export function configureMilestone7Options(command: Command, path: string): void {
  switch (path) {
    case "cecilia-ffmpeg compose concat":
      command
        .option("--transition <name>", `transition: none or ${TRANSITIONS}`, "none")
        .option("--transition-duration <seconds>", "transition duration in seconds", "1");
      addNormalizeOptions(command);
      addAudioOption(command);
      break;
    case "cecilia-ffmpeg compose transition":
      command
        .option("--transition <name>", `xfade transition: ${TRANSITIONS}`, "fade")
        .option("--duration <seconds>", "transition duration in seconds", "1")
        .option("--offset <seconds>", "transition start offset in the left input");
      addNormalizeOptions(command);
      addAudioOption(command);
      break;
    case "cecilia-ffmpeg compose slideshow":
      command
        .option("--width <pixels>", "output width", "1280")
        .option("--height <pixels>", "output height", "720")
        .option("--fps <fps>", "output frame rate", "30")
        .option("--duration <seconds>", "total slideshow duration", "10")
        .option("--background <color>", "background color", "black")
        .addOption(new Option("--direction <direction>", "vertical travel direction: up or down").choices(["up", "down"]).default("up"))
        .option("--no-intro", "do not include an empty-screen intro")
        .option("--outro", "include an empty-screen outro", false)
        .option("--recursive", "discover images recursively", false);
      break;
    default:
      break;
  }
}
