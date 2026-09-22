import { readSkillScriptRequest } from "../skill-runtime/request.js";
import { runSkillScript } from "../skill-runtime/runner.js";
import type {
  ExecutionContextInfo,
  SkillResultEnvelope,
  SkillScriptHandlerContext,
  SkillScriptHandlerResult,
  SkillScriptRequest,
} from "../skill-runtime/types.js";
import { ToolkitRuntimeError } from "../core/errors.js";
import { resolveSafePath } from "../skill-runtime/paths.js";

export type SkillInput = Record<string, unknown>;

export function objectInput(value: unknown): SkillInput {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", "input must be a JSON object");
  }
  return value as SkillInput;
}

export function requiredString(input: SkillInput, name: string): string {
  const value = input[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be a non-empty string`, {
      details: { name },
    });
  }
  return value;
}

export function optionalString(input: SkillInput, name: string): string | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be a non-empty string`, {
      details: { name },
    });
  }
  return value;
}

export function requiredNumber(input: SkillInput, name: string): number {
  const value = input[name];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be a finite number`, {
      details: { name },
    });
  }
  return value;
}

export function optionalNumber(input: SkillInput, name: string): number | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be a finite number`, {
      details: { name },
    });
  }
  return value;
}

export function optionalBoolean(input: SkillInput, name: string): boolean | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be a boolean`, {
      details: { name },
    });
  }
  return value;
}

export function optionalStringArray(input: SkillInput, name: string): string[] | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string" && entry.length > 0)) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be an array of non-empty strings`, {
      details: { name },
    });
  }
  return [...value] as string[];
}

export function requiredStringArray(input: SkillInput, name: string): string[] {
  const values = optionalStringArray(input, name);
  if (values === undefined || values.length === 0) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must contain at least one string`, {
      details: { name },
    });
  }
  return values;
}

export function enumValue<T extends string>(
  input: SkillInput,
  name: string,
  allowed: readonly T[],
): T | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} must be one of: ${allowed.join(", ")}`, {
      details: { name, allowed },
    });
  }
  return value as T;
}

export function requiredEnum<T extends string>(
  input: SkillInput,
  name: string,
  allowed: readonly T[],
): T {
  const value = enumValue(input, name, allowed);
  if (value === undefined) {
    throw new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `${name} is required`, {
      details: { name, allowed },
    });
  }
  return value;
}

export function inputPath(
  input: SkillInput,
  name: string,
  request: SkillScriptRequest<SkillInput>,
): string {
  return resolveSafePath(requiredString(input, name), {
    cwd: request.cwd ?? process.cwd(),
  });
}

export function runtimeOptions(
  input: SkillInput,
  request: SkillScriptRequest<SkillInput>,
  context: ExecutionContextInfo,
  signal: AbortSignal,
): Record<string, unknown> {
  const cwd = optionalString(input, "cwd") ?? request.cwd;
  const output = optionalString(input, "output");
  const ffmpegPath = optionalString(input, "ffmpegPath");
  const ffprobePath = optionalString(input, "ffprobePath");
  const hardwareDevice = optionalString(input, "hardwareDevice");
  const hardware = enumValue(input, "hardware", ["auto", "software", "nvenc", "qsv", "vaapi", "videotoolbox"] as const);
  const options: Record<string, unknown> = {
    dryRun: request.dryRun === true || !context.canExecuteScripts,
    signal,
  };
  const overwrite = optionalBoolean(input, "overwrite");
  const verbose = optionalBoolean(input, "verbose");
  const keepTemp = optionalBoolean(input, "keepTemp");
  const hardwareStrict = optionalBoolean(input, "hardwareStrict");
  if (cwd !== undefined) options["cwd"] = cwd;
  if (output !== undefined) options["output"] = output;
  if (ffmpegPath !== undefined) options["ffmpegPath"] = ffmpegPath;
  if (ffprobePath !== undefined) options["ffprobePath"] = ffprobePath;
  if (overwrite !== undefined) options["overwrite"] = overwrite;
  if (verbose !== undefined) options["verbose"] = verbose;
  if (keepTemp !== undefined) options["keepTemp"] = keepTemp;
  if (hardware !== undefined) options["hardware"] = hardware;
  if (hardwareDevice !== undefined) options["hardwareDevice"] = hardwareDevice;
  if (hardwareStrict !== undefined) options["hardwareStrict"] = hardwareStrict;
  return options;
}

