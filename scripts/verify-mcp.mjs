import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const expectedTools = [
  "media_probe",
  "media_trim",
  "media_convert",
  "media_concat",
  "media_attach_audio",
  "media_remove_silence",
  "media_generate_silence",
  "media_restore",
  "media_run_pipeline",
  "media_diagnose",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return readFile(path.join(root, relative), "utf8");
}

const pkg = JSON.parse(await text("package.json"));
const plugin = JSON.parse(await text("plugin.json"));

const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(pkg.version);
assert(versionMatch, "MCP verification requires a plain semantic package version.");
const [, majorText, minorText] = versionMatch;
const major = Number(majorText);
const minor = Number(minorText);
assert(
  major > 1 || (major === 1 && minor >= 1),
  "MCP server requires package version 1.1.0 or newer.",
);
assert(plugin.version === pkg.version, "MCP verification requires package/plugin version alignment.");
assert(pkg.dependencies?.["@modelcontextprotocol/server"] === "^2.0.0", "MCP server must use the stable v2 TypeScript server SDK.");
assert(pkg.bin?.["cecilia-ffmpeg-mcp"] === "./dist/mcp.js", "Missing published MCP stdio binary.");
assert(pkg.exports?.["./mcp"]?.import === "./dist/mcp/index.js", "Missing public ./mcp JS export.");
assert(pkg.exports?.["./mcp"]?.types === "./dist/mcp/index.d.ts", "Missing public ./mcp type export.");
assert(pkg.scripts?.mcp === "tsx src/mcp.ts", "Missing MCP development script.");
assert(pkg.scripts?.["verify:mcp"] === "node scripts/verify-mcp.mjs", "Missing verify:mcp script.");
assert(pkg.scripts?.validate?.includes("verify:mcp"), "validate must include verify:mcp.");

for (const relative of [
  "src/mcp.ts",
  "src/mcp/server.ts",
  "src/mcp/adapters.ts",
  "src/mcp/schemas.ts",
  "src/mcp/runtime.ts",
  "src/mcp/index.ts",
  "test/mcp/schemas.test.ts",
  "test/mcp/adapters.integration.test.ts",
  "docs/mcp.md",
]) {
  assert((await stat(path.join(root, relative))).isFile(), "Missing MCP file: " + relative);
}

const entry = await text("src/mcp.ts");
assert(entry.startsWith("#!/usr/bin/env node"), "MCP executable must preserve the Node shebang.");
assert(entry.includes("@modelcontextprotocol/server/stdio"), "MCP executable must use the official stdio transport.");
assert(entry.includes("serveStdio"), "MCP executable must use serveStdio for the 2026 protocol-aware stdio path.");
assert(!entry.includes("console.log"), "MCP stdio executable must never write logs to stdout.");

const server = await text("src/mcp/server.ts");
for (const tool of expectedTools) {
  assert(server.includes(`"${tool}"`), "MCP server is missing tool: " + tool);
}

const adapters = await text("src/mcp/adapters.ts");
for (const domainCall of [
  "probeMedia(",
  "trimVideoRange(",
  "convertFile(",
  "concatMedia(",
  "attachAudio(",
  "removeSilence(",
  "generateSilence(",
  "upscaleVideo(",
  "executePipeline(",
  "diagnoseMedia(",
]) {
  assert(adapters.includes(domainCall), "MCP adapter does not reuse domain function: " + domainCall);
}
assert(!adapters.includes("/cli/") && !adapters.includes("../cli"), "MCP must not route through CLI adapters.");

const mcpDir = path.join(root, "src/mcp");
for (const entryInfo of await readdir(mcpDir, { withFileTypes: true })) {
  if (!entryInfo.isFile() || !entryInfo.name.endsWith(".ts")) continue;
  const source = await readFile(path.join(mcpDir, entryInfo.name), "utf8");
  assert(!/node:child_process|from\s+["']child_process["']/.test(source), "MCP must not create a second process-execution boundary: " + entryInfo.name);
}

const extension = plugin.extensions?.["com.cecilialabs.ffmpeg"]?.mcp;
assert(extension?.binary === "cecilia-ffmpeg-mcp", "Plugin extension MCP binary metadata mismatch.");
assert(extension?.transport === "stdio", "Milestone 16 MCP transport must be stdio.");
assert(JSON.stringify(extension?.tools) === JSON.stringify(expectedTools), "Plugin MCP tool catalog mismatch.");

console.log(`MCP server: PASS (${expectedTools.length} tools, stdio, shared domain implementation)`);
