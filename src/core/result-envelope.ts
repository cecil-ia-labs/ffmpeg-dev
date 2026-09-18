import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import type {
  CommandExecution,
  ResultEnvelope,
  ToolkitWarning,
} from "../types/contracts.js";
import { toToolkitError, type ToolkitRuntimeError } from "./errors.js";

export interface ResultContext {
  command: string;
  requestId: string;
  startedAt: string;
  startedMonotonicMs: number;
}

export function createResultContext(command: string, requestId: string = randomUUID()): ResultContext {
  return {
    command,
    requestId,
    startedAt: new Date().toISOString(),
    startedMonotonicMs: performance.now(),
  };
}

function executionSummary(execution: CommandExecution): NonNullable<ResultEnvelope["execution"]> {
  return {
    binary: execution.binary,
    args: [...execution.args],
    ...(execution.cwd !== undefined ? { cwd: execution.cwd } : {}),
    exitCode: execution.exitCode,
    ...(execution.signal !== undefined ? { signal: execution.signal } : {}),
    executed: execution.executed,
    stdoutTruncated: execution.stdoutTruncated,
    stderrTruncated: execution.stderrTruncated,
  };
}

function timing(context: ResultContext): Pick<ResultEnvelope, "finishedAt" | "durationMs"> {
  return {
    finishedAt: new Date().toISOString(),
    durationMs: Math.max(0, performance.now() - context.startedMonotonicMs),
  };
}

export function createSuccessEnvelope<T>(
  context: ResultContext,
  data: T,
  options: { warnings?: readonly ToolkitWarning[]; execution?: CommandExecution } = {},
): ResultEnvelope<T> {
  return {
    schemaVersion: "1.0",
    ok: true,
    command: context.command,
    requestId: context.requestId,
    startedAt: context.startedAt,
    ...timing(context),
    data,
    warnings: [...(options.warnings ?? [])],
    error: null,
    ...(options.execution !== undefined ? { execution: executionSummary(options.execution) } : {}),
  };
}

export function createFailureEnvelope(
  context: ResultContext,
  error: ToolkitRuntimeError,
  options: { warnings?: readonly ToolkitWarning[]; execution?: CommandExecution } = {},
): ResultEnvelope<never> {
  return {
    schemaVersion: "1.0",
    ok: false,
    command: context.command,
    requestId: context.requestId,
    startedAt: context.startedAt,
    ...timing(context),
    warnings: [...(options.warnings ?? [])],
    error: toToolkitError(error),
    ...(options.execution !== undefined ? { execution: executionSummary(options.execution) } : {}),
  };
}
