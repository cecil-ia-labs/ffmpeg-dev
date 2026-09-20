#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readText(path) {
  return readFile(new URL(path, root), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const required = [
  "src/core/binary-resolver.ts",
  "src/core/command-result.ts",
  "src/core/errors.ts",
  "src/core/ffmpeg-runner.ts",
  "src/core/ffprobe-runner.ts",
  "src/core/cancellation.ts",
  "src/core/temp-files.ts",
  "src/core/progress.ts",
  "src/core/result-envelope.ts",
  "src/core/capabilities.ts",
  "src/core/index.ts",
  "test/core/command-result.test.ts",
  "test/core/binary-resolver.test.ts",
  "test/core/ffmpeg-runner.test.ts",
  "test/core/ffprobe-runner.test.ts",
  "docs/development/runtime.md",
];

for (const path of required) await stat(new URL(path, root));

const pkg = await readJson("package.json");
const plugin = await readJson("plugin.json");
function versionAtLeast(version, minimum) {
  const parse = (value) => {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-alpha\.(\d+))?$/.exec(value);
    if (!match) return undefined;
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? Number.POSITIVE_INFINITY : Number(match[4])];
  };
  const left = parse(version);
  const right = parse(minimum);
  if (!left || !right) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] > right[i]) return true;
    if (left[i] < right[i]) return false;
  }
  return true;
}
assert(versionAtLeast(pkg.version, "0.1.0-alpha.2"), "Runtime verifier requires version >= 0.1.0-alpha.2");
assert(plugin.version === pkg.version, "Plugin/package version mismatch");
assert(!pkg.dependencies?.execa, "Runtime runtime should not depend on execa");

const processSource = await readText("src/core/command-result.ts");
assert(processSource.includes('from "node:child_process"'), "Runtime boundary must use node:child_process");
assert(processSource.includes("shell: false"), "Process spawning must explicitly disable shell execution");
assert(!/\beval\s*\(/.test(processSource), "Runtime must not use eval");
assert(!/\bexec(File)?\s*\(/.test(processSource), "Runtime must not use exec/execFile");

const ffmpegSource = await readText("src/core/ffmpeg-runner.ts");
const ffprobeSource = await readText("src/core/ffprobe-runner.ts");
assert(ffmpegSource.includes('kind: "ffmpeg"'), "FFmpeg runner must use binary resolver");
assert(ffprobeSource.includes('kind: "ffprobe"'), "FFprobe runner must use binary resolver");

const schema = await readJson("specs/output-envelope.schema.json");
const execution = schema.$defs?.execution;
for (const field of ["executed", "stdoutTruncated", "stderrTruncated"]) {
  assert(execution?.properties?.[field], `Execution schema missing ${field}`);
}

console.log(`Runtime verification passed for ${pkg.name}@${pkg.version}`);
console.log(`Checked ${required.length} Runtime files and runtime safety invariants.`);
