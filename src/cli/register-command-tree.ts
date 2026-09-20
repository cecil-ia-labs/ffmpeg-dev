import type { Command } from "commander";

import { resolveCommandAction } from "./action-registry.js";
import { colorEnabled } from "./colors.js";
import type { CommandSpec } from "./command-spec.js";
import { COMMAND_TREE } from "./command-spec.js";
import { decorateCommandDescription } from "./icons.js";
import { configureSemanticHelp } from "./help-style.js";
import { configureVideoOptions } from "./video-options.js";
import { configureAudioOptions } from "./audio-options.js";
import { configureConversionOptions } from "./conversion-options.js";
import { configureCompositionOptions } from "./composition-options.js";
import { configureDiagnosticsOptions } from "./diagnostics-options.js";
import { configureStreamingOptions } from "./streaming-options.js";
import { configureImageOptions } from "./image-options.js";
import { runPlaceholder } from "./placeholder.js";

function commandPath(command: Command): string {
  const parts: string[] = [];
  let current: Command | null = command;
  while (current) {
    if (current.name()) parts.push(current.name());
    current = current.parent;

  }
  return parts.reverse().join(" ");
}

function friendlyHelpEnabled(): boolean {
  return !process.argv.includes("--no-color") && colorEnabled(true, process.stdout);
}

function registerSpec(parent: Command, spec: CommandSpec): void {
  const command = parent.command(spec.syntax);
  const path = commandPath(command);
  const friendly = friendlyHelpEnabled();
  configureSemanticHelp(command, friendly);
  command.description(
    friendly ? decorateCommandDescription(path, spec.description) : spec.description,
  );

  if (spec.children && spec.children.length > 0) {
    for (const child of spec.children) registerSpec(command, child);
    command.action(() => command.outputHelp());
    return;
  }

  configureVideoOptions(command, path);
  configureAudioOptions(command, path);
  configureConversionOptions(command, path);
  configureCompositionOptions(command, path);
  configureDiagnosticsOptions(command, path);
  configureStreamingOptions(command, path);
  configureImageOptions(command, path);
  const action = resolveCommandAction(path);
  if (action) {
    command.action((...args: unknown[]) => action(command, args.slice(0, -1)));
    return;
  }

  command.action(() => runPlaceholder(command, spec));
}

export function registerCommandTree(program: Command): void {
  for (const spec of COMMAND_TREE) registerSpec(program, spec);
}
