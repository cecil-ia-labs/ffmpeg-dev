import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const skills = [
  "ffmpeg-environment",
  "ffmpeg-video-editing",
  "ffmpeg-audio",
  "ffmpeg-conversion",
  "ffmpeg-composition",
  "ffmpeg-streaming",
  "ffmpeg-diagnostics",
  "ffmpeg-pipelines",
  "ffmpeg-onboarding",
  "ffmpeg-workflow",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(relative) {
  return readFile(path.join(root, relative), "utf8");
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

const packageJson = JSON.parse(await read("package.json"));
assert(packageJson.scripts?.["verify:agent-workflows"] === "node scripts/verify-agent-workflows.mjs", "Agent workflow verifier is not wired.");
assert(packageJson.scripts?.validate?.includes("verify:agent-workflows"), "validate must include verify:agent-workflows.");

for (const skill of skills) {
  const skillText = await read(`skills/${skill}/SKILL.md`);
  assert(skillText.includes("## Associated scripts"), `${skill}: associated script routing is missing.`);
  assert(skillText.includes("cecilia-ffmpeg"), `${skill}: canonical CLI route is missing.`);
  assert(skillText.includes("npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg"), `${skill}: explicit npm-exec route is missing.`);
}

const currentSurfaceFiles = [
  "README.md",
  "plugin.json",
  "package.json",
  "docs/skill-catalog.md",
  "docs",
  "skills",
  "specs",
  "test",
];
const forbidden = /\bMCP\b|modelcontextprotocol|cecilia-ffmpeg-mcp|src\/mcp|\bmedia_[a-z_]+\b/;
const contradictoryExecution = [
  [/\bcecilia-ffmpeg\s+run\s+<pipeline>/i, "removed top-level pipeline action"],
  [/\bnpx\s+@cecilialabs\/ffmpeg\b/i, "ambiguous multi-bin package runner"],
  [/\bnpx\s+tsx\s+src\/cli\.ts\b/i, "obsolete source-mode CLI invocation"],
];
const files = [];
for (const relative of currentSurfaceFiles) {
  if (relative.includes(".")) files.push(relative);
  else files.push(...await walk(relative));
}

for (const relative of files) {
  const source = await read(relative);
  assert(!forbidden.test(source), `Removed MCP execution reference remains in current surface: ${relative}.`);
  if (relative.startsWith("docs/") || relative.startsWith("skills/")) {
    for (const [pattern, description] of contradictoryExecution) {
      assert(!pattern.test(source), `${description} remains in current guidance: ${relative}.`);
    }
  }
}

const workflow = await read("skills/ffmpeg-workflow/SKILL.md");
assert(workflow.includes("scripts/run.mjs"), "Workflow Skill must identify the script execution boundary.");
assert(workflow.includes("When execution is available"), "Workflow Skill must preserve context-aware execution guidance.");

const agentGuide = await read("docs/agent-workflows.md");
for (const token of ["execution context", "associated script", "FFprobe", "dry-run", "structured result"]) {
  assert(agentGuide.toLowerCase().includes(token.toLowerCase()), `Agent workflow guide is missing ${token}.`);
}
assert(!agentGuide.includes("cecilia-ffmpeg run <pipeline>"), "Agent workflow guide documents the removed top-level pipeline action.");

const onboarding = await read("skills/ffmpeg-onboarding/SKILL.md");
assert(onboarding.includes("scripts/check.mjs"), "Onboarding Skill must expose its readiness script.");
assert(onboarding.includes("scripts/install.mjs"), "Onboarding Skill must expose its installation script.");

console.log(`Agent workflow surfaces: PASS (${skills.length} Skills, CLI/scripts only)`);
