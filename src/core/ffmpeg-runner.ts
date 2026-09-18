import type { CommandExecution, FFmpegInvocation } from "../types/contracts.js";
import { resolveBinary } from "./binary-resolver.js";
import { renderCommandForDisplay, runCommand, type RunCommandOptions } from "./command-result.js";
import { ToolkitRuntimeError } from "./errors.js";

export interface FFmpegRunOptions extends RunCommandOptions {
  ffmpegPath?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

function executionDetails(execution: CommandExecution): Record<string, unknown> {
  return {
    binary: execution.binary,
    args: execution.args,
    exitCode: execution.exitCode,
    ...(execution.signal !== undefined ? { signal: execution.signal } : {}),
    ...(execution.stderr ? { stderrTail: execution.stderr } : {}),
    ...(execution.stdout ? { stdoutTail: execution.stdout } : {}),
    stderrTruncated: execution.stderrTruncated,
    stdoutTruncated: execution.stdoutTruncated,
  };
}

export async function runFFmpeg(
  args: readonly string[],
  options: FFmpegRunOptions = {},
): Promise<CommandExecution> {
  const env = { ...process.env, ...(options.env ?? {}) };
  const binary = await resolveBinary({
    kind: "ffmpeg",
    ...(options.ffmpegPath !== undefined ? { explicitPath: options.ffmpegPath } : {}),
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
    env,
  });

  const invocation: FFmpegInvocation = {
    binary,
    args: [...args],
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
    env,
  };

  let execution: CommandExecution;
  try {
    execution = await runCommand(invocation, options);
  } catch (error: unknown) {
    if (
      error instanceof ToolkitRuntimeError &&
      error.code === "E_INTERNAL_INVARIANT" &&
      error.details?.["systemCode"] === "ENOENT"
    ) {
      throw new ToolkitRuntimeError("E_ENV_FFMPEG_NOT_FOUND", "FFmpeg disappeared before execution.", {
        details: { command: renderCommandForDisplay(invocation) },
        cause: error,
      });
    }
    throw error;
  }

  if (execution.exitCode !== 0) {
    throw new ToolkitRuntimeError(
      "E_FFMPEG_EXECUTION_FAILED",
      `FFmpeg exited with code ${execution.exitCode ?? "unknown"}.`,
      { details: executionDetails(execution) },
    );
  }

  return execution;
}
