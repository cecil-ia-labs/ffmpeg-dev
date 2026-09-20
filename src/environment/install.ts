import { stat } from "node:fs/promises";

import { runCommand, type RunCommandOptions } from "../core/command-result.js";
import { ToolkitRuntimeError } from "../core/errors.js";
import { resolveSafePath } from "../skill-runtime/paths.js";
import type { SkillExecutionContext } from "../skill-runtime/types.js";
import { resolveExecutable } from "./executable.js";

export const TOOLKIT_PACKAGE = "@cecilialabs/ffmpeg" as const;

export type ToolkitInstallScope = "global" | "local" | "npm-exec";

export interface InstallToolkitOptions {
  scope: ToolkitInstallScope;
  cwd?: string;
  context?: SkillExecutionContext;
  authorized?: boolean;
  dryRun?: boolean;
  signal?: AbortSignal;
  environment?: NodeJS.ProcessEnv;
}

export interface ToolkitInstallPlan {
  scope: ToolkitInstallScope;
  package: typeof TOOLKIT_PACKAGE;
  cwd: string;
  mutatesProject: boolean;
  command: string;
  args: string[];
  authorizationRequired: boolean;
  verification: string;
}

export interface ToolkitInstallReport {
  status: "planned" | "completed";
  plan: ToolkitInstallPlan;
  execution?: Awaited<ReturnType<typeof runCommand>>;
}

function planFor(scope: ToolkitInstallScope, cwd: string): ToolkitInstallPlan {
  switch (scope) {
    case "global":
      return {
        scope,
        package: TOOLKIT_PACKAGE,
        cwd,
        mutatesProject: false,
        command: "npm",
        args: ["install", "--global", "--no-audit", "--no-fund", TOOLKIT_PACKAGE],
        authorizationRequired: true,
        verification: "cecilia-ffmpeg environment check --json",
      };
    case "local":
      return {
        scope,
        package: TOOLKIT_PACKAGE,
        cwd,
        mutatesProject: true,
        command: "npm",
        args: ["install", "--no-audit", "--no-fund", TOOLKIT_PACKAGE],
        authorizationRequired: true,
        verification: "npx cecilia-ffmpeg environment check --json",
      };
    case "npm-exec":
      return {
        scope,
        package: TOOLKIT_PACKAGE,
        cwd,
        mutatesProject: false,
        command: "npm",
        args: [
          "exec",
          "--yes",
          "--package",
          TOOLKIT_PACKAGE,
          "--",
          "cecilia-ffmpeg",
          "environment",
          "check",
          "--json",
        ],
        authorizationRequired: true,
        verification:
          "The command above performs the check through npm exec without a persistent install.",
      };
  }
}

/** Plan or explicitly execute a package installation; never edits shell state. */
export async function installToolkit(
  options: InstallToolkitOptions,
): Promise<ToolkitInstallReport> {
  if (options.scope !== "global" && options.scope !== "local" && options.scope !== "npm-exec") {
    throw new ToolkitRuntimeError(
      "E_USAGE_INVALID_ARGUMENT",
      "Unknown toolkit installation scope.",
      {
        details: { scope: options.scope, supported: ["global", "local", "npm-exec"] },
      },
    );
  }
  const cwd = resolveSafePath(options.cwd ?? process.cwd(), { allowAbsolute: true });
  const cwdInfo = await stat(cwd).catch(() => undefined);
  if (!cwdInfo?.isDirectory()) {
    throw new ToolkitRuntimeError(
      "E_IO_PERMISSION_DENIED",
      "Installation working directory does not exist.",
      {
        details: { cwd },
      },
    );
  }

  const plan = planFor(options.scope, cwd);
  const contextMayInstall =
    options.context === undefined ||
    (options.context !== "chatgpt-regular" && options.context !== "unknown");
  if (!options.authorized || !contextMayInstall || options.dryRun)
    return { status: "planned", plan };

  const npm = await resolveExecutable("npm", {
    cwd,
    ...(options.environment !== undefined ? { env: options.environment } : {}),
  });
  if (npm === undefined) {
    throw new ToolkitRuntimeError(
      "E_ENV_NPM_NOT_FOUND",
      "npm is required for the toolkit installation flow.",
      {
        details: { scope: options.scope },
      },
    );
  }

  const runOptions: RunCommandOptions = {
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  };
  const execution = await runCommand(
    {
      binary: npm,
      args: plan.args,
      cwd,
      ...(options.environment !== undefined ? { env: options.environment } : {}),
    },
    runOptions,
  );
  if (execution.exitCode !== 0) {
    throw new ToolkitRuntimeError(
      "E_ENV_INSTALL_FAILED",
      `npm installation exited with code ${execution.exitCode ?? "unknown"}.`,
      {
        details: {
          scope: options.scope,
          package: TOOLKIT_PACKAGE,
          exitCode: execution.exitCode,
          stderrTail: execution.stderr ?? "",
          stdoutTail: execution.stdout ?? "",
        },
      },
    );
  }
  return { status: "completed", plan, execution };
}

export function installCommand(plan: ToolkitInstallPlan): string {
  return [plan.command, ...plan.args].join(" ");
}
