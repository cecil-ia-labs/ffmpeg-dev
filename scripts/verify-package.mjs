import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npmBinary = process.platform === "win32" ? "npm.cmd" : "npm";
const run = spawnSync(npmBinary, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});

if (run.status !== 0) {
  throw new Error(`npm pack --dry-run failed (${run.status ?? "unknown"}): ${run.stderr || run.stdout}`);
}

let report;
try {
  report = JSON.parse(run.stdout);
} catch (error) {
  throw new Error(`Unable to parse npm pack JSON output: ${run.stdout}`, { cause: error });
}

const files = new Set((report[0]?.files ?? []).map((entry) => String(entry.path).replace(/^package\//, "")));
const required = [
  "dist/cli.js",
  "dist/index.js",
  "dist/index.d.ts",
  "plugin.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "assets/icon.svg",
  "assets/icon-dark.svg",
  "assets/logo.svg",
  "assets/screenshots/cli-overview.svg",
  "assets/screenshots/skills-overview.svg",
  "docs/development/plugin-packaging.md",
  "skills/ffmpeg-environment/SKILL.md",
  "skills/ffmpeg-video-editing/SKILL.md",
  "skills/ffmpeg-audio/SKILL.md",
  "skills/ffmpeg-conversion/SKILL.md",
  "skills/ffmpeg-composition/SKILL.md",
  "skills/ffmpeg-streaming/SKILL.md",
  "skills/ffmpeg-diagnostics/SKILL.md",
  "skills/ffmpeg-pipelines/SKILL.md",
  "skills/ffmpeg-onboarding/SKILL.md",
  "skills/ffmpeg-onboarding/scripts/check.mjs",
  "skills/ffmpeg-onboarding/scripts/install.mjs",
  "skills/ffmpeg-workflow/SKILL.md",
];

for (const file of required) {
  if (!files.has(file)) throw new Error(`npm package is missing required file: ${file}`);
}

const cliEntry = await readFile(new URL("../dist/cli.js", import.meta.url), "utf8");
if (!cliEntry.startsWith("#!/usr/bin/env node")) {
  throw new Error("dist/cli.js must preserve the Node shebang for the npm bin executable.");
}
for (const file of files) {
  if (file === "docs/mcp.md" || /^dist\/mcp(?:\.|\/)/.test(file)) {
    throw new Error(`Removed MCP artifact leaked into npm package: ${file}`);
  }
}

if (process.platform !== "win32") {
  for (const relative of ["../dist/cli.js"]) {
    const mode = (await stat(new URL(relative, import.meta.url))).mode & 0o777;
    if ((mode & 0o111) === 0) {
      throw new Error(relative.replace("../", "") + " must be executable for npm link/global binary use.");
    }
  }
}

const deniedPrefixes = ["test/", "scripts/", "node_modules/"];
for (const file of files) {
  if (deniedPrefixes.some((prefix) => file.startsWith(prefix))) {
    throw new Error(`Repository-only path leaked into npm package: ${file}`);
  }
}

console.log(`Plugin packaging npm pack dry-run: PASS (${files.size} packaged files)`);
