import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { resolveBinary } from "../../src/core/binary-resolver.js";

interface FixtureDefinition {
  id: string;
  file: string;
}

interface FixtureManifest {
  generatedDirectory: string;
  fixtures: FixtureDefinition[];
}

let manifestPromise: Promise<FixtureManifest> | undefined;

async function readManifest(): Promise<FixtureManifest> {
  manifestPromise ??= readFile(path.resolve("test/fixtures/manifest.json"), "utf8")
    .then((text) => JSON.parse(text) as FixtureManifest);
  return await manifestPromise;
}

export async function ensureFixtureMatrix(): Promise<boolean> {
  try {
    await resolveBinary({ kind: "ffmpeg" });
    await resolveBinary({ kind: "ffprobe" });
  } catch {
    return false;
  }

  const result = spawnSync(process.execPath, [path.resolve("scripts/generate-fixtures.mjs"), "--quiet"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Unable to generate the fixture matrix: ${result.stderr || result.stdout}`);
  }
  return true;
}

export async function fixturePath(id: string): Promise<string> {
  const manifest = await readManifest();
  const fixture = manifest.fixtures.find((item) => item.id === id);
  if (!fixture) throw new Error(`Unknown fixture id: ${id}`);
  return path.resolve(manifest.generatedDirectory, fixture.file);
}

export async function fixtureDefinitions(): Promise<readonly FixtureDefinition[]> {
  return (await readManifest()).fixtures;
}
