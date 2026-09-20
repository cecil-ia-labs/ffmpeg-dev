import { randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

import { ToolkitRuntimeError } from "../core/errors.js";

export async function resolveReadableFile(input: string, cwd = process.cwd()): Promise<string> {
  const source = path.isAbsolute(input) ? path.normalize(input) : path.resolve(cwd, input);
  let information;
  try {
    information = await stat(source);
  } catch (error: unknown) {
    const systemCode = (error as NodeJS.ErrnoException).code;
    if (systemCode === "ENOENT") {
      throw new ToolkitRuntimeError("E_INPUT_NOT_FOUND", `Input file does not exist: ${input}`, {
        details: { input, source },
        cause: error,
      });
    }
    throw new ToolkitRuntimeError("E_INPUT_UNREADABLE", `Unable to inspect input file: ${input}`, {
      details: { input, source, ...(systemCode !== undefined ? { systemCode } : {}) },
      cause: error,
    });
  }

  if (!information.isFile()) {
    throw new ToolkitRuntimeError("E_INPUT_UNREADABLE", `Input is not a regular file: ${input}`, {
      details: { input, source },
    });
  }

  try {
    await access(source, fsConstants.R_OK);
  } catch (error: unknown) {
    throw new ToolkitRuntimeError("E_INPUT_UNREADABLE", `Input file is not readable: ${input}`, {
      details: { input, source },
      cause: error,
    });
  }
  return source;
}

export function deriveOutputPath(
  source: string,
  suffix: string,
  explicitOutput?: string,
  options: { cwd?: string; defaultExtension?: string } = {},
): string {
  if (explicitOutput) {
    return path.isAbsolute(explicitOutput)
      ? path.normalize(explicitOutput)
      : path.resolve(options.cwd ?? process.cwd(), explicitOutput);
  }

  const parsed = path.parse(source);
  const extension = options.defaultExtension ?? (parsed.ext || ".mp4");
  return path.join(parsed.dir, `${parsed.name}.${suffix}${extension.startsWith(".") ? extension : `.${extension}`}`);
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export interface OutputPathPreflightOptions {
  source?: string;
  output: string;
  overwrite?: boolean;
}

export async function preflightOutputPath(options: OutputPathPreflightOptions): Promise<string> {
  const output = path.resolve(options.output);
  if (options.source && path.resolve(options.source) === output) {
    throw new ToolkitRuntimeError("E_CONFIG_CONFLICT", "Input and output paths must be different.", {
      details: { source: path.resolve(options.source), output },
    });
  }

  let exists = false;
  try {
    exists = await pathExists(output);
  } catch (error: unknown) {
    throw new ToolkitRuntimeError("E_IO_PERMISSION_DENIED", `Unable to inspect output path: ${output}`, {
      details: { output },
      cause: error,
    });
  }

  if (exists && !options.overwrite) {
    throw new ToolkitRuntimeError("E_IO_OUTPUT_EXISTS", `Output already exists: ${output}`, {
      details: { output, hint: "Pass --overwrite to replace it." },
    });
  }

  return output;
}

export interface OutputTransaction {
  output: string;
  temporary: string;
  finalize(): Promise<void>;
  cleanup(): Promise<void>;
}

export async function prepareOutputTransaction(options: {
  source?: string;
  output: string;
  overwrite?: boolean;
  dryRun?: boolean;
  keepTemp?: boolean;
}): Promise<OutputTransaction> {
  const output = await preflightOutputPath({
    ...(options.source !== undefined ? { source: options.source } : {}),
    output: options.output,
    ...(options.overwrite !== undefined ? { overwrite: options.overwrite } : {}),
  });

  const parsed = path.parse(output);
  const temporary = path.join(
    parsed.dir,
    `.${parsed.name}.cecilia-ffmpeg.${randomUUID()}.tmp${parsed.ext || ".mp4"}`,
  );

  if (!options.dryRun) {
    try {
      await mkdir(parsed.dir, { recursive: true });
      await access(parsed.dir, fsConstants.W_OK);
    } catch (error: unknown) {
      throw new ToolkitRuntimeError("E_IO_PERMISSION_DENIED", `Output directory is not writable: ${parsed.dir}`, {
        details: { output, directory: parsed.dir },
        cause: error,
      });
    }
  }

  return {
    output,
    temporary,
    async finalize(): Promise<void> {
      if (options.dryRun) return;
      try {
        const information = await stat(temporary);
        if (!information.isFile() || information.size <= 0) {
          throw new ToolkitRuntimeError("E_FFMPEG_EXECUTION_FAILED", "FFmpeg produced an empty output file.", {
            details: { temporary, output },
          });
        }
        if (options.overwrite) await rm(output, { force: true });
        await rename(temporary, output);
      } catch (error: unknown) {
        if (error instanceof ToolkitRuntimeError) throw error;
        throw new ToolkitRuntimeError("E_IO_PERMISSION_DENIED", `Unable to finalize output: ${output}`, {
          details: { temporary, output },
          cause: error,
        });
      }
    },
    async cleanup(): Promise<void> {
      if (options.dryRun || options.keepTemp) return;
      await rm(temporary, { force: true }).catch(() => undefined);
    },
  };
}
