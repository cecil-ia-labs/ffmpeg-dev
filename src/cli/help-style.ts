import type { Command } from "commander";

import {
  brandCyan,
  brandGreen,
  brandMagenta,
} from "./colors.js";

export function configureSemanticHelp(command: Command, enabled: boolean): void {
  if (!enabled) return;

  command.configureHelp({
    styleTitle: brandGreen,
    styleUsage: brandCyan,
    styleCommandText: brandCyan,
    styleSubcommandTerm: brandGreen,
    styleOptionTerm: brandCyan,
    styleArgumentTerm: brandMagenta,
  });
}
