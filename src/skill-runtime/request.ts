import { readFile } from "node:fs/promises";

import { ToolkitRuntimeError } from "../core/errors.js";
import type { SkillScriptRequest } from "./types.js";

const MAX_REQUEST_BYTES = 1024 * 1024;

function validate(value: unknown): SkillScriptRequest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolkitRuntimeError(
      "E_USAGE_INVALID_ARGUMENT",
      "Skill script input must be a JSON object.",
    );
  }
  return value as SkillScriptRequest;
}

export async function readSkillScriptRequest(
  input: NodeJS.ReadableStream = process.stdin,
): Promise<SkillScriptRequest> {
  if (input === process.stdin && process.stdin.isTTY) return {};
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of input) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size > MAX_REQUEST_BYTES) {
      throw new ToolkitRuntimeError(
        "E_USAGE_INVALID_ARGUMENT",
        "Skill script request exceeds the 1 MiB limit.",
      );
    }
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (text.length === 0) return {};
  try {
    return validate(JSON.parse(text));
  } catch (error: unknown) {
    if (error instanceof ToolkitRuntimeError) throw error;
    throw new ToolkitRuntimeError(
      "E_USAGE_INVALID_ARGUMENT",
      "Skill script input is not valid JSON.",
      { cause: error },
    );
  }
}

export async function readSkillScriptRequestFile(file: string): Promise<SkillScriptRequest> {
  try {
    return validate(JSON.parse(await readFile(file, "utf8")));
  } catch (error: unknown) {
    if (error instanceof ToolkitRuntimeError) throw error;
    throw new ToolkitRuntimeError(
      "E_USAGE_INVALID_ARGUMENT",
      "Skill request file is not valid JSON.",
      {
        details: { file },
        cause: error,
      },
    );
  }
}
