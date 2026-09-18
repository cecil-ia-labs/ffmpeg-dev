import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ToolkitRuntimeError } from "./errors.js";

export interface TemporaryWorkspaceOptions {
  prefix?: string;
  baseDirectory?: string;
  keep?: boolean;
}

export class TemporaryWorkspace {
  readonly directory: string;
  readonly keep: boolean;
  private cleaned = false;

  private constructor(directory: string, keep: boolean) {
    this.directory = directory;
    this.keep = keep;
  }

  static async create(options: TemporaryWorkspaceOptions = {}): Promise<TemporaryWorkspace> {
    const baseDirectory = options.baseDirectory ?? os.tmpdir();
    const prefix = options.prefix ?? "cecilia-ffmpeg-";
    await mkdir(baseDirectory, { recursive: true });
    const directory = await mkdtemp(path.join(baseDirectory, prefix));
    return new TemporaryWorkspace(directory, options.keep ?? false);
  }

  pathFor(relativePath: string): string {
    if (!relativePath || path.isAbsolute(relativePath)) {
      throw new ToolkitRuntimeError("E_INTERNAL_INVARIANT", "Temporary path must be relative.", {
        details: { relativePath },
      });
    }

    const resolved = path.resolve(this.directory, relativePath);
    const relative = path.relative(this.directory, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new ToolkitRuntimeError("E_INTERNAL_INVARIANT", "Temporary path escapes its workspace.", {
        details: { relativePath },
      });
    }
    return resolved;
  }

  async ensureDirectory(relativePath: string): Promise<string> {
    const resolved = this.pathFor(relativePath);
    await mkdir(resolved, { recursive: true });
    return resolved;
  }

  async cleanup(): Promise<void> {
    if (this.cleaned || this.keep) return;
    this.cleaned = true;
    await rm(this.directory, { recursive: true, force: true });
  }
}

export async function withTemporaryWorkspace<T>(
  options: TemporaryWorkspaceOptions,
  callback: (workspace: TemporaryWorkspace) => Promise<T>,
): Promise<T> {
  const workspace = await TemporaryWorkspace.create(options);
  try {
    return await callback(workspace);
  } finally {
    await workspace.cleanup();
  }
}
