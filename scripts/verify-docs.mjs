import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return await readFile(path.join(root, relative), "utf8");
}

const requiredDocs = [
  "docs/getting-started.md",
  "docs/installation.md",
  "docs/cli-reference.md",
  "docs/mcp.md",
  "docs/video.md",
  "docs/image.md",
  "docs/audio.md",
  "docs/conversion.md",
  "docs/composition.md",
  "docs/streaming.md",
  "docs/diagnostics.md",
  "docs/batch-processing.md",
  "docs/hardware-acceleration.md",
  "docs/migration-from-bash.md",
];

for (const relative of requiredDocs) {
  assert((await stat(path.join(root, relative))).isFile(), `Missing public documentation: ${relative}`);
  const content = await text(relative);
  assert(content.trim().length >= 300, `Documentation is unexpectedly thin: ${relative}`);
}

const cliReference = await text("docs/cli-reference.md");
const commandTree = JSON.parse(await text("specs/command-tree.json"));

function leafPaths(commands, prefix = "") {
  const result = [];
  for (const [name, spec] of Object.entries(commands)) {
    const current = prefix ? `${prefix} ${name}` : name;
    if (spec?.subcommands) result.push(...leafPaths(spec.subcommands, current));
    else result.push(current);
  }
  return result;
}

const publicLeaves = leafPaths(commandTree.commands)
  .filter((command) => command !== "environment install");
for (const command of publicLeaves) {
  assert(
    cliReference.includes(command),
    `CLI reference is missing public command: ${command}`,
  );
}
assert(cliReference.includes("environment install"), "Reserved environment install command must be documented.");

const migrationDoc = await text("docs/migration-from-bash.md");
const migrationMap = JSON.parse(await text("test/fixtures/legacy-migration-map.json"));
for (const migration of migrationMap.migrations) {
  const filename = path.basename(migration.legacy);
  assert(migrationDoc.includes(filename), `Migration guide is missing legacy script: ${filename}`);
}
assert(migrationMap.migrations.length === 21, "Documentation coverage expects all 21 historical migrations.");

const hardware = await text("docs/hardware-acceleration.md");
for (const token of ["--hardware auto", "NVENC", "NVDEC", "Quick Sync", "VAAPI", "VideoToolbox", "W_HARDWARE_SOFTWARE_FALLBACK"]) {
  assert(hardware.includes(token), "Hardware docs are missing current v1.2 behavior: " + token);
}

const installation = await text("docs/installation.md");
const gettingStarted = await text("docs/getting-started.md");
for (const [relative, content] of [["docs/installation.md", installation], ["docs/getting-started.md", gettingStarted]]) {
  assert(content.includes("npm install -g @cecilialabs/ffmpeg"), relative + " must recommend global installation.");
  assert(content.includes("npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg"), relative + " must document explicit no-global package-runner usage.");
  assert(!content.includes("npx @cecilialabs/ffmpeg"), relative + " must not use the ambiguous multi-bin npx shorthand.");
}

const readme = await text("README.md");
for (const relative of ["getting-started.md", "cli-reference.md", "mcp.md", "migration-from-bash.md"]) {
  assert(readme.includes(relative), `README documentation index is missing ${relative}`);
}

const packageJson = JSON.parse(await text("package.json"));
assert(packageJson.scripts?.["verify:docs"] === "node scripts/verify-docs.mjs", "Missing verify:docs package script.");
assert(packageJson.scripts?.validate?.includes("verify:docs"), "validate must include verify:docs.");

console.log(`Documentation coverage: PASS (${requiredDocs.length} guides, ${publicLeaves.length} public leaf commands, ${migrationMap.migrations.length} legacy mappings)`);
