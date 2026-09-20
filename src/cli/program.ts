import { Command, Option } from "commander";
import { ZodError } from "zod";

import { VERSION } from "../version.js";
import { colorEnabled, normalLog } from "./colors.js";
import { validateGlobalCliOptions } from "./global-options.js";
import { configureSemanticHelp } from "./help-style.js";
import { registerCommandTree } from "./register-command-tree.js";

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "options"}: ${issue.message}`)
    .join("; ");
}

function friendlyHelpEnabled(): boolean {
  return !process.argv.includes("--no-color") && colorEnabled(true, process.stdout);
}

export function buildProgram(): Command {
  const program = new Command();
  const friendly = friendlyHelpEnabled();
  configureSemanticHelp(program, friendly);

  program
    .name("cecilia-ffmpeg")
    .description(
      `${friendly ? "🎞️\t\b\b\b\b" : ""} Agent-friendly TypeScript CLI for deterministic FFmpeg and FFprobe media workflows.`,
    )
    .version(VERSION, "-V, --version", normalLog("\t\t\t\b\b\b\bdisplay CLI version"))
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .option("--output <path>", normalLog("\t\t\t\b\b\b\bexplicit output path for commands that produce one file"))
    .option("--overwrite", normalLog("\t\t\t\b\b\b\ballow replacement of an existing destination"), false)
    .option("--dry-run", normalLog("\t\t\t\b\b\b\bvalidate and render the intended invocation without executing FFmpeg"), false)
    .option("--json", normalLog("\t\t\t\b\b\b\bemit the stable JSON result envelope on stdout"), false)
    .addOption(new Option("--quiet", normalLog("\t\t\t\b\b\b\bsuppress non-error human output")).conflicts("verbose"))
    .addOption(new Option("--verbose", normalLog("\t\t\t\b\b\b\bemit diagnostic details to stderr")).conflicts("quiet"))
    .option("--no-progress", normalLog("\t\t\t\b\b\b\bsuppress live human progress display"))
    .option("--no-color", normalLog("\t\t\t\b\b\b\bdisable ANSI colors and semantic icons in human output"))
    .option("--ffmpeg-path <path>", normalLog("\t\t\t\b\b\b\boverride FFmpeg binary resolution"))
    .option("--ffprobe-path <path>", normalLog("\t\t\t\b\b\b\boverride FFprobe binary resolution"))
    .option("--keep-temp", normalLog("\t\t\t\b\b\b\bpreserve temporary/intermediate artifacts for debugging"), false);

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
