import { access, lstat, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import { ToolkitRuntimeError } from "../core/errors.js";

export interface SafePathOptions {
  cwd?: string;
  root?: string;
  allowAbsolute?: boolean;
}

function invalidPath(value: string, reason: string): ToolkitRuntimeError {
  return new ToolkitRuntimeError("E_USAGE_INVALID_ARGUMENT", `Unsafe path: ${reason}`, {
    details: { path: value, reason },
  });
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

/** Resolve a user path without invoking a shell or allowing root traversal. */
export function resolveSafePath(value: string, options: SafePathOptions = {}): string {
  if (typeof value !== "string" || value.length === 0) {
    throw invalidPath(value, "path must be a non-empty string");
  }
  if (value.includes("\0")) throw invalidPath(value, "NUL bytes are not allowed");

  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (path.isAbsolute(value) && options.allowAbsolute === false) {
    throw invalidPath(value, "absolute paths are not allowed for this operation");
  }

  const candidate = path.resolve(cwd, value);
  if (options.root !== undefined) {
    const root = path.resolve(options.root);
    if (!isWithin(root, candidate)) throw invalidPath(value, "path escapes the allowed root");
  }
  return candidate;
}

async function existingParent(candidate: string): Promise<string> {
  let current = path.dirname(candidate);
  while (true) {
    try {
      await lstat(current);
      return current;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        const parent = path.dirname(current);
        if (parent === current) return current;
        current = parent;
        continue;
      }
      throw error;
    }
  }
}

export interface WritablePathReport {
  path: string;
  exists: boolean;
  writable: boolean;
  parent: string;
}

/** Check an output path without creating, truncating, or replacing anything. */
export async function inspectWritablePath(
  value: string,
  options: SafePathOptions = {},
): Promise<WritablePathReport> {
  const candidate = resolveSafePath(value, {
    ...options,
    allowAbsolute: options.allowAbsolute ?? true,
  });
  let exists = false;
  try {
    const info = await lstat(candidate);
    exists = true;
    if (info.isDirectory()) {
      throw new ToolkitRuntimeError("E_IO_PERMISSION_DENIED", "Output path is a directory.", {
        details: { path: candidate },
      });
    }
  } catch (error: unknown) {
    if (error instanceof ToolkitRuntimeError) throw error;
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT"))
      throw error;
  }

  const parent = await existingParent(candidate);
  const parentInfo = await stat(parent);
  if (!parentInfo.isDirectory()) {
    throw new ToolkitRuntimeError("E_IO_PERMISSION_DENIED", "Output parent is not a directory.", {
      details: { path: candidate, parent },
    });
  }
  try {
    await access(parent, constants.W_OK);
  } catch (error: unknown) {
    throw new ToolkitRuntimeError("E_IO_PERMISSION_DENIED", "Output directory is not writable.", {
      details: { path: candidate, parent },
      cause: error,
    });
  }

  try {
    await realpath(parent);
  } catch {
    // The access check above is authoritative; realpath is only useful for
    // hosts where a parent disappears during a read-only inspection.
  }

  return { path: candidate, exists, writable: true, parent };
}
