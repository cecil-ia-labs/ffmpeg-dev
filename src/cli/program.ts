import { Command, Option } from "commander";
import { ZodError } from "zod";

import { VERSION } from "../version.js";
import { validateGlobalCliOptions } from "./global-options.js";
import { registerCommandTree } from "./register-command-tree.js";

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "options"}: ${issue.message}`)
    .join("; ");
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("cecilia-ffmpeg")
    .description(
      "Agent-friendly TypeScript CLI for deterministic FFmpeg and FFprobe media workflows.",
    )
    .version(VERSION, "-V, --version", "display CLI version")
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .option("--output <path>", "explicit output path for commands that produce one file")
    .option("--overwrite", "allow replacement of an existing destination", false)
    .option("--dry-run", "validate and render the intended invocation without executing FFmpeg", false)
    .option("--json", "emit the stable JSON result envelope on stdout", false)
    .addOption(new Option("--quiet", "suppress non-error human output").conflicts("verbose"))
    .addOption(new Option("--verbose", "emit diagnostic details to stderr").conflicts("quiet"))
    .option("--ffmpeg-path <path>", "override FFmpeg binary resolution")
    .option("--ffprobe-path <path>", "override FFprobe binary resolution")
    .option("--keep-temp", "preserve temporary/intermediate artifacts for debugging", false);

  program.hook("preAction", (_thisCommand, actionCommand) => {
    try {
      validateGlobalCliOptions(actionCommand.optsWithGlobals());
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        actionCommand.error(`Invalid global options: ${formatZodError(error)}`, {
          exitCode: 2,
          code: "E_USAGE_INVALID_ARGUMENT",
        });
        return;
      }
      throw error;
    }
  });

  registerCommandTree(program);
  return program;
}
