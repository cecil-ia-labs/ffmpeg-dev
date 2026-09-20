import type { CallToolResult } from "@modelcontextprotocol/server";

import { isToolkitRuntimeError, toToolkitError } from "../core/errors.js";

/**
 * Structural runtime subset accepted from Zod-inferred MCP tool inputs.
 *
 * With exactOptionalPropertyTypes enabled, Zod optional fields are inferred
 * as properties whose value may explicitly be undefined. Reflect that here so
 * every validated tool input remains assignable without weakening the schemas
 * or casting at the adapter boundary.
 */
export interface CommonMcpRuntimeInput {
  output?: string | undefined;
  overwrite?: boolean | undefined;
  dry_run?: boolean | undefined;
  verbose?: boolean | undefined;
  ffmpeg_path?: string | undefined;
  ffprobe_path?: string | undefined;
  cwd?: string | undefined;
  keep_temp?: boolean | undefined;
}

export function runtimeOptions(input: CommonMcpRuntimeInput, signal: AbortSignal) {
  return {
    ...(input.output !== undefined ? { output: input.output } : {}),
    ...(input.overwrite !== undefined ? { overwrite: input.overwrite } : {}),
    ...(input.dry_run !== undefined ? { dryRun: input.dry_run } : {}),
    ...(input.verbose !== undefined ? { verbose: input.verbose } : {}),
    ...(input.ffmpeg_path !== undefined ? { ffmpegPath: input.ffmpeg_path } : {}),
    ...(input.ffprobe_path !== undefined ? { ffprobePath: input.ffprobe_path } : {}),
    ...(input.cwd !== undefined ? { cwd: input.cwd } : {}),
    ...(input.keep_temp !== undefined ? { keepTemp: input.keep_temp } : {}),
    signal,
  };
}

function jsonValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function structuredObject(value: unknown): Record<string, unknown> {
  const serialized = jsonValue(value);
  if (serialized !== null && typeof serialized === "object" && !Array.isArray(serialized)) {
    return serialized as Record<string, unknown>;
  }
  return { result: serialized };
}

export function toolSuccess(value: unknown): CallToolResult {
  const structuredContent = structuredObject(value);
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

export function toolFailure(error: unknown): CallToolResult {
  const failure = isToolkitRuntimeError(error)
    ? toToolkitError(error)
    : {
        code: "E_INTERNAL_INVARIANT",
        message: error instanceof Error ? error.message : String(error),
        category: "internal",
        retryable: false,
      };
  const structuredContent = { error: structuredObject(failure) };
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: true,
  };
}

export async function executeMcpOperation(operation: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return toolSuccess(await operation());
  } catch (error: unknown) {
    return toolFailure(error);
  }
}
