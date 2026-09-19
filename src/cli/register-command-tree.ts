import type { Command } from "commander";

import { resolveCommandAction } from "./action-registry.js";
import { colorEnabled } from "./colors.js";
import type { CommandSpec } from "./command-spec.js";
import { COMMAND_TREE } from "./command-spec.js";
import { decorateCommandDescription } from "./icons.js";
import { configureMilestone4Options } from "./milestone-4-options.js";
import { configureMilestone5Options } from "./milestone-5-options.js";
import { configureMilestone6Options } from "./milestone-6-options.js";
import { configureMilestone7Options } from "./milestone-7-options.js";
import { configureMilestone8Options } from "./milestone-8-options.js";
import { configureMilestone9Options } from "./milestone-9-options.js";
import { configureMilestone13_5Options } from "./milestone-13-5-options.js";
import { runPlaceholder } from "./placeholder.js";

function commandPath(command: Command): string {
  const parts: string[] = [];
  let current: Command | null = command;
  while (current) {
    // let _c =`${wrap(line, codes.bold, codes.brightCyan)}`
    if (current.name()) parts.push(current.name());
    // if (current.name()) parts.push(`${wrap(current.name(), codes.brightRed, )}`);
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
  // const path =`${wrap(commandPath(command), codes.bold, codes.brightCyan)}`
  command.description(
    friendlyHelpEnabled() ? decorateCommandDescription(path, spec.description) : spec.description,
  );

  if (spec.children && spec.children.length > 0) {
    for (const child of spec.children) registerSpec(command, child);
    command.action(() => command.outputHelp());
    return;
  }

  configureMilestone4Options(command, path);
  configureMilestone5Options(command, path);
  configureMilestone6Options(command, path);
  configureMilestone7Options(command, path);
  configureMilestone8Options(command, path);
  configureMilestone9Options(command, path);
  configureMilestone13_5Options(command, path);
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
