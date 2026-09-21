import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return readFile(path.join(root, relative), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

async function walk(relative) {
  const absolute = path.join(root, relative);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walk(child));
    else files.push(child);
  }
  return files;
}

const [pkg, lock, plugin, identity, contract, commandTree, cliSpec, actionRegistry] = await Promise.all([
  json("package.json"),
  json("package-lock.json"),
  json("plugin.json"),
  json("specs/project-identity.json"),
  json("specs/stable-release-contract.json"),
  json("specs/command-tree.json"),
  text("src/cli/command-spec.ts"),
  text("src/cli/action-registry.ts"),
]);

assert(pkg.scripts?.["verify:cli-surface"] === "node scripts/verify-cli-surface.mjs", "CLI surface verifier is not wired.");
assert(pkg.scripts?.validate?.includes("verify:cli-surface"), "validate must include verify:cli-surface.");
assert(pkg.bin?.["cecilia-ffmpeg"] === "./dist/cli.js", "The canonical CLI binary is missing.");
assert(pkg.bin?.["cecilia-ffmpeg-mcp"] === undefined, "The removed MCP binary must not be published.");
assert(pkg.exports?.["./mcp"] === undefined, "The removed MCP package export must not be published.");
assert(pkg.dependencies?.["@modelcontextprotocol/server"] === undefined, "The removed MCP SDK must not remain a runtime dependency.");
assert(!pkg.keywords?.some((keyword) => /mcp/i.test(keyword)), "The removed MCP surface must not remain in package keywords.");
assert(lock.packages?.["@modelcontextprotocol/server"] === undefined, "The lockfile must not retain the removed MCP SDK.");
assert(!JSON.stringify(lock).toLowerCase().includes("modelcontextprotocol"), "The lockfile contains removed MCP dependencies.");
assert(plugin.extensions?.["com.cecilialabs.ffmpeg"]?.mcp === undefined, "The plugin must not expose MCP metadata.");
assert(identity.mcpBinary === undefined, "Project identity must not expose an MCP binary.");
assert(contract.mcp === undefined, "Stable release contract must not expose MCP metadata.");
assert(!Object.hasOwn(contract.package ?? {}, "mcpBinary"), "Stable package contract must not expose an MCP binary.");
assert(!Object.hasOwn(contract.package ?? {}, "mcpExport"), "Stable package contract must not expose an MCP export.");
assert(!Object.hasOwn(contract.pipeline ?? {}, "mcpTool"), "Pipeline contract must be CLI-only.");

assert(!Object.hasOwn(commandTree.commands, "run"), "The removed top-level run command is still in command-tree.json.");
assert(!cliSpec.includes('syntax: "run <pipeline>"'), "The removed top-level run command is still registered.");
assert(!actionRegistry.includes('"cecilia-ffmpeg run"'), "The removed top-level run action is still registered.");
assert(cliSpec.includes('syntax: "pipeline [tokens...]"'), "The namespaced pipeline command is missing.");
assert(actionRegistry.includes('"cecilia-ffmpeg pipeline"'), "The namespaced pipeline action is missing.");

const sourceFiles = (await walk("src")).filter((file) => file.endsWith(".ts"));
for (const relative of sourceFiles) {
  const source = await text(relative);
  assert(!/\bMCP\b|modelcontextprotocol|cecilia-ffmpeg-mcp|src\/mcp/i.test(source), `Removed MCP reference remains in ${relative}.`);
}

console.log(`CLI surface: PASS (${sourceFiles.length} TypeScript source files, CLI/scripts only)`);
