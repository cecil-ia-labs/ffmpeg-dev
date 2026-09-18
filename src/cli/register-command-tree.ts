import type { Command } from "commander";

import { resolveCommandAction } from "./action-registry.js";
import { COMMAND_TREE } from "./command-spec.js";
import { configureMilestone4Options } from "./milestone-4-options.js";
import { configureMilestone5Options } from "./milestone-5-options.js";
import { configureMilestone6Options } from "./milestone-6-options.js";
import { configureMilestone7Options } from "./milestone-7-options.js";
import { configureMilestone8Options } from "./milestone-8-options.js";
import { configureMilestone9Options } from "./milestone-9-options.js";
import type { CommandSpec } from "./command-spec.js";
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

function registerSpec(parent: Command, spec: CommandSpec): void {
  const command = parent.command(spec.syntax).description(spec.description);

  if (spec.children && spec.children.length > 0) {
    for (const child of spec.children) registerSpec(command, child);
    command.action(() => command.outputHelp());
    return;
  }

  const path = commandPath(command);
  configureMilestone4Options(command, path);
  configureMilestone5Options(command, path);
  configureMilestone6Options(command, path);
  configureMilestone7Options(command, path);
  configureMilestone8Options(command, path);
  configureMilestone9Options(command, path);
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
