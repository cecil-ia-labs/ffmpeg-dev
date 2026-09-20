import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return readFile(path.join(root, relative), "utf8");
}

const pkg = JSON.parse(await text("package.json"));

assert(pkg.bin?.["cecilia-ffmpeg"] === "./dist/cli.js", "Public CLI bin mapping is missing.");
assert(pkg.scripts?.["setup:cli"] === "node scripts/setup-local-cli.mjs", "Missing setup:cli script.");
assert(pkg.scripts?.["link:cli"] === "npm run build && npm link", "link:cli must build before npm link.");
assert(pkg.scripts?.["unlink:cli"] === "npm unlink --global @cecilialabs/ffmpeg", "Missing unlink:cli script.");
assert(pkg.scripts?.prepack === "npm run build", "prepack must build the distributable CLI.");
assert(pkg.scripts?.["verify:distribution"] === "node scripts/verify-distribution.mjs", "Missing distribution verifier.");
assert(pkg.scripts?.validate?.includes("verify:distribution"), "validate must include verify:distribution.");
assert(pkg.scripts?.postinstall === undefined, "The package must not mutate user shell configuration from postinstall.");

for (const relative of [
  "scripts/setup-local-cli.mjs",
  "scripts/publish-npm.sh",
  "src/cli.ts",
]) {
  assert((await stat(path.join(root, relative))).isFile(), "Missing distribution file: " + relative);
}

const setup = await text("scripts/setup-local-cli.mjs");
for (const token of ["Continue? [y/N]", "npm", "link:cli", ".bashrc", "cecilia-ffmpeg local CLI"]) {
  assert(setup.includes(token), "Local CLI setup is missing required behavior: " + token);
}

const publisher = await text("scripts/publish-npm.sh");
for (const token of [
  "npm run validate",
  "npm pack",
  "npm publish",
  "origin/master",
  "git tag -a",
  "git push origin",
]) {
  assert(publisher.includes(token), "Publish workflow is missing required behavior: " + token);
}

const cliEntry = await text("src/cli.ts");
assert(cliEntry.startsWith("#!/usr/bin/env node"), "Compiled CLI entrypoint must preserve the Node shebang.");

const packagedRoots = pkg.files ?? [];
assert(!packagedRoots.some((entry) => String(entry).startsWith("scripts")), "Repository release/setup scripts must stay out of the npm package.");

console.log("CLI installation and release workflow: PASS");