export function contextPlan(
  input: SkillInput,
  context: ExecutionContextInfo,
  next: string,
): SkillScriptHandlerResult<Record<string, unknown>> | undefined {
  if (context.canExecuteScripts) return undefined;
  return {
    status: "planned",
    input,
    output: {
      planned: true,
      context: context.name,
      message: "This host cannot execute Skill scripts; run the associated script in Codex, Work, or a local terminal.",
    },
    next: [next],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function artifactsForReport(report: unknown): SkillResultEnvelope["artifacts"] {
  if (!isRecord(report)) return [];
  const planned = report["planned"] === true;
  const operation = report["operation"];

  if (operation === "convert-batch") {
    const outputDirectory = report["outputDirectory"];
    if (typeof outputDirectory !== "string") return [];
    const failed = report["failed"];
    if (typeof failed === "number" && failed > 0) return [];
    return [{ kind: "directory", path: outputDirectory, verified: !planned }];
  }

  const output = report["output"];
  if (typeof output !== "string") return [];

  const producesFile =
    isRecord(report["outputMedia"]) ||
    (typeof operation === "string" && [
      "add-silence", "attach", "convert-file", "from-image", "normalize",
      "remove-silence", "restore", "silence", "speed", "telephony", "trim",
      "trim-end", "trim-start", "upscale",
    ].includes(operation));
  if (!producesFile) return [];
  return [{ kind: "file", path: output, verified: !planned && isRecord(report["outputMedia"]) }];
}

function batchFailure(report: unknown): ToolkitRuntimeError | undefined {
  if (!isRecord(report) || report["operation"] !== "convert-batch") return undefined;
  const failed = report["failed"];
  if (typeof failed !== "number" || failed <= 0) return undefined;

  const items = Array.isArray(report["items"]) ? report["items"] : [];
  const failedItems = items.filter((item): item is Record<string, unknown> =>
    isRecord(item) && item["status"] === "failed",
  ).map((item) => ({
    input: item["input"],
    output: item["output"],
    error: item["error"],
  }));

  return new ToolkitRuntimeError("E_BATCH_PARTIAL_FAILURE", "Batch conversion completed with failed items.", {
    details: {
      directory: report["directory"],
      outputDirectory: report["outputDirectory"],
      discovered: report["discovered"],
      attempted: report["attempted"],
      succeeded: report["succeeded"],
      failed,
      skipped: report["skipped"],
      failedItems,
      recovery: "Fix or remove the failed inputs, then retry the failed items; successful outputs remain usable.",
    },
  });
}

export function reportResult(
  input: SkillInput,
  report: unknown,
  next: readonly string[] = [],
): SkillScriptHandlerResult<unknown> {
  const failure = batchFailure(report);
  if (failure !== undefined) throw failure;

  const warnings = isRecord(report) && Array.isArray(report["warnings"]) ? report["warnings"] : [];
  const planned = isRecord(report) && report["planned"] === true;
  return {
    ...(planned ? { status: "planned" as const } : {}),
    input,
    output: report,
    artifacts: artifactsForReport(report),
    warnings: warnings as SkillResultEnvelope["warnings"],
    next,
  };
}

type SkillHandler = (
  context: SkillScriptHandlerContext<SkillInput>,
) => Promise<SkillScriptHandlerResult<unknown>>;

export async function executeSkillScript(operation: string, handler: SkillHandler): Promise<void> {
  let request: SkillScriptRequest<SkillInput> = {};
  let requestError: unknown;
  try {
    request = await readSkillScriptRequest() as SkillScriptRequest<SkillInput>;
  } catch (error: unknown) {
    requestError = error;
  }

  process.exitCode = await runSkillScript<SkillInput, unknown>({
    operation,
    request,
    handler: async (context) => {
      if (requestError !== undefined) throw requestError;
      return await handler(context);
    },
  });
}
