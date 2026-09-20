import type { Command } from "commander";

const CONTEXTS = [
  "chatgpt-regular",
  "chatgpt-work",
  "codex",
  "ide",
  "terminal",
  "unknown",
] as const;

export function configureEnvironmentOptions(command: Command, commandPath: string): void {
  if (commandPath === "cecilia-ffmpeg environment check") {
    command
      .option("--context <context>", `execution context (${CONTEXTS.join("|")})`)
      .option("--output-path <path>", "check whether a target output path is writable")
      .option("--toolkit-path <path>", "override cecilia-ffmpeg resolution");
  }
  if (commandPath === "cecilia-ffmpeg environment install") {
    command
      .option("--scope <scope>", "installation scope: global, local, or npm-exec", "npm-exec")
      .option("--context <context>", `execution context (${CONTEXTS.join("|")})`, "terminal")
      .option("--apply", "execute the planned npm command")
      .option("--authorize", "confirm that this installation may change package state");
  }
}
