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

const [pkg, lock, plugin, contract, commandTree, migrations] = await Promise.all([
  json("package.json"),
  json("package-lock.json"),
  json("plugin.json"),
  json("specs/stable-release-contract.json"),
  json("specs/command-tree.json"),
  json("test/fixtures/legacy-migration-map.json"),
]);

const versionSource = await text("src/version.ts");
const versionMatch = /VERSION\s*=\s*"([^"]+)"/.exec(versionSource);
assert(versionMatch?.[1], "src/version.ts does not expose VERSION.");

const versions = new Map([
  ["package.json", pkg.version],
  ["package-lock.json", lock.version],
  ["package-lock root package", lock.packages?.[""]?.version],
  ["plugin.json", plugin.version],
  ["src/version.ts", versionMatch[1]],
  ["stable release contract", contract.release],
]);

for (const [source, version] of versions) {
  assert(version === "1.0.0", source + " must declare stable release 1.0.0; received " + String(version));
}

assert(/^\d+\.\d+\.\d+$/.test(pkg.version), "Stable release version must be plain semantic versioning.");
assert(pkg.name === contract.package.name, "npm package identity drifted from stable contract.");
assert(pkg.bin?.[contract.package.binary] === "./dist/cli.js", "Stable CLI binary mapping changed.");
assert(pkg.engines?.node === contract.package.node, "Node runtime policy drifted from stable contract.");
assert(pkg.license === contract.package.license, "License drifted from stable contract.");
assert(pkg.publishConfig?.access === contract.package.access, "Scoped npm package must publish with public access.");
assert(plugin.name === contract.plugin.name, "Plugin identity drifted from stable contract.");
assert(pkg.exports?.["."]?.import === "./dist/index.js", "Stable package JS entrypoint changed.");
assert(pkg.exports?.["."]?.types === "./dist/index.d.ts", "Stable package type entrypoint changed.");

assert(commandTree.binary === contract.package.binary, "CLI binary name drifted from command-tree contract.");
assert(
  JSON.stringify(commandTree.globalOptions) === JSON.stringify(contract.cli.globalOptions),
  "Global CLI option contract changed."
);
assert(
  JSON.stringify(Object.keys(commandTree.commands)) === JSON.stringify(contract.cli.topLevelCommands),
  "Top-level CLI command contract changed."
);

assert(
  migrations.migrations?.length === contract.compatibility.historicalBashMigrations,
  "Historical Bash migration count changed."
);

for (const skill of contract.skills) {
  const skillText = await text(path.join("skills", skill, "SKILL.md"));
  assert(skillText.includes("@cecilialabs/ffmpeg"), skill + " no longer routes supported work through the toolkit.");
}

const sourceFiles = (await walk("src")).filter((file) => file.endsWith(".ts"));
for (const sourceFile of sourceFiles) {
  const source = await text(sourceFile);
  assert(
    !/legacy\/bash|\.sh(?:["'`\s]|$)/.test(source),
    "Stable runtime must not depend on historical shell scripts: " + sourceFile,
  );
}

const packageRoots = pkg.files ?? [];
for (const denied of ["legacy/", "test/", "scripts/", "node_modules/"]) {
  assert(
    !packageRoots.some((entry) => String(entry).startsWith(denied)),
    "Repository-only path is present in npm files allowlist: " + denied,
  );
}

assert(pkg.scripts?.["validate:release"]?.includes("npm run validate"), "Release validation must include the full validation suite.");
assert(pkg.scripts?.["validate:release"]?.includes("verify:release"), "Release validation must include stable release verification.");
assert(pkg.scripts?.["validate:release"]?.includes("verify:install"), "Release validation must include clean-install verification.");
assert(pkg.scripts?.["verify:install"]?.includes("scripts/verify-install.mjs"), "Clean-install verifier script is not wired.");
assert(pkg.scripts?.["smoke:platform"] === "node scripts/smoke-platform.mjs", "Platform smoke script is not wired.");
assert(pkg.scripts?.prepublishOnly === "npm run validate:release", "npm publication must use the release validation gate.");

for (const required of [
  "docs/platform-support.md",
  ".github/workflows/v1-release-validation.yml",
]) {
  await text(required);
}

const readme = await text("README.md");
assert(readme.includes("1.0.0"), "README must identify the v1.0.0 release line.");
assert(readme.includes("cecilia-ffmpeg"), "README must document the stable executable.");

console.log("Stable v1.0.0 release contract: PASS");
