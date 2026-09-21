#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";


const root = new URL("../", import.meta.url);

async function readText(path) {
  return readFile(new URL(path, root), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function walk(path) {
  const base = new URL(path, root);
  const entries = await readdir(base, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), base);
    if (entry.isDirectory()) {
      files.push(...(await walk(path + entry.name + "/")));
    } else {
      files.push(child);
    }
  }

  return files;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredFiles = [
  "plugin.json",
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
  "eslint.config.js",
  ".prettierrc.json",
  "README.md",
  "LICENSE",
  "src/cli.ts",
  "src/cli/program.ts",
  "src/cli/global-options.ts",
  "src/cli/command-spec.ts",
  "src/cli/register-command-tree.ts",
  "src/index.ts",
  "test/cli/help.test.ts",
  "skills/README.md",
  "assets/README.md",
];

for (const path of requiredFiles) {
  await stat(new URL(path, root));
}

const pkg = await readJson("package.json");
const plugin = await readJson("plugin.json");
const identity = await readJson("specs/project-identity.json");
const versionSource = await readText("src/version.ts");
const versionMatch = versionSource.match(/VERSION\s*=\s*"([^"]+)"/);

assert(pkg.name === "@cecilialabs/ffmpeg", "Unexpected npm package name");
assert(pkg.bin?.["cecilia-ffmpeg"] === "./dist/cli.js", "Unexpected npm bin mapping");
assert(pkg.type === "module", "package.json must use ESM");
assert(pkg.scripts?.["verify:foundation"] === "node scripts/verify-foundation.mjs", "Foundation verifier script is not wired.");
assert(pkg.scripts?.validate?.includes("verify:foundation"), "validate must include verify:foundation.");
assert(plugin.name === "cecilialabs-ffmpeg", "Unexpected plugin name");
assert(versionMatch, "VERSION constant not found");
assert(pkg.version === plugin.version, "package.json/plugin.json version mismatch");
assert(pkg.version === versionMatch[1], "package.json/src version mismatch");
assert(identity.currentImplementationVersion === pkg.version, "project identity version mismatch");
assert(identity.npmPackage === pkg.name, "project identity npm package mismatch");
assert(identity.binary === "cecilia-ffmpeg", "project identity CLI binary mismatch");
assert(identity.mcpBinary === undefined, "project identity must not expose a removed MCP binary");
assert(!identity.distribution?.includes("MCP Server"), "project identity must not list a removed MCP distribution");

const tsconfig = await readJson("tsconfig.json");
assert(tsconfig.compilerOptions?.strict === true, "TypeScript strict mode is not enabled");
assert(tsconfig.compilerOptions?.module === "NodeNext", "TypeScript module must be NodeNext");
assert(
  tsconfig.compilerOptions?.moduleResolution === "NodeNext",
  "TypeScript moduleResolution must be NodeNext",
);

const cliSource = await readText("src/cli/program.ts");
for (const flag of [
  "--output",
  "--overwrite",
  "--dry-run",
  "--json",
  "--quiet",
  "--verbose",
  "--ffmpeg-path",
  "--ffprobe-path",
  "--keep-temp",
]) {
  assert(cliSource.includes(flag), `Missing global option ${flag}`);
}

const sourceFiles = await walk("src/");
for (const file of sourceFiles) {
  if (!file.pathname.endsWith(".ts")) continue;
  const source = await readFile(file, "utf8");
  const relativePath = file.pathname.split("/src/")[1];
  const isRuntimeBoundary = relativePath === "core/command-result.ts";
  if (!isRuntimeBoundary) {
    assert(!/node:child_process|from\s+["']child_process["']/.test(source), `Direct child_process import outside runtime boundary in ${relativePath}`);
  }
}

console.log(`Foundation verification passed for ${pkg.name}@${pkg.version}`);
console.log(`Checked ${requiredFiles.length} required files and ${sourceFiles.length} source files.`);
